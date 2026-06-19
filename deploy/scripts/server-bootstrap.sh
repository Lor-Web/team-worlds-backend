#!/usr/bin/env bash
# Первичная настройка Ubuntu 22.04 на AdminVPS.
# Запускать на сервере от root: bash server-bootstrap.sh
set -euo pipefail

APP_ROOT="/var/www/team-worlds"
BACKEND_DIR="$APP_ROOT/backend"
FRONTEND_DIR="$APP_ROOT/frontend"
DEPLOY_USER="deploy"
DB_NAME="teamworlds"
DB_USER="teamworlds"
REPO_URL="git@github.com:Lor-Web/team-worlds-backend.git"

echo "==> Обновление пакетов"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

echo "==> Базовые пакеты"
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib

echo "==> Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Пользователь deploy"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

echo "==> PostgreSQL"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD 'CHANGE_ME_DB_PASSWORD';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "==> Директории приложения"
mkdir -p "$APP_ROOT" "$FRONTEND_DIR" /var/www/certbot
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT"

if [ ! -d "$BACKEND_DIR/.git" ]; then
  echo "==> Клонирование backend (нужен SSH-ключ deploy на GitHub)"
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$BACKEND_DIR"
fi

echo "==> systemd"
cp "$BACKEND_DIR/deploy/systemd/team-worlds-backend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable team-worlds-backend

echo "==> nginx (конфиг скопируется после SSL — см. docs/deploy-adminvps.md)"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo
echo "Готово. Дальше:"
echo "1) Смените пароль root и пароль БД teamworlds"
echo "2) Настройте SSH-ключ для пользователя deploy и GitHub"
echo "3) Создайте $BACKEND_DIR/.env (см. deploy/env.production.example)"
echo "4) DNS: A-запись team-worlds.ru и api.team-worlds.ru -> IP сервера"
echo "5) certbot + nginx (инструкция в docs/deploy-adminvps.md)"
echo "6) npm ci && npm run build && npm run db:migrate:deploy && systemctl start team-worlds-backend"
