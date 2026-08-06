param(
    [ValidateSet("all", "frontend", "backend")]
    [string]$Target = "all",

    [string]$ArtifactsDir = ""
)

$ErrorActionPreference = "Stop"

$env:NODE_ENV = "production"

function Write-Stage([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-NativeOrThrow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @()
    )

    $resolvedFilePath = switch ($FilePath.ToLowerInvariant()) {
        "npm" { "npm.cmd" }
        "npx" { "npx.cmd" }
        "pnpm" { "pnpm.cmd" }
        default { $FilePath }
    }

    $process = Start-Process -FilePath $resolvedFilePath -ArgumentList $Arguments -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0) {
        throw "Command failed with exit code $($process.ExitCode): $resolvedFilePath $($Arguments -join ' ')"
    }
}

function Reset-Directory([string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Copy-IfExists([string]$Source, [string]$Destination) {
    if (Test-Path -LiteralPath $Source) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
    }
}

function New-TarGz([string]$SourceDir, [string]$DestinationFile) {
    if (Test-Path -LiteralPath $DestinationFile) {
        Remove-Item -LiteralPath $DestinationFile -Force
    }

    # Clean up broken symlinks / reparse points in the source directory to prevent tar errors on Windows
    Write-Host "Checking for broken symlinks in $SourceDir..."
    Get-ChildItem -LiteralPath $SourceDir -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Attributes -match "ReparsePoint" } | ForEach-Object {
        if (-not (Test-Path -LiteralPath $_.FullName)) {
            Write-Host "Removing broken symlink/reparse point: $($_.FullName)"
            if ($_.PsIsContainer) {
                cmd /c rmdir `"$($_.FullName)`" 2>$null
            } else {
                cmd /c del /f /q `"$($_.FullName)`" 2>$null
            }
        }
    }

    $payloadStats = Get-ChildItem -LiteralPath $SourceDir -Recurse -Force -File | Measure-Object -Property Length -Sum
    $payloadMiB = [Math]::Round($payloadStats.Sum / 1MB, 1)
    Write-Host "Compressing $($payloadStats.Count) files ($payloadMiB MiB) with fast gzip..."
    
    # Run tar directly allowing exit code 1 (warnings about skipped files or non-fatal symlink errors)
    $resolvedFilePath = "tar"
    $arguments = @(
        "-czf",
        $DestinationFile,
        "--options",
        "gzip:compression-level=1",
        "-C",
        $SourceDir,
        "."
    )
    $process = Start-Process -FilePath $resolvedFilePath -ArgumentList $arguments -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0 -and $process.ExitCode -ne 1) {
        throw "tar failed with exit code $($process.ExitCode) compiling $DestinationFile"
    }
}

$repoRoot = $PSScriptRoot
if ($repoRoot.EndsWith("scripts")) {
    $repoRoot = (Resolve-Path (Join-Path $repoRoot "..")).Path
}
$artifactsRoot = if ($ArtifactsDir) {
    [System.IO.Path]::GetFullPath($ArtifactsDir)
} else {
    Join-Path $repoRoot "artifacts"
}
$stagingRoot = Join-Path $repoRoot ".deploy"
$frontendRoot = Join-Path $repoRoot "apps/web"
$backendRoot = Join-Path $repoRoot "apps/api"

New-Item -ItemType Directory -Path $artifactsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

if ($Target -in @("all", "frontend")) {
    $frontendStage = Join-Path $stagingRoot "frontend"
    $frontendArtifact = Join-Path $artifactsRoot "frontend-prod.tar.gz"

    Write-Stage "Building frontend production bundle"
    $rootEnvProduction = Join-Path $repoRoot ".env.production"
    if (Test-Path -LiteralPath $rootEnvProduction) {
        Write-Host "Found .env.production at root, copying to frontend root before build"
        Copy-Item -LiteralPath $rootEnvProduction -Destination (Join-Path $frontendRoot ".env.production") -Force
    }

    Push-Location $frontendRoot
    try {
        if (Test-Path -LiteralPath ".next") {
            Remove-Item -LiteralPath ".next" -Recurse -Force
        }
        Invoke-NativeOrThrow -FilePath pnpm -Arguments @("run", "build")
    } finally {
        Pop-Location
    }

    Write-Stage "Staging frontend deploy payload"
    Reset-Directory $frontendStage

    $webRootStage = Join-Path $frontendStage "web"
    New-Item -ItemType Directory -Path $webRootStage -Force | Out-Null

    # Copy Next.js standalone build to staging
    if (Test-Path -LiteralPath (Join-Path $frontendRoot ".next\standalone")) {
        $nodeModulesSrc = Join-Path $frontendRoot ".next\standalone\node_modules"
        $nodeModulesDest = Join-Path $webRootStage "node_modules"
        $exitCode = (Start-Process -FilePath robocopy -ArgumentList @($nodeModulesSrc, $nodeModulesDest, "/E", "/NFL", "/NDL", "/NJH", "/NJS") -Wait -NoNewWindow -PassThru).ExitCode
        if ($exitCode -ge 8) {
            throw "Robocopy failed with exit code $exitCode copying node_modules from standalone build"
        }

        $webAppSrc = Join-Path $frontendRoot ".next\standalone\apps\web"
        $exitCode = (Start-Process -FilePath robocopy -ArgumentList @($webAppSrc, $webRootStage, "/E", "/NFL", "/NDL", "/NJH", "/NJS") -Wait -NoNewWindow -PassThru).ExitCode
        if ($exitCode -ge 8) {
            throw "Robocopy failed with exit code $exitCode copying standalone web workspace"
        }
    } else {
        throw "Next.js standalone build not found at $($frontendRoot)\.next\standalone. Check next.config.ts configuration."
    }

    New-Item -ItemType Directory -Path (Join-Path $webRootStage ".next") -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $frontendRoot ".next\static") -Destination (Join-Path $webRootStage ".next") -Recurse -Force
    Copy-IfExists (Join-Path $frontendRoot "public") $webRootStage
    Copy-IfExists (Join-Path $frontendRoot ".htaccess") $webRootStage
    Copy-IfExists (Join-Path $frontendRoot ".env.production") (Join-Path $webRootStage ".env")
    Copy-IfExists (Join-Path $frontendRoot ".env.production") (Join-Path $webRootStage ".env.production")

    Write-Stage "Creating frontend artifact"
    New-TarGz $frontendStage $frontendArtifact
    Write-Host "Created $frontendArtifact" -ForegroundColor Green
}

if ($Target -in @("all", "backend")) {
    $backendStage = Join-Path $stagingRoot "backend-prod"
    $backendArtifact = Join-Path $artifactsRoot "backend-prod.tar.gz"

    Write-Stage "Building backend production bundle"
    $rootEnvProduction = Join-Path $repoRoot ".env.production"
    if (Test-Path -LiteralPath $rootEnvProduction) {
        Write-Host "Found .env.production at root, copying to backend root"
        Copy-Item -LiteralPath $rootEnvProduction -Destination (Join-Path $backendRoot ".env.production") -Force
    }

    Push-Location $backendRoot
    try {
        if (Test-Path -LiteralPath "dist") {
            Remove-Item -LiteralPath "dist" -Recurse -Force
        }
        Invoke-NativeOrThrow -FilePath pnpm -Arguments @("run", "build")
    } finally {
        Pop-Location
    }

    Write-Stage "Staging backend deploy payload"
    Reset-Directory $backendStage

    $apiRootStage = Join-Path $backendStage "api"
    New-Item -ItemType Directory -Path $apiRootStage -Force | Out-Null

    Copy-Item -LiteralPath (Join-Path $backendRoot "package.json") -Destination $apiRootStage -Force
    Copy-Item -LiteralPath (Join-Path $backendRoot "passenger_entry.js") -Destination $apiRootStage -Force
    Copy-Item -LiteralPath (Join-Path $backendRoot ".htaccess") -Destination $apiRootStage -Force
    Copy-Item -LiteralPath (Join-Path $backendRoot "dist") -Destination $apiRootStage -Recurse -Force
    Copy-IfExists (Join-Path $backendRoot "prisma") $apiRootStage
    Copy-IfExists (Join-Path $backendRoot ".env.production") (Join-Path $apiRootStage ".env")
    Copy-IfExists (Join-Path $backendRoot ".env") (Join-Path $apiRootStage ".env")

    Write-Stage "Installing backend production dependencies using npm install"
    Push-Location $apiRootStage
    try {
        Invoke-NativeOrThrow -FilePath npm -Arguments @(
            "install",
            "--omit=dev",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund"
        )
        Write-Host "Generating Prisma client for production..."
        Invoke-NativeOrThrow -FilePath npx -Arguments @("prisma", "generate", "--schema", "prisma/schema.prisma")
    } finally {
        Pop-Location
    }

    Write-Stage "Creating backend artifact"
    Write-Host "Waiting 3 seconds for filesystem locks to release..."
    Start-Sleep -Seconds 3
    New-TarGz $backendStage $backendArtifact
    Write-Host "Created $backendArtifact" -ForegroundColor Green
}

Write-Host ""
Write-Host "Artifacts are ready in $artifactsRoot" -ForegroundColor Green
