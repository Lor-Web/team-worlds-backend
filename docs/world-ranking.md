# Рейтинг миров (этап 5)

Глобальный топ активных (неархивных) миров.

## Критерий сортировки

1. `xp` ↓
2. `level` ↓
3. `createdAt` ↑ (старые выше при равном XP)

Ранг пересчитывается при каждом запросе (не хранится в БД).

---

## Поля в API

### В каждом мире (`GET /worlds`, `GET /worlds/:id`)

```typescript
{
  rank: 12,           // null если мир в архиве
  totalWorlds: 340,   // всего активных миров
  xp: 250,
  level: 3,
  stage: "SETTLEMENT",
  stageName: "Поселение"
}
```

**UI:** `#${rank} из ${totalWorlds}` или «12 место».

### Топ миров

```http
GET /worlds/leaderboard?limit=50
Authorization: Bearer …
```

```json
{
  "worlds": [
    {
      "rank": 1,
      "id": "…",
      "name": "Лучший мир",
      "avatarUrl": "",
      "level": 10,
      "xp": 1200,
      "stage": "CITY",
      "stageName": "Город",
      "memberCount": 8
    }
  ],
  "totalWorlds": 340
}
```

| Query | Default | Max |
|-------|---------|-----|
| `limit` | 50 | 100 |

---

## Сценарий для фронта

### Карточка мира (список / детали)

```typescript
const { worlds } = await api.get('/worlds');
worlds.forEach((w) => {
  if (w.isArchived) return;
  showRank(w.rank, w.totalWorlds); // «#12 из 340»
});
```

### Экран топа

```typescript
const { worlds, totalWorlds } = await api.get('/worlds/leaderboard?limit=20');

// Подсветить миры пользователя
const myWorldIds = new Set(myWorlds.map((w) => w.id));
worlds.forEach((entry) => {
  const isMine = myWorldIds.has(entry.id);
  renderRow(entry, isMine);
});
```

### Мир не в топ-20

Ранг всё равно есть в `GET /worlds/:id` → `rank`, `totalWorlds`.

---

## Когда меняется rank

| Событие | XP | rank |
|---------|-----|------|
| Новый участник в мире | +5 | может вырасти |
| Старт игры | +10 | может вырасти |
| Архивация мира | — | `rank: null` |

Live-обновлений rank по socket нет — обновляй после действий или при открытии экрана.

---

## OpenAPI

`npm run openapi:export` → orval: `WorldLeaderboardResponse`, поля `rank` / `totalWorlds` в `WorldSummary`.
