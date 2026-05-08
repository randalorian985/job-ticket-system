#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '\n==> %s\n' "$1"
}

warn() {
  printf 'WARNING: %s\n' "$1" >&2
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backend_solution="$repo_root/backend/JobTicketSystem.sln"
frontend_dir="$repo_root/frontend"
dotnet_install_dir="${DOTNET_ROOT:-$HOME/.dotnet}"
origin_url="https://github.com/randalorian985/job-ticket-system.git"
export DOTNET_ROOT="$dotnet_install_dir"
export PATH="$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH"

log "Codex/local setup validation starting"
printf 'Repository: %s\n' "$repo_root"
printf 'DOTNET_ROOT: %s\n' "$DOTNET_ROOT"

run_as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    return 1
  fi
}

install_apt_packages() {
  if ! command -v apt-get >/dev/null 2>&1; then
    warn "apt-get is unavailable; cannot auto-install missing packages: $*"
    return 1
  fi

  if ! run_as_root apt-get update; then
    warn "apt-get update failed; continuing with already-installed tools."
    return 1
  fi

  if ! run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"; then
    warn "apt-get install failed for: $*"
    return 1
  fi
}

ensure_linux_tools() {
  log "Required Linux tools"
  local packages=(ca-certificates curl git findutils)
  local missing=()

  command -v curl >/dev/null 2>&1 || missing+=(curl)
  command -v git >/dev/null 2>&1 || missing+=(git)
  command -v find >/dev/null 2>&1 || missing+=(findutils)

  if [ "${#missing[@]}" -gt 0 ]; then
    install_apt_packages "${missing[@]}" || true
  fi

  for tool in curl git find; do
    if command -v "$tool" >/dev/null 2>&1; then
      printf '%s: %s\n' "$tool" "$(command -v "$tool")"
    else
      printf '%s is required but unavailable.\n' "$tool" >&2
      return 1
    fi
  done

  if [ ! -f /etc/ssl/certs/ca-certificates.crt ]; then
    install_apt_packages ca-certificates || true
  fi
}

confirm_repo_root() {
  log "Repository root structure"
  local missing=0

  for path in "backend/JobTicketSystem.sln" "frontend/package.json" "README.md" "docs"; do
    if [ -e "$repo_root/$path" ]; then
      printf 'found: %s\n' "$path"
    else
      printf 'missing: %s\n' "$path" >&2
      missing=1
    fi
  done

  if [ "$missing" -ne 0 ]; then
    printf 'Run this script from the job-ticket-system repository checkout.\n' >&2
    return 1
  fi
}

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
    dotnet --list-sdks
    return
  fi

  log "Installing .NET 8 SDK into DOTNET_ROOT"
  mkdir -p "$DOTNET_ROOT"
  local installer
  installer="$(mktemp)"
  cleanup_dotnet_installer() {
    rm -f "$installer"
  }
  trap cleanup_dotnet_installer RETURN

  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$installer"
  bash "$installer" --channel 8.0 --install-dir "$DOTNET_ROOT"

  if ! command -v dotnet >/dev/null 2>&1; then
    printf 'dotnet was installed but is not on PATH. PATH=%s\n' "$PATH" >&2
    return 1
  fi

  make_dotnet_available_to_future_shells
  dotnet --info
  dotnet --list-sdks
}

ensure_gh() {
  log "GitHub CLI"
  if ! command -v gh >/dev/null 2>&1; then
    install_apt_packages gh || true
  fi

  if command -v gh >/dev/null 2>&1; then
    gh --version
  else
    warn "gh is unavailable; GitHub CLI features will be skipped."
    return 0
  fi

  local token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
  if [ -n "$token" ]; then
    if gh auth status >/dev/null 2>&1; then
      printf '%s\n' "gh is already authenticated."
    elif printf '%s' "$token" | gh auth login --with-token >/dev/null 2>&1; then
      printf '%s\n' "gh authenticated using GITHUB_TOKEN/GH_TOKEN without printing the token."
    else
      warn "GITHUB_TOKEN/GH_TOKEN was provided, but gh authentication failed; continuing because gh auth is not a setup gate."
    fi
  fi

  gh auth status || warn "gh is not authenticated; continuing because gh auth is not a setup gate."
}

ensure_docker() {
  log "Docker client and Compose"

  if ! command -v docker >/dev/null 2>&1; then
    install_apt_packages docker.io || true
  fi

  if command -v docker >/dev/null 2>&1; then
    docker --version
  else
    warn "Docker client is unavailable after install attempt."
  fi

  if command -v docker >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    install_apt_packages docker-compose-v2 || install_apt_packages docker-compose-plugin || true
  fi

  if command -v docker >/dev/null 2>&1; then
    docker compose version || warn "Docker Compose plugin is unavailable after install attempt."
  fi

  printf '%s\n' "Docker client installation does not guarantee Docker Engine daemon access or container runtime privileges."
  printf '%s\n' "Phase 4A SQL Server walkthrough requires docker info to succeed and containers to run."

  if command -v docker >/dev/null 2>&1; then
    log "Docker daemon availability"
    if docker info; then
      printf '%s\n' "Docker daemon is available."
    else
      warn "Docker daemon/container privileges are unavailable in this environment; continuing because restricted Codex/nested containers may only support Docker client checks."
    fi
  fi
}

confirm_node_npm() {
  log "Node.js and npm"
  if command -v node >/dev/null 2>&1; then
    node --version
  else
    printf '%s\n' "node is required for frontend validation but is unavailable." >&2
    return 1
  fi

  if command -v npm >/dev/null 2>&1; then
    npm --version
  else
    printf '%s\n' "npm is required for frontend validation but is unavailable." >&2
    return 1
  fi
}

repair_origin_and_fetch() {
  local phase="$1"
  log "Remote Git origin check ($phase)"

  if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$repo_root" remote add origin "$origin_url" 2>/dev/null || git -C "$repo_root" remote set-url origin "$origin_url"
    git -C "$repo_root" remote -v

    if git -C "$repo_root" fetch origin; then
      printf '%s\n' "origin fetch succeeded."
    else
      warn "origin fetch failed; continuing because remote access is not a setup gate."
    fi

    if git -C "$repo_root" rev-parse origin/main; then
      printf '%s\n' "origin/main is present locally."
    else
      warn "origin/main is unavailable locally after fetch attempt."
    fi
  else
    warn "Not inside a Git work tree; origin repair/fetch skipped."
  fi
}

run_backend_validation() {
  log "Backend restore"
  dotnet restore "$backend_solution"
}

run_frontend_validation() {
  if [ ! -f "$frontend_dir/package.json" ]; then
    log "Frontend dependency install"
    printf '%s\n' "No frontend/package.json found; skipping frontend install."
    return
  fi

  pushd "$frontend_dir" >/dev/null

  log "Frontend dependency install"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi

  popd >/dev/null
}

ensure_linux_tools
confirm_repo_root
repair_origin_and_fetch "initial"
ensure_dotnet
ensure_gh
ensure_docker
confirm_node_npm
run_backend_validation
run_frontend_validation
repair_origin_and_fetch "final"

log "Codex/local setup validation completed"
