#!/usr/bin/env bash
# Сборка и запуск бэкенда (после bootstrap и создания .env).
# Запуск: sudo -u deploy bash /var/www/team-worlds/backend/deploy/scripts/install-backend.sh
set -euo pipefail

BACKEND_DIR="/var/www/team-worlds/backend"

cd "$BACKEND_DIR"

if [ ! -f .env ]; then
  echo "Создайте $BACKEND_DIR/.env из deploy/env.production.example"
  exit 1
fi

echo "==> npm ci"
npm ci

echo "==> build"
npm run build

echo "==> migrate"
npm run db:migrate:deploy

echo "==> restart service"
sudo systemctl restart team-worlds-backend
sleep 2

echo "==> health check"
curl -fsS http://127.0.0.1:3000/health
echo
echo "Backend OK on http://127.0.0.1:3000"
