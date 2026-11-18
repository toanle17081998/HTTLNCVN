param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$BackupDirectory = (Join-Path $PSScriptRoot "..\backups"),
  [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) {
  throw "DATABASE_URL is required. Set it in the environment or pass -DatabaseUrl."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump was not found. Install PostgreSQL client tools and add them to PATH."
}

$resolvedRoot = [IO.Path]::GetFullPath($BackupDirectory)
New-Item -ItemType Directory -Force -Path $resolvedRoot | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputPath = Join-Path $resolvedRoot "htnc-$timestamp.dump"

& $pgDump.Source --dbname=$DatabaseUrl --format=custom --no-owner --no-privileges --file=$outputPath
if ($LASTEXITCODE -ne 0) {
  throw "Database backup failed."
}

if ($RetentionDays -gt 0) {
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -LiteralPath $resolvedRoot -Filter "htnc-*.dump" -File |
    Where-Object { $_.LastWriteTime -lt $cutoff -and $_.FullName.StartsWith($resolvedRoot) } |
    Remove-Item -Force
}

Write-Output $outputPath

