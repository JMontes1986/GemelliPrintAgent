'use client'

import { useState } from 'react'

export default function DescargarAgentePage() {
  const [copied, setCopied] = useState(false)

  const apiBaseUrl = 'https://gemelli-print-agent-web.vercel.app'
  const agentToken = process.env.NEXT_PUBLIC_AGENT_TOKEN || 'token-pc1-9a8b7c6d'

  const scriptContent = `# Gemelli Print Agent - Instalador Automatico
# Ejecutar como Administrador en PowerShell

$ApiBaseUrl = "${apiBaseUrl}"
$AgentToken = "${agentToken}"
$ServiceName = "GemelliPrintAgent"
$InstallPath = "C:\\Program Files\\GemelliPrintAgent"
$DataPath = "$env:ProgramData\\GemelliPrintAgent"
$ReleaseUrl = "https://github.com/JMontes1986/GemelliPrintAgent/releases/latest/download/GemelliPrintAgent-win-x64.zip"

if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Ejecutar como Administrador" -ForegroundColor Red; pause; exit 1
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) { Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue; sc.exe delete $ServiceName | Out-Null; Start-Sleep -Seconds 2 }

New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path "$DataPath\\logs" | Out-Null

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ZipPath = "$env:TEMP\\GemelliPrintAgent.zip"
Invoke-WebRequest -Uri $ReleaseUrl -OutFile $ZipPath -UseBasicParsing
Expand-Archive -Path $ZipPath -DestinationPath $InstallPath -Force
Remove-Item $ZipPath -Force

$cfg = '{"Logging":{"LogLevel":{"Default":"Information"}},"ApiBaseUrl":"' + $ApiBaseUrl + '","AgentToken":"' + $AgentToken + '"}'
Set-Content -Path "$InstallPath\\appsettings.json" -Value $cfg -Encoding UTF8

New-Service -Name $ServiceName -DisplayName "Gemelli Print Agent" -BinaryPathName "$InstallPath\\GemelliPrintAgent.exe" -StartupType Automatic | Out-Null

$log = New-Object System.Diagnostics.Eventing.Reader.EventLogConfiguration "Microsoft-Windows-PrintService/Operational"
$log.IsEnabled = $true; $log.SaveChanges()

Start-Service -Name $ServiceName
Write-Host "Gemelli Print Agent instalado correctamente!" -ForegroundColor Green
pause`

  const downloadScript = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'instalar-gemelli-agent.ps1'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyScript = () => {
    navigator.clipboard.writeText(scriptContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Instalar Agente de Impresión</h1>
      <p className="text-gray-500 mb-8">
        Descarga y ejecuta el instalador en cada PC que tenga impresoras conectadas.
      </p>

      {/* Pasos */}
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
          <div>
            <p className="font-semibold text-gray-800">Descarga el instalador</p>
            <p className="text-sm text-gray-500">Haz clic en el botón de abajo para obtener el script configurado.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
          <div>
            <p className="font-semibold text-gray-800">Copia el archivo al PC destino</p>
            <p className="text-sm text-gray-500">Lleva el archivo <code className="bg-gray-100 px-1 rounded">.ps1</code> al equipo donde están las impresoras.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
          <div>
            <p className="font-semibold text-gray-800">Ejecuta como Administrador</p>
            <p className="text-sm text-gray-500">
              Clic derecho en el archivo → <strong>Ejecutar con PowerShell</strong> → Aceptar permisos de administrador.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración actual */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Configuración incluida</p>
        <div className="space-y-1">
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500 w-20">API URL:</span>
            <code className="text-blue-600">{apiBaseUrl}</code>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500 w-20">Token:</span>
            <code className="text-green-600">{agentToken.substring(0, 8)}••••</code>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={downloadScript}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          ⬇ Descargar Instalador (.ps1)
        </button>
        <button
          onClick={copyScript}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        El agente se instala como servicio de Windows y se inicia automáticamente con el sistema.
      </p>
    </div>
  )
}
