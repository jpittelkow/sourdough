#!/usr/bin/env pwsh
# Quick release script - commits all changes, bumps version, tags, and pushes
# Usage: ./scripts/push.ps1 [patch|minor|major|<version>] [commit-message]
# Example: ./scripts/push.ps1 patch "feat: add new feature"

param(
    [Parameter(Position=0)]
    [string]$VersionBump = "patch",
    
    [Parameter(Position=1)]
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$VersionFile = Join-Path $RootDir "VERSION"
$PackageJson = Join-Path $RootDir "frontend" "package.json"

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Error "Not in a git repository. Run this script from the project root."
    exit 1
}

# Check current branch
$CurrentBranch = git rev-parse --abbrev-ref HEAD
if ($CurrentBranch -ne "master") {
    Write-Warning "You are on branch '$CurrentBranch', not 'master'. Continue anyway? (y/N)"
    $Response = Read-Host
    if ($Response -ne "y" -and $Response -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# Check for uncommitted changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit. Working tree is clean." -ForegroundColor Yellow
    exit 0
}

# Show what will be committed
Write-Host "`nChanges to be committed:" -ForegroundColor Cyan
git status --short

# Get commit message if not provided
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Write-Host "`nEnter commit message (or press Enter for default):" -ForegroundColor Yellow
    $CommitMessage = Read-Host
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "chore: update files"
    }
}

# Stage all changes
Write-Host "`nStaging all changes..." -ForegroundColor Cyan
git add -A

# Commit
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m $CommitMessage

# Read current version
$CurrentVersion = (Get-Content $VersionFile).Trim()
Write-Host "`nCurrent version: $CurrentVersion" -ForegroundColor Cyan

# Calculate new version
$VersionParts = $CurrentVersion -split '\.'
$Major = [int]$VersionParts[0]
$Minor = [int]$VersionParts[1]
$Patch = [int]$VersionParts[2]

$NewVersion = switch ($VersionBump.ToLower()) {
    "patch" { "$Major.$Minor.$($Patch + 1)" }
    "minor" { "$Major.$($Minor + 1).0" }
    "major" { "$($Major + 1).0.0" }
    default {
        # Check if it's a valid semver
        if ($VersionBump -match '^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$') {
            $VersionBump
        } else {
            Write-Error "Invalid version bump: $VersionBump. Use patch, minor, major, or x.y.z"
            exit 1
        }
    }
}

Write-Host "New version: $NewVersion" -ForegroundColor Green

# Update VERSION file
Set-Content -Path $VersionFile -Value $NewVersion -NoNewline

# Update package.json
$PackageContent = Get-Content $PackageJson -Raw
$OldPattern = '"version":\s*"[^"]*"'
$NewPattern = '"version": "' + $NewVersion + '"'
$PackageContent = $PackageContent -replace $OldPattern, $NewPattern
Set-Content -Path $PackageJson -Value $PackageContent -NoNewline

Write-Host "Updated version files" -ForegroundColor Cyan

# Stage version files
Invoke-Expression "git add `"$VersionFile`" `"$PackageJson`""

# Commit version bump
Write-Host "Committing version bump..." -ForegroundColor Cyan
git commit -m "Release v$NewVersion"

# Create tag
Write-Host "Creating tag v$NewVersion..." -ForegroundColor Cyan
git tag "v$NewVersion"

# Push everything
Write-Host "`nPushing to origin..." -ForegroundColor Cyan
git push origin master "v$NewVersion"

Write-Host ""
Write-Host "Release complete!" -ForegroundColor Green
Write-Host "Version: $NewVersion" -ForegroundColor Green
Write-Host "Tag: v$NewVersion" -ForegroundColor Green
Write-Host ""
Write-Host "GitHub Actions release workflow should now be running." -ForegroundColor Cyan
