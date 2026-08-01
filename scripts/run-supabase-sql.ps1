# ============================================================
# Aplica SQL no Supabase da MATRIZ via Management API.
# Lê o token de .env (SUPABASE_ACCESS_TOKEN) — NUNCA colocar o
# token em arquivos versionados.
#
# Uso:
#   .\run-supabase-sql.ps1 -File "supabase\migrations\0005_users_management.sql"
#   .\run-supabase-sql.ps1 -Query "select now()"
# ============================================================
param(
  [string]$File,
  [string]$Query
)

$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path $envPath)) { throw '.env não encontrado.' }
$envLine = (Get-Content $envPath | Where-Object { $_ -match '^SUPABASE_ACCESS_TOKEN=' } | Select-Object -First 1)
if (-not $envLine) { throw 'SUPABASE_ACCESS_TOKEN não encontrado no .env.' }
$token = $envLine -replace '^SUPABASE_ACCESS_TOKEN=', ''
$projectRef = 'lqbfejbnnpukwiipwfxy'

if (-not $Query -and -not $File) { throw 'Informe -File ou -Query.' }
if ($Query -and $File) { throw 'Informe apenas um: -File ou -Query.' }

if ($File) {
  $Query = [System.IO.File]::ReadAllText((Resolve-Path $File), [System.Text.Encoding]::UTF8)
}

Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = 10000000
$body = $ser.Serialize(@{ query = $Query })

$headers = @{ Authorization = "Bearer $token" }
$resp = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$projectRef/database/query" `
  -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType 'application/json'

if ($null -eq $resp) {
  Write-Output 'OK — SQL aplicado (sem retorno).'
} else {
  $resp | ConvertTo-Json -Depth 6
}
