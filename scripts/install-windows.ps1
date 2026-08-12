$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Cmd = Join-Path $Root "scripts\start-hectron.cmd"

@"
@echo off
cd /d "$Root"
call npm run agent
"@ | Set-Content -Encoding ASCII $Cmd

schtasks /Create /TN "HECTRON Local Agent" /SC ONLOGON /TR ""$Cmd"" /F | Out-Null
Write-Host "✅ HECTRON Local Agent instalado para iniciar al iniciar sesión."