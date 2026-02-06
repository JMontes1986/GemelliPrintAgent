# Script para habilitar el log de PrintService en Windows 11
# Ejecutar como Administrador

Write-Host "=== Habilitando Microsoft-Windows-PrintService/Operational ===" -ForegroundColor Cyan

# Método 1: PowerShell
try {
    wevtutil set-log "Microsoft-Windows-PrintService/Operational" /enabled:true
    Write-Host "✓ Log habilitado vía PowerShell" -ForegroundColor Green
} catch {
    Write-Warning "Error habilitando log vía PowerShell: $_"
}

# Método 2: Registro (como respaldo)
$regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\EventLog\Microsoft-Windows-PrintService/Operational"
if (Test-Path $regPath) {
    Set-ItemProperty -Path $regPath -Name "Enabled" -Value 1 -Type DWord
    Write-Host "✓ Configuración de registro actualizada" -ForegroundColor Green
}

# Verificar
$logStatus = wevtutil get-log "Microsoft-Windows-PrintService/Operational"
if ($logStatus -match "enabled: true") {
    Write-Host "`n✓ VERIFICACIÓN EXITOSA: Log habilitado correctamente" -ForegroundColor Green
} else {
    Write-Warning "`n⚠ Log podría no estar habilitado. Verificar manualmente en Event Viewer."
}

Write-Host "`n=== Instrucciones adicionales ===" -ForegroundColor Cyan
Write-Host "1. Abrir Event Viewer (eventvwr.msc)"
Write-Host "2. Navegar a: Applications and Services Logs > Microsoft > Windows > PrintService > Operational"
Write-Host "3. Click derecho > Enable Log"
Write-Host "4. Realizar una impresión de prueba"
Write-Host "5. Verificar que aparezcan eventos con ID 307 (Document printed)"
