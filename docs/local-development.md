# Локальная разработка Team Worlds

По умолчанию всё крутится локально. Prod — только для деплоя и редких проверок.

```text
localhost:5173  →  localhost:3000  →  PostgreSQL (Docker)
   фронт              бэкенд
```

---

## Быстрый старт

### 1. База данных

```bash
cd team-worlds-backend
docker compose up -d
```

### 2. Бэкенд

```bash
cd team-worlds-backend
cp .env.example .env          # один раз
npm install
npm run db:migrate            # один раз / после новых миграций
npm run dev                   # http://localhost:3000
```

Проверка: `curl http://localhost:3000/health`

### 3. Фронтенд

```bash
cd team-worlds
pnpm install
pnpm dev                      # http://localhost:5173
```

Фронт по умолчанию смотрит на `http://localhost:3000` (`.env.development`).

---

## Полезные команды

| Задача | Команда |
|--------|---------|
| Prisma Studio (БД в браузере) | `npm run db:studio` |
| Сид админа | `npm run db:seed` |
| Новая миграция | `npm run db:migrate` |
| Перегенерировать API-клиент на фронте | `pnpm api:generate` (бэкенд должен быть запущен) |
| OpenAPI / Swagger | http://localhost:3000/docs |

---

## Env-файлы

### Бэкенд (`team-worlds-backend/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://teamworlds:teamworlds@localhost:5432/teamworlds"
CORS_ORIGIN=http://localhost:5173
```

### Фронт (`team-worlds/.env.development`)

```env
VITE_API_URL=http://localhost:3000
```

---

## Локальный фронт → боевой API (редко)

Когда нужно проверить UI на реальных данных. **Все действия попадают в prod БД.**

```bash
cd team-worlds
cp .env.development.local.example .env.development.local
pnpm dev
```

Файл `.env.development.local` в `.gitignore` — не коммитится.

---

## Типичный цикл

1. Пишешь код локально (оба репозитория)
2. Менял API → `pnpm api:generate` на фронте
3. `pnpm build` + `npm run build` — проверка перед push
4. Push в `main` → автодеплой на prod

---

## Если что-то не работает

| Проблема | Решение |
|----------|---------|
| CORS | `CORS_ORIGIN=http://localhost:5173` в `.env` бэкенда |
| БД не коннектится | `docker compose ps`, порт 5432 свободен |
| 401 на refresh | Локальный бэкенд запущен, cookies не блокируются |
| Старые типы API | `pnpm api:generate` при запущенном бэкенде |

---

## Репозитории

| Проект | Путь |
|--------|------|
| Backend | `team-worlds-backend` |
| Frontend | `team-worlds` |

Prod-деплой: [deploy-adminvps.md](./deploy-adminvps.md)
