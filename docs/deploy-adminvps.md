# Деплой Team Worlds на AdminVPS

Домен: **team-worlds.ru**  
API: **api.team-worlds.ru**  
Сервер: Ubuntu 22.04, VPS Promo (2 GB RAM)

---

## Два этапа

| Этап | Когда | Что делаем |
|------|-------|------------|
| **A** | Сейчас (DNS ещё не резолвится) | SSH, PostgreSQL, бэкенд, проверка по IP |
| **B** | Когда `ping team-worlds.ru` отвечает | SSL (certbot), финальный nginx, фронт на домене |

---

## Схема

```text
team-worlds.ru          → nginx → /var/www/team-worlds/frontend (статика)
api.team-worlds.ru      → nginx → Node.js :3000 (REST + Socket.IO)
PostgreSQL              → localhost:5432
GitHub push main        → GitHub Actions → SSH deploy
```

---

# ЭТАП A — без DNS (делай сейчас)

## A1. SSH-ключ на Mac

```bash
ssh-keygen -t ed25519 -C "team-worlds" -f ~/.ssh/team-worlds -N ""
cat ~/.ssh/team-worlds.pub
```

Скопируй вывод (начинается с `ssh-ed25519 ...`).

## A2. Первый вход на сервер

```bash
ssh root@153.80.250.230
```

Сразу смени пароль root в AdminVPS, если ещё не менял.

На сервере — добавь ключ и пользователя deploy:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
# вставь публичный ключ, сохрани Ctrl+O Enter Ctrl+X
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Проверь с Mac:

```bash
ssh -i ~/.ssh/team-worlds deploy@153.80.250.230
```

## A3. Bootstrap (Node, PostgreSQL, nginx, git)

На сервере под **root**:

```bash
apt-get update && apt-get install -y git
git clone -b deploy https://github.com/Lor-Web/team-worlds-backend.git /var/www/team-worlds/backend
chown -R deploy:deploy /var/www/team-worlds
bash /var/www/team-worlds/backend/deploy/scripts/server-bootstrap.sh
```

> Скрипт bootstrap создаст БД. Если репозиторий **приватный**, клонируй под `deploy` через SSH-ключ, добавленный в GitHub.

Смени пароль PostgreSQL:

```bash
DB_PASS="$(openssl rand -base64 24)"
sudo -u postgres psql -c "ALTER USER teamworlds WITH PASSWORD '${DB_PASS}';"
echo "Сохрани пароль БД: ${DB_PASS}"
```

## A4. Файл `.env`

```bash
cp /var/www/team-worlds/backend/deploy/env.production.example \
   /var/www/team-worlds/backend/.env
nano /var/www/team-worlds/backend/.env
```

Пример (пока DNS нет — CORS можно временно на IP или localhost фронта):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://teamworlds:ВАШ_ПАРОЛЬ_БД@127.0.0.1:5432/teamworlds"
CORS_ORIGIN=http://153.80.250.230

JWT_ACCESS_SECRET=...   # openssl rand -base64 32
JWT_REFRESH_SECRET=...  # openssl rand -base64 32
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
HOST_GRACE_PERIOD_SECONDS=60
```

Права:

```bash
chown deploy:deploy /var/www/team-worlds/backend/.env
chmod 600 /var/www/team-worlds/backend/.env
```

## A5. Сборка и запуск

```bash
sudo -u deploy bash /var/www/team-worlds/backend/deploy/scripts/install-backend.sh
```

Проверка на сервере:

```bash
curl http://127.0.0.1:3000/health
systemctl status team-worlds-backend
```

## A6. Временный nginx (опционально, по IP)

```bash
mkdir -p /var/www/team-worlds/frontend
echo '<!doctype html><h1>Team Worlds — скоро</h1>' > /var/www/team-worlds/frontend/index.html

cp /var/www/team-worlds/backend/deploy/nginx/team-worlds-http-only.conf \
   /etc/nginx/sites-available/team-worlds.conf
ln -sf /etc/nginx/sites-available/team-worlds.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

С Mac (когда порт 80 открыт):

```bash
curl http://153.80.250.230/health
```

## A7. GitHub Actions (автодеплой)

1. Смержи ветку `deploy` → `main` на GitHub.
2. В репозитории: **Settings → Secrets → Actions**:
   - `DEPLOY_HOST` = `153.80.250.230`
   - `DEPLOY_USER` = `deploy`
   - `DEPLOY_SSH_KEY` = содержимое `~/.ssh/team-worlds` (приватный ключ)
3. На сервере:

```bash
echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart team-worlds-backend' \
  | tee /etc/sudoers.d/team-worlds-deploy
chmod 440 /etc/sudoers.d/team-worlds-deploy
```

---

# ЭТАП B — когда DNS заработает

Проверка:

```bash
ping team-worlds.ru
ping api.team-worlds.ru
```

## B1. SSL

```bash
certbot certonly --nginx -d team-worlds.ru -d www.team-worlds.ru
certbot certonly --nginx -d api.team-worlds.ru
```

## B2. Финальный nginx

```bash
cp /var/www/team-worlds/backend/deploy/nginx/team-worlds.conf \
   /etc/nginx/sites-available/team-worlds.conf
nginx -t && systemctl reload nginx
```

## B3. Обнови `.env`

```env
CORS_ORIGIN=https://team-worlds.ru
```

```bash
systemctl restart team-worlds-backend
```

## B4. Фронтенд

Собери с `VITE_API_URL=https://api.team-worlds.ru`, залей в `/var/www/team-worlds/frontend/`.

---

## Шаг 0. Безопасность (сделай сразу)

1. **Смени пароль root** — ты отправлял его в чат, считай его скомпрометированным.
2. В AdminVPS / личном кабинете задай новый пароль.
3. Лучше отключить вход по паролю и использовать **SSH-ключ** (шаг 3).

---

## Шаг 1. DNS

В панели домена **team-worlds.ru** добавь A-записи:

| Имя | Тип | Значение |
|-----|-----|----------|
| `@` | A | IP сервера |
| `www` | A | IP сервера |
| `api` | A | IP сервера |

Подожди 5–30 минут, проверь:

```bash
ping team-worlds.ru
ping api.team-worlds.ru
```

---

## Шаг 2. Первый вход на сервер

На **своём Mac** в Terminal:

```bash
ssh root@153.80.250.230
```

Введи **новый** пароль root.

Проверь систему:

```bash
cat /etc/os-release
ls /usr/local/mgr5 2>/dev/null && echo "ISPmanager есть" || echo "Чистая Ubuntu"
```

---

## Шаг 3. SSH-ключ (рекомендуется)

На Mac:

```bash
ssh-keygen -t ed25519 -C "team-worlds-deploy" -f ~/.ssh/team-worlds -N ""
cat ~/.ssh/team-worlds.pub
```

На сервере (под root):

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## Шаг 4. Bootstrap сервера

На сервере под **root**:

```bash
apt-get update && apt-get install -y git
git clone git@github.com:Lor-Web/team-worlds-backend.git /tmp/team-worlds-backend
bash /tmp/team-worlds-backend/deploy/scripts/server-bootstrap.sh
```

Смени пароль PostgreSQL:

```bash
sudo -u postgres psql -c "ALTER USER teamworlds WITH PASSWORD 'ваш_сильный_пароль';"
```

---

## Шаг 5. `.env` на сервере

```bash
sudo -u deploy cp /var/www/team-worlds/backend/deploy/env.production.example \
  /var/www/team-worlds/backend/.env
sudo -u deploy nano /var/www/team-worlds/backend/.env
```

Секреты JWT:

```bash
openssl rand -base64 32
```

---

## Шаг 6. Сборка и запуск

```bash
cd /var/www/team-worlds/backend
sudo -u deploy npm ci
sudo -u deploy npm run build
sudo -u deploy npm run db:migrate:deploy
sudo systemctl start team-worlds-backend
curl http://127.0.0.1:3000/health
```

---

## Шаг 7. SSL + nginx

```bash
certbot certonly --nginx -d team-worlds.ru -d www.team-worlds.ru
certbot certonly --nginx -d api.team-worlds.ru
cp /var/www/team-worlds/backend/deploy/nginx/team-worlds.conf /etc/nginx/sites-available/team-worlds.conf
ln -sf /etc/nginx/sites-available/team-worlds.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## Шаг 8. Фронтенд

```env
VITE_API_URL=https://api.team-worlds.ru
```

```bash
rsync -avz --delete ./dist/ deploy@153.80.250.230:/var/www/team-worlds/frontend/
```

---

## Шаг 9. Автодеплой (GitHub main)

Secrets в репозитории: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.

```bash
echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart team-worlds-backend' \
  > /etc/sudoers.d/team-worlds-deploy
```

---

## Локально

```bash
docker compose up -d
cp .env.example .env
npm run db:migrate:deploy
npm run dev
```
