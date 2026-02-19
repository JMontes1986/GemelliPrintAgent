import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function sanitizeFileSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        pcName: true,
        token: true
      }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gemelli-print-agent-web.vercel.app'

    const script = `# ============================================================
# Gemelli Print Agent - Instalador Automatico
# PC: ${agent.pcName}
# Generado: ${new Date().toISOString()}
# Ejecutar como Administrador en PowerShell
# ============================================================

$ApiBaseUrl = "${appUrl}"
$AgentToken = "${agent.token}"
$ServiceName = "GemelliPrintAgent"
$InstallPath = "C:\\Program Files\\GemelliPrintAgent"
$DataPath = "$env:ProgramData\\GemelliPrintAgent"
$ReleaseUrl = "https://github.com/JMontes1986/GemelliPrintAgent/releases/latest/download/GemelliPrintAgent-win-x64.zip"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Gemelli Print Agent - Instalando en ${agent.pcName}" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador." -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

# Detener y eliminar servicio existente si existe
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Deteniendo servicio existente..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "Servicio anterior eliminado." -ForegroundColor Green
}

# Crear directorios
Write-Host "Creando directorios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
New-Item -ItemType Directory -Force -Path "$DataPath\\logs" | Out-Null

# Descargar agente desde GitHub Releases
Write-Host "Descargando Gemelli Print Agent desde GitHub..." -ForegroundColor Yellow
$ZipPath = "$env:TEMP\\GemelliPrintAgent.zip"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $ReleaseUrl -OutFile $ZipPath -UseBasicParsing
    Write-Host "Descarga completada." -ForegroundColor Green
} catch {
    Write-Host "ERROR descargando el agente: $_" -ForegroundColor Red
    Write-Host "Verifica tu conexion a internet e intenta nuevamente." -ForegroundColor Yellow
    pause
    exit 1
}

# Extraer archivos
Write-Host "Instalando archivos en $InstallPath..." -ForegroundColor Yellow
Expand-Archive -Path $ZipPath -DestinationPath $InstallPath -Force
Remove-Item $ZipPath -Force
Write-Host "Archivos instalados." -ForegroundColor Green

# Crear appsettings.json con token especifico de este equipo
Write-Host "Configurando el agente para ${agent.pcName}..." -ForegroundColor Yellow
$AppSettings = @"
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "ApiBaseUrl": "$ApiBaseUrl",
  "AgentToken": "$AgentToken"
}
"@
Set-Content -Path "$InstallPath\\appsettings.json" -Value $AppSettings -Encoding UTF8
Write-Host "Configuracion guardada." -ForegroundColor Green

# Verificar que el ejecutable existe
$ExePath = "$InstallPath\\GemelliPrintAgent.exe"
if (-not (Test-Path $ExePath)) {
    Write-Host "ERROR: No se encontro el ejecutable en $ExePath" -ForegroundColor Red
    Write-Host "Verifica que el archivo ZIP descargado contiene GemelliPrintAgent.exe" -ForegroundColor Yellow
    pause
    exit 1
}

# Instalar como servicio de Windows
Write-Host "Instalando servicio de Windows..." -ForegroundColor Yellow
New-Service -Name $ServiceName \`
    -DisplayName "Gemelli Print Agent" \`
    -Description "Agente de monitoreo de impresiones - Colegio Gemelli" \`
    -BinaryPathName $ExePath \`
    -StartupType Automatic | Out-Null

# Habilitar log de impresion de Windows (necesario para capturar eventos)
Write-Host "Habilitando log de impresion de Windows..." -ForegroundColor Yellow
try {
    $LogName = "Microsoft-Windows-PrintService/Operational"
    $Log = New-Object System.Diagnostics.Eventing.Reader.EventLogConfiguration $LogName
    $Log.IsEnabled = $true
    $Log.SaveChanges()
    Write-Host "Log de impresion habilitado." -ForegroundColor Green
} catch {
    Write-Host "ADVERTENCIA: No se pudo habilitar el log de impresion automaticamente." -ForegroundColor Yellow
    Write-Host "Habilitalo manualmente: Visor de eventos > Registros de aplicaciones y servicios > Microsoft > Windows > PrintService > Operational > Habilitar registro" -ForegroundColor Yellow
}

# Iniciar el servicio
Write-Host "Iniciando el servicio..." -ForegroundColor Yellow
Start-Service -Name $ServiceName
Start-Sleep -Seconds 3

$service = Get-Service -Name $ServiceName
if ($service.Status -eq "Running") {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Gemelli Print Agent instalado y funcionando!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  PC:      ${agent.pcName}" -ForegroundColor White
    Write-Host "  API URL: $ApiBaseUrl" -ForegroundColor White
    Write-Host "  Logs:    $DataPath\\logs" -ForegroundColor White
    Write-Host ""
    Write-Host "  El agente enviara los datos de impresion cada 5 minutos." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ADVERTENCIA: El servicio no inicio correctamente." -ForegroundColor Red
    Write-Host "Revisa los logs en: $DataPath\\logs" -ForegroundColor Yellow
}

pause
`

    const filename = `instalar-agente-${sanitizeFileSegment(agent.pcName) || agent.id}.ps1`

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Agent-Token': agent.token,
        'X-Agent-Name': agent.pcName
      }
    })
  } catch (error) {
    console.error('Error generating installer script:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
