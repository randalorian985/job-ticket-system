#!/usr/bin/env pwsh
# Deploy job ticket system changes to VPS

$repoRoot = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $repoRoot

Write-Host "📦 Committing changes..." -ForegroundColor Cyan
git add -A
git commit -m "feat: implement work location type (shop vs off-site) UI for managers and techs"

Write-Host "🚀 Pushing to origin..." -ForegroundColor Cyan
git push origin main

Write-Host "✅ Local changes committed and pushed" -ForegroundColor Green
