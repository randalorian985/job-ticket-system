#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '\n==> %s\n' "$1"
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backend_solution="$repo_root/backend/JobTicketSystem.sln"
frontend_dir="$repo_root/frontend"
dotnet_install_dir="${DOTNET_ROOT:-$HOME/.dotnet}"
export DOTNET_ROOT="$dotnet_install_dir"
export PATH="$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH"

log "Codex setup validation starting"
printf 'Repository: %s\n' "$repo_root"
printf 'DOTNET_ROOT: %s\n' "$DOTNET_ROOT"

log "Remote Git operations"
printf '%s\n' "Skipping git fetch, git pull, git push, gh auth login, and gh auth setup-git."
printf '%s\n' "Remote Git access is optional for web Codex validation and is not a setup gate."

make_dotnet_available_to_future_shells() {
  if [ -x "$DOTNET_ROOT/dotnet" ] && [ -w /usr/local/bin ] && [ ! -e /usr/local/bin/dotnet ]; then
    ln -s "$DOTNET_ROOT/dotnet" /usr/local/bin/dotnet || true
  fi
}

ensure_dotnet() {
  if command -v dotnet >/dev/null 2>&1; then
    log ".NET SDK already available"
    make_dotnet_available_to_future_shells
    dotnet --info
    return
  fi

  log "Installing .NET 8 SDK into DOTNET_ROOT"
  mkdir -p "$DOTNET_ROOT"
  installer="$(mktemp)"
  cleanup() {
    rm -f "$installer"
  }
  trap cleanup RETURN

  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$installer"
  bash "$installer" --channel 8.0 --install-dir "$DOTNET_ROOT"

  if ! command -v dotnet >/dev/null 2>&1; then
    printf 'dotnet was installed but is not on PATH. PATH=%s\n' "$PATH" >&2
    return 1
  fi

  make_dotnet_available_to_future_shells

  dotnet --info
}

run_backend_validation() {
  log "Backend restore"
  dotnet restore "$backend_solution"

  log "Backend build"
  dotnet build "$backend_solution" --no-restore

  mapfile -t test_projects < <(find "$repo_root/backend" -path '*/bin' -prune -o -path '*/obj' -prune -o -name '*Tests.csproj' -print)
  if [ "${#test_projects[@]}" -eq 0 ]; then
    log "Backend tests"
    printf '%s\n' "No backend test projects found; skipping dotnet test."
  else
    log "Backend tests"
    dotnet test "$backend_solution" --no-build
  fi
}

run_frontend_validation() {
  if [ ! -f "$frontend_dir/package.json" ]; then
    log "Frontend validation"
    printf '%s\n' "No frontend/package.json found; skipping frontend install/build/test."
    return
  fi

  cd "$frontend_dir"

  log "Frontend dependency install"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi

  if npm pkg get scripts.build | grep -vq '^{}$'; then
    log "Frontend build"
    npm run build
  else
    log "Frontend build"
    printf '%s\n' "No package.json build script found; skipping frontend build."
  fi

  if npm pkg get scripts.test | grep -vq '^{}$'; then
    log "Frontend tests"
    npm test
  else
    log "Frontend tests"
    printf '%s\n' "No package.json test script found; skipping frontend tests."
  fi
}

ensure_dotnet
run_backend_validation
run_frontend_validation

log "Codex setup validation completed"
