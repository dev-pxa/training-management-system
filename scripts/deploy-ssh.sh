#!/usr/bin/env bash
set -euo pipefail

SSH_HOST="${SSH_HOST:-49.232.34.105}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/training-management-system}"
WEB_PORT="${WEB_PORT:-80}"
BACKEND_URL="${BACKEND_URL:-http://host.docker.internal:8080}"
ARCHIVE_NAME="training-management-system-release.tgz"
LOCAL_ARCHIVE="/tmp/${ARCHIVE_NAME}"
REMOTE_ARCHIVE="/tmp/${ARCHIVE_NAME}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
SCP_CMD=(scp -P "$SSH_PORT")
SSH_CMD=(ssh -p "$SSH_PORT")

if [[ -n "$SSH_KEY_PATH" ]]; then
  SCP_CMD=(scp -i "$SSH_KEY_PATH" -P "$SSH_PORT")
  SSH_CMD=(ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT")
fi

if [[ -z "$DEPLOY_PATH" || "$DEPLOY_PATH" == "/" ]]; then
  echo "Invalid DEPLOY_PATH: ${DEPLOY_PATH}" >&2
  exit 1
fi

echo "Packing project..."
tar \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.swc' \
  --exclude='dist' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  --exclude='.pnpm-store' \
  --exclude='.cache' \
  -czf "$LOCAL_ARCHIVE" .

echo "Uploading to ${SSH_USER}@${SSH_HOST}:${REMOTE_ARCHIVE}..."
"${SCP_CMD[@]}" "$LOCAL_ARCHIVE" "${SSH_USER}@${SSH_HOST}:${REMOTE_ARCHIVE}"

echo "Deploying on ${SSH_HOST}:${DEPLOY_PATH}..."
"${SSH_CMD[@]}" "${SSH_USER}@${SSH_HOST}" \
  "DEPLOY_PATH='$DEPLOY_PATH' WEB_PORT='$WEB_PORT' BACKEND_URL='$BACKEND_URL' REMOTE_ARCHIVE='$REMOTE_ARCHIVE' bash -s" <<'REMOTE'
set -euo pipefail

if [[ -z "$DEPLOY_PATH" || "$DEPLOY_PATH" == "/" ]]; then
  echo "Invalid DEPLOY_PATH: ${DEPLOY_PATH}" >&2
  exit 1
fi

mkdir -p "$DEPLOY_PATH"
find "$DEPLOY_PATH" -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +
tar -xzf "$REMOTE_ARCHIVE" -C "$DEPLOY_PATH"

cd "$DEPLOY_PATH"
cat > .env <<EOF
WEB_PORT=$WEB_PORT
BACKEND_URL=$BACKEND_URL
EOF

docker compose build --pull
docker compose up -d
docker compose ps
curl -fsS "http://127.0.0.1:${WEB_PORT}/"
REMOTE

echo
echo "Deploy completed: http://${SSH_HOST}:${WEB_PORT}"
