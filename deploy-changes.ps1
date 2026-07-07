#!/usr/bin/env pwsh
# Deploy latest main to VPS with sync guards and health retries.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
if (-not $scriptPath) {
	throw "Unable to determine script path. Run deploy-changes.ps1 from the repository root."
}

$repoRoot = Split-Path -Parent $scriptPath
Set-Location $repoRoot

$vpsHost = "mudbug-dev"
$vpsRepo = "/opt/job-ticket-system"

function Write-Step {
	param([string]$Message)
	Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Git {
	param([string[]]$Arguments)
	$output = & git @Arguments
	if ($LASTEXITCODE -ne 0) {
	throw "git $($Arguments -join ' ') failed.`n$output"
	}
	return $output
}

Write-Step "Checking local branch and working tree"
$currentBranch = (Invoke-Git @("branch", "--show-current")).Trim()
if ($currentBranch -ne "main") {
	throw "You must deploy from main. Current branch: $currentBranch"
}

$hasUnstaged = (git diff --quiet); $unstagedExit = $LASTEXITCODE
$hasStaged = (git diff --cached --quiet); $stagedExit = $LASTEXITCODE
if ($unstagedExit -ne 0 -or $stagedExit -ne 0) {
	throw "Working tree is not clean. Commit or stash changes before deploying."
}

Write-Step "Checking local sync status against origin/main"
Invoke-Git @("fetch", "origin", "main")
$localHead = (Invoke-Git @("rev-parse", "HEAD")).Trim()
$remoteHead = (Invoke-Git @("rev-parse", "origin/main")).Trim()
$mergeBase = (Invoke-Git @("merge-base", "HEAD", "origin/main")).Trim()

if ($localHead -ne $remoteHead) {
	if ($localHead -eq $mergeBase) {
		throw "Local main is behind origin/main. Pull latest changes first."
	}
	if ($remoteHead -ne $mergeBase) {
		throw "Local main has diverged from origin/main. Rebase or merge before deploying."
	}

	Write-Step "Pushing local main to origin/main"
	Invoke-Git @("push", "origin", "main")
}

Write-Step "Deploying on VPS"
$remoteScript = @'
set -eu

cd /opt/job-ticket-system

git switch main
git fetch origin main

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse origin/main)"
BASE_HEAD="$(git merge-base HEAD origin/main)"

if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
	if [ "$LOCAL_HEAD" = "$BASE_HEAD" ]; then
		git pull --ff-only origin main
	elif [ "$REMOTE_HEAD" = "$BASE_HEAD" ]; then
		echo "VPS main is ahead of origin/main. Refusing deploy to avoid drift."
		exit 1
	else
		echo "VPS main diverged from origin/main. Refusing deploy to avoid drift."
		exit 1
	fi
fi

docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

wait_for_health() {
	url="$1"
	name="$2"
	attempt=1
	max_attempts=20

	while [ "$attempt" -le "$max_attempts" ]; do
		if curl -fsS "$url" >/dev/null 2>&1; then
			echo "$name healthy"
			curl -fsS "$url"
			echo
			return 0
		fi

		echo "Waiting for $name health ($attempt/$max_attempts)..."
		sleep 2
		attempt=$((attempt + 1))
	done

	echo "$name health check failed after $max_attempts attempts"
	return 1
}

wait_for_health "http://127.0.0.1:8080/health" "local"
wait_for_health "https://dev.mudbugdigital.com/health" "public"
'@

($remoteScript -replace "`r", "") | ssh $vpsHost "bash -s"
if ($LASTEXITCODE -ne 0) {
	throw "Remote deploy failed."
}

Write-Host "Deployment succeeded. Local and VPS are synced to origin/main with healthy checks." -ForegroundColor Green
