# Уведомления (in-app)

## Модель

- Лента **на пользователя** (все миры в одном списке)
- REST + socket `user:{userId}`
- Без email

## Типы

| type | Когда | Кому |
|------|-------|------|
| `WORLD_GAME_CREATED` | публичная игра в лобби | все участники мира, кроме host |
| `WORLD_MEMBER_JOINED` | вступление в мир | **owner** |
| `WORLD_PROGRESSION` | level ↑ или stage ↑ | все участники мира |
| `WORLD_ARCHIVED` | архивация мира | все участники |
| `WORLD_INVITE` | приглашение в мир | invitee; удаляется при accept/decline |
| `GAME_INVITE` | приглашение в игру | invitee (flow позже) |

Приватная игра при создании **не** шлёт `WORLD_GAME_CREATED`.

---

## REST

```http
GET    /notifications?limit=20&cursor=
GET    /notifications/unread-count
PATCH  /notifications/:id/read
POST   /notifications/read-all
DELETE /notifications/:id
DELETE /notifications
```

Ответ списка:

```json
{
  "notifications": [{
    "id", "type", "title", "body",
    "payload": { "worldId", "sessionId", "actorUsername", ... },
    "readAt": null,
    "createdAt": "..."
  }],
  "nextCursor": "..." | null
}
```

---

## Socket

При connect (глобальный socket приложения) → auto-join `user:{userId}`.

```typescript
socket.on('notification:new', ({ notification, unreadCount }) => {
  addToFeed(notification);
  setBadge(unreadCount);
});

socket.on('notification:unread-count-updated', ({ unreadCount }) => {
  setBadge(unreadCount);
});

socket.on('notification:deleted', ({ notificationIds, clearedAll, unreadCount }) => {
  if (clearedAll) {
    clearFeed();
  } else {
    removeFromFeed(notificationIds);
  }
  setBadge(unreadCount);
});
```

При connect сразу приходит `notification:unread-count-updated`.

---

## Deep link (payload)

```typescript
switch (notification.type) {
  case 'WORLD_GAME_CREATED':
  case 'GAME_INVITE':
    go(`/worlds/${payload.worldId}/games/${payload.sessionId}`);
    break;
  case 'WORLD_MEMBER_JOINED':
  case 'WORLD_PROGRESSION':
  case 'WORLD_ARCHIVED':
  case 'WORLD_INVITE':
    go(`/worlds/${payload.worldId}`);
    break;
}
```

---

## Фронт: чеклист

1. Socket при логине (один на приложение)
2. Badge: `GET /notifications/unread-count` + socket updates
3. Колокольчик: `GET /notifications` + infinite scroll по `nextCursor`
4. Клик → `PATCH .../read` (ответ `{ notification, unreadCount }`; `notification: null` если уже удалено) + навигация по `type`/`payload`
5. Удаление: `DELETE /notifications/:id` или `DELETE /notifications` (очистить всё)
