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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const configJson = JSON.stringify(
      {
        Logging: {
          LogLevel: {
            Default: 'Information',
            'Microsoft.Hosting.Lifetime': 'Information'
          }
        },
        ApiBaseUrl: appUrl,
        AgentToken: agent.token
      },
      null,
      2
    )

    const scriptContent = `# Instalador automático del agente GemelliPrintAgent\n# Equipo: ${agent.pcName}\n\n$ErrorActionPreference = "Stop"\n\n$msiPath = Join-Path $PSScriptRoot "GemelliPrintAgent.msi"\nif (-not (Test-Path $msiPath)) {\n  Write-Host "No se encontró GemelliPrintAgent.msi en la misma carpeta del script." -ForegroundColor Red\n  Write-Host "Copia el MSI junto a este script y vuelve a ejecutar." -ForegroundColor Yellow\n  exit 1\n}\n\nWrite-Host "Instalando GemelliPrintAgent..." -ForegroundColor Cyan\nStart-Process -FilePath "msiexec.exe" -ArgumentList "/i \"$msiPath\" /qn" -Wait\n\n$configPath = "C:\\Program Files\\GemelliPrintAgent\\appsettings.json"\n$configDirectory = Split-Path -Parent $configPath\nif (-not (Test-Path $configDirectory)) {\n  New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null\n}\n\n@'\n${configJson}\n'@ | Set-Content -Path $configPath -Encoding UTF8\n\ntry {\n  Restart-Service -Name "GemelliPrintAgent" -ErrorAction Stop\n  Write-Host "Servicio reiniciado correctamente." -ForegroundColor Green\n} catch {\n  Write-Host "No fue posible reiniciar automáticamente el servicio. Reinícialo manualmente desde Services." -ForegroundColor Yellow\n}\n\nWrite-Host "Instalación finalizada para el equipo ${agent.pcName}." -ForegroundColor Green\nWrite-Host "Configuración guardada en: $configPath" -ForegroundColor Gray\n`

    const filename = `instalar-agente-${sanitizeFileSegment(agent.pcName) || agent.id}.ps1`

    return new NextResponse(scriptContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating installer script:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
