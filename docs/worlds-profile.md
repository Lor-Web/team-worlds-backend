# Миры — профиль, прогрессия, архив

## Новые поля в API

```typescript
{
  description: "",        // строка, до 500 символов
  avatarUrl: "",          // пока заглушка
  backgroundUrl: "",      // пока заглушка
  level: 1,
  xp: 0,
  stage: "OUTPOST",       // OUTPOST | SETTLEMENT | CITY | METROPOLIS | CELESTIAL_CITADEL
  stageName: "Аванпост",
  xpInLevel: 0,
  xpToNextLevel: 100,
  progressToNextLevel: 0, // 0..1 для прогресс-бара
  isArchived: false,
  tier: "STANDARD",       // лимит участников (отдельно от stage)
}
```

## Стадии (авто от level)

| Stage | Level |
|-------|-------|
| OUTPOST (Аванпост) | 1–5 |
| SETTLEMENT (Поселение) | 6–15 |
| CITY (Город) | 16–30 |
| METROPOLIS (Мегаполис) | 31–50 |
| CELESTIAL_CITADEL (Небесная цитадель) | 51+ |

## Формула XP

Total XP для уровня L: `50 * L * (L - 1)` (L ≥ 1).

## Endpoints

| Method | Path | Кто | Описание |
|--------|------|-----|----------|
| GET | `/worlds?includeArchived=true` | member | Список миров |
| GET | `/worlds/:id` | member | Детали (архив — read-only) |
| PATCH | `/worlds/:id` | owner/settings | Профиль |
| DELETE | `/worlds/:id` | owner | Архивировать |
| POST | `/worlds/:id/restore` | owner | Восстановить |
| POST | `/worlds/:id/leave` | member | Покинуть мир (owner — нельзя) |
| DELETE | `/worlds/:id/members/:userId` | owner | Исключить участника |

### PATCH body (хотя бы одно поле)

```json
{
  "name": "Новое имя",
  "description": "О нас",
  "avatarUrl": "",
  "backgroundUrl": ""
}
```

- `name` — право `world.settings.manage`
- `description`, `avatarUrl`, `backgroundUrl` — **только owner**

### Архив

- `DELETE` → `deletedAt` set, lobby/active игры → `cancelled`
- Вступить по invite code в архивный мир нельзя
- Игры и socket `world:join` в архивном мире → `409 WORLD_ARCHIVED`
- Owner восстанавливает через `POST .../restore`

## XP (этап 3)

Конфиг: `src/config/world-xp-rewards.ts`

| Активность | XP |
|------------|-----|
| MEMBER_JOINED | 5 |
| GAME_STARTED | 10 |
| GAME_FINISHED | 15 (когда будет finish flow) |

## Рейтинг (этап 5)

Подробно: [world-ranking.md](./world-ranking.md).

- `rank` — место среди активных миров (`null` если архив)
- `totalWorlds` — всего активных миров
- `GET /worlds/leaderboard?limit=50` → `{ worlds, totalWorlds }`

## Онлайн (этап 4)

`GET /worlds/:id` → `onlineMembers[]` + socket `world:presence-updated`.
