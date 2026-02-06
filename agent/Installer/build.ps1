# Build script para WiX v4

param(
    [string]$ApiBaseUrl = "https://your-vercel-app.vercel.app",
    [string]$AgentToken = ""
)

Write-Host "=== Building Gemelli Print Agent ===" -ForegroundColor Cyan

# 1. Publicar agente .NET
Write-Host "Publishing .NET agent..." -ForegroundColor Yellow
$publishDir = ".\publish"
Remove-Item -Path $publishDir -Recurse -Force -ErrorAction SilentlyContinue

dotnet publish ..\GemelliPrintAgent\GemelliPrintAgent.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -o $publishDir

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error en dotnet publish"
    exit 1
}

# 2. Actualizar appsettings.json con parámetros
Write-Host "Updating appsettings.json..." -ForegroundColor Yellow
$appSettingsPath = Join-Path $publishDir "appsettings.json"
$appSettings = Get-Content $appSettingsPath | ConvertFrom-Json
$appSettings.ApiBaseUrl = $ApiBaseUrl
$appSettings.AgentToken = $AgentToken
$appSettings | ConvertTo-Json | Set-Content $appSettingsPath

# 3. Build MSI con WiX v4
Write-Host "Building MSI with WiX v4..." -ForegroundColor Yellow
wix build Product.wxs `
    -d PublishDir=$publishDir `
    -ext WixToolset.UI.wixext `
    -o GemelliPrintAgent.msi

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error en WiX build"
    exit 1
}

Write-Host "=== Build completado ===" -ForegroundColor Green
Write-Host "MSI: GemelliPrintAgent.msi" -ForegroundColor Green
