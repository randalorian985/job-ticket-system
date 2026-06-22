#!/usr/bin/env bash
set -euo pipefail

project_dir="${PROJECT_DIR:-/opt/job-ticket-system}"
compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"
compose_env_file="${COMPOSE_ENV_FILE:-.env.production}"
backup_root="${BACKUP_ROOT:-$project_dir/backups}"
retention_days="${RETENTION_DAYS:-14}"
stamp="$(date -u +%Y%m%d%H%M%S)"
backup_dir="$backup_root/$stamp"
sql_container="${SQL_CONTAINER:-job-ticket-sqlserver}"
api_files_volume="${API_FILES_VOLUME:-job-ticket-system_api_files}"

if ! [[ "$retention_days" =~ ^[0-9]+$ ]]; then
  echo "RETENTION_DAYS must be a whole number." >&2
  exit 1
fi

project_dir="$(realpath -m "$project_dir")"
backup_root="$(realpath -m "$backup_root")"
backup_dir="$backup_root/$stamp"

if [[ "$backup_root" == "/" || "$backup_root" == "$project_dir" ]]; then
  echo "Refusing unsafe backup root: $backup_root" >&2
  exit 1
fi

cd "$project_dir"
mkdir -p "$backup_dir"

compose_args=()
if [[ -f "$compose_env_file" ]]; then
  compose_args+=(--env-file "$compose_env_file")
fi
compose_args+=(-f "$compose_file")

if ! docker compose "${compose_args[@]}" ps --status running >/dev/null; then
  echo "Docker Compose services are not reachable from $project_dir." >&2
  exit 1
fi

sa_password="$(docker exec "$sql_container" printenv SA_PASSWORD)"
if [[ -z "$sa_password" ]]; then
  echo "SA_PASSWORD is not available inside $sql_container." >&2
  exit 1
fi

docker exec "$sql_container" mkdir -p /var/opt/mssql/backups
docker exec "$sql_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -Q "BACKUP DATABASE [JobTicketDb] TO DISK = N'/var/opt/mssql/backups/job-ticket-$stamp.bak' WITH INIT, COPY_ONLY"

docker exec "$sql_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -Q "RESTORE VERIFYONLY FROM DISK = N'/var/opt/mssql/backups/job-ticket-$stamp.bak'"

docker cp "$sql_container:/var/opt/mssql/backups/job-ticket-$stamp.bak" "$backup_dir/job-ticket-$stamp.bak"

docker run --rm \
  -v "$api_files_volume:/source:ro" \
  -v "$backup_dir:/backup" \
  alpine tar -czf "/backup/api-files-$stamp.tgz" -C /source .

find "$backup_root" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9]{14}' -mtime +"$retention_days" -print -exec rm -rf {} \;

echo "Backup complete: $backup_dir"
