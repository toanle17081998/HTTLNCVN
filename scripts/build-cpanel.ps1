param(
    [Parameter(Mandatory = $true)]
    [string]$AppUrl,

    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,

    [ValidateSet("mysql", "postgresql")]
    [string]$DatabaseProvider = "postgresql"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$artifactsRoot = Join-Path $repoRoot "artifacts"
New-Item -ItemType Directory -Path $artifactsRoot -Force | Out-Null

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running."
}

$dockerArguments = @(
    "run",
    "--rm",
    "--env", "NEXT_PUBLIC_APP_URL=$AppUrl",
    "--env", "NEXT_PUBLIC_API_URL=$ApiUrl",
    "--env", "DATABASE_PROVIDER=$DatabaseProvider",
    "--volume", "${repoRoot}:/src:ro",
    "--volume", "${artifactsRoot}:/output",
    "node:22-bookworm",
    "bash",
    "/src/scripts/build-cpanel-linux.sh"
)

& docker @dockerArguments
if ($LASTEXITCODE -ne 0) {
    throw "cPanel build failed with exit code $LASTEXITCODE."
}

Write-Host "Created:" -ForegroundColor Green
Write-Host "  $artifactsRoot\frontend-prod.zip"
Write-Host "  $artifactsRoot\backend-prod.zip"
