# Деплой Team Worlds на AdminVPS

Домен: **team-worlds.ru**  
API: **api.team-worlds.ru**  
Сервер: Ubuntu 22.04, VPS Promo (2 GB RAM)

---

## Схема

```text
team-worlds.ru          → nginx → /var/www/team-worlds/frontend (статика)
api.team-worlds.ru      → nginx → Node.js :3000 (REST + Socket.IO)
PostgreSQL              → localhost:5432
GitHub push main        → GitHub Actions → SSH deploy
```

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
