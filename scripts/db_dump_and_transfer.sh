#!/usr/bin/env bash
set -euo pipefail

# db_dump_and_transfer.sh
# Create a consistent dump of a MySQL database, compress it, optionally transfer it via scp,
# and optionally remove the local copy.

usage() {
  cat <<'USAGE'
Usage: db_dump_and_transfer.sh [options]

Options:
  -D DATABASE      Database name to dump (default: ads_management)
  -u MYSQL_USER    MySQL user to use for dump (default: adsuser)
  -d OUT_DIR       Output directory on the server (default: /home/deployer)
  -r SCP_TARGET    Optional: scp destination (format: user@host:/path)
  -i SSH_KEY       Optional: identity file for scp (absolute path)
  -c               Cleanup the local compressed file after successful transfer
  -n               Don't compress the .sql (leave as .sql)
  -h               Show this help and exit

Examples:
  # Create compressed dump locally in /home/deployer
  ./scripts/db_dump_and_transfer.sh -u adsuser -D ads_management

  # Create compressed dump and scp to remote backup host (asks for passwords when needed)
  ./scripts/db_dump_and_transfer.sh -u adsuser -D ads_management -r "backup@1.2.3.4:/backups"

  # Use an ssh key for scp and remove the local compressed file after transfer
  ./scripts/db_dump_and_transfer.sh -u adsuser -D ads_management -r "backup@1.2.3.4:/backups" -i /home/deployer/.ssh/id_rsa -c
USAGE
}

# Defaults
DB="ads_management"
MYSQL_USER="adsuser"
OUT_DIR="/home/deployer"
SCP_TARGET=""
SSH_KEY=""
CLEANUP=false
COMPRESS=true

while getopts ":D:u:d:r:i:cnh" opt; do
  case ${opt} in
    D) DB="$OPTARG" ;;
    u) MYSQL_USER="$OPTARG" ;;
    d) OUT_DIR="$OPTARG" ;;
    r) SCP_TARGET="$OPTARG" ;;
    i) SSH_KEY="$OPTARG" ;;
    c) CLEANUP=true ;;
    n) COMPRESS=false ;;
    h) usage; exit 0 ;;
    :) echo "Error: -$OPTARG requires an argument" >&2; usage; exit 2 ;;
    \?) echo "Invalid option: -$OPTARG" >&2; usage; exit 2 ;;
  esac
done

# Ensure output dir exists
mkdir -p "$OUT_DIR"

# Basic checks
if ! command -v mysqldump >/dev/null 2>&1; then
  echo "Error: mysqldump not found in PATH. Install mysql-client package or run from a machine with mysqldump." >&2
  exit 3
fi

if [ "$COMPRESS" = true ]; then
  if command -v pigz >/dev/null 2>&1; then
    COMPRESS_CMD="pigz -9"
  else
    COMPRESS_CMD="gzip -9"
  fi
fi

# Check free space on OUT_DIR
echo "Checking disk space on $(df -h "$OUT_DIR" | awk 'NR==1{print $1" "$2" "$3" "$4" "$5" "$6}');" 
DF_FREE=$(df -k --output=avail "$OUT_DIR" | tail -1)
if [ -n "$DF_FREE" ]; then
  # DF_FREE is in KB
  DF_FREE_BYTES=$(( DF_FREE * 1024 ))
  echo "Available space on $OUT_DIR: $DF_FREE_BYTES bytes"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BASE_NAME="${DB}_${TIMESTAMP}"
SQL_PATH="${OUT_DIR}/${BASE_NAME}.sql"

# Run mysqldump (will prompt for password)
echo "Starting mysqldump for database '$DB' as user '$MYSQL_USER'..."

# Use --single-transaction for InnoDB consistent snapshot; include routines/triggers/events
if ! mysqldump -u "$MYSQL_USER" -p --single-transaction --routines --triggers --events --databases "$DB" > "$SQL_PATH"; then
  echo "mysqldump failed" >&2
  rm -f "$SQL_PATH" || true
  exit 4
fi

echo "Dump saved to: $SQL_PATH"

COMPRESSED_PATH="${SQL_PATH}.gz"
if [ "$COMPRESS" = true ]; then
  echo "Compressing dump with ${COMPRESS_CMD}..."
  if $COMPRESS_CMD "$SQL_PATH"; then
    echo "Compressed: $COMPRESSED_PATH"
  else
    echo "Compression failed" >&2
    exit 5
  fi
else
  echo "Skipping compression; keeping SQL at $SQL_PATH"
  COMPRESSED_PATH="$SQL_PATH"
fi

# Show checksum
if command -v sha256sum >/dev/null 2>&1; then
  echo "SHA256 checksum:"
  sha256sum "$COMPRESSED_PATH"
fi

# If scp destination provided, transfer
if [ -n "$SCP_TARGET" ]; then
  echo "Transferring $COMPRESSED_PATH to $SCP_TARGET..."
  SCP_CMD=(scp -o StrictHostKeyChecking=accept-new -v)
  if [ -n "$SSH_KEY" ]; then
    SCP_CMD+=( -i "$SSH_KEY" )
  fi
  SCP_CMD+=("$COMPRESSED_PATH" "$SCP_TARGET")

  if "${SCP_CMD[@]}"; then
    echo "Transfer completed successfully."
    if [ "$CLEANUP" = true ]; then
      echo "Removing local copy $COMPRESSED_PATH..."
      rm -f "$COMPRESSED_PATH"
    fi
  else
    echo "Transfer failed" >&2
    exit 6
  fi
else
  echo "No scp target provided. The dump remains at: $COMPRESSED_PATH"
fi

echo "Done."
