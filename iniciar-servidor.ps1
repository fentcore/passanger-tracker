# Inicia Passenger Tracker en modo producción.
# Dejá esta ventana abierta mientras quieras que la app esté disponible.
# Para detenerla, cerrá esta ventana o presioná Ctrl+C.

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location $PSScriptRoot

Write-Host "Iniciando Passenger Tracker..." -ForegroundColor Cyan
npm run start
