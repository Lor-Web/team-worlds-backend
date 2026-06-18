# Онлайн-участники мира

## Модель

**«Онлайн на сайте»** среди **участников мира**:

```
onlineMembers = members мира ∩ пользователи с активным socket (JWT)
```

Не зависит от того, на странице какого мира ты сейчас.

### Пример

Ты в **Мире А** и **Мире Б**. Открыта страница **Мира Б**, socket подключён.

| | Мир А | Мир Б |
|---|-------|-------|
| Ты в `onlineMembers` | ✓ | ✓ |
| Live `world:presence-updated` | только если `world:join` A | ✓ после `world:join` B |

`world:join` / `world:leave` — подписка на **live-события** мира, не влияет на факт «онлайн».

---

## Фронт: обязательная схема

### 1. Socket при входе в приложение (один раз)

```typescript
// AppLayout / после login — НЕ только на странице мира
export const socket = io(API_URL, {
  auth: { token: accessToken },
  withCredentials: true,
});
```

Без глобального socket пользователь **не считается онлайн**.

### 2. Страница мира

```typescript
// Начальное состояние
const { world } = await api.get(`/worlds/${worldId}`);
setOnlineMembers(world.onlineMembers); // REST snapshot

// Live-обновления
socket.emit('world:join', { worldId });
socket.on('world:presence-updated', ({ worldId: id, onlineMembers }) => {
  if (id === worldId) setOnlineMembers(onlineMembers);
});

// Уход со страницы
socket.emit('world:leave', { worldId });
// socket.disconnect() — только при logout
```

### 3. Logout

```typescript
socket.disconnect(); // пользователь пропадает из onlineMembers всех своих миров
```

---

## REST

`GET /worlds/:worldId`:

```json
{
  "world": {
    "onlineMembers": [
      { "id": "...", "username": "alice", "avatar": null }
    ],
    "onlineCount": 1,
    "memberCount": 5
  }
}
```

---

## Socket

| Событие | Когда | Payload |
|---------|-------|---------|
| `world:presence-updated` | connect/disconnect любого участника; после `world:join` | `{ worldId, onlineMembers }` |

При connect/disconnect пользователя сервер шлёт обновление **во все миры**, где он участник (в комнаты `world:{worldId}`).

---

## UI

- Аватарки / список `onlineMembers`
- Бейдж: `onlineCount` из  `memberCount` — «3 онлайн»
- Участник в `members`, но не в `onlineMembers` → офлайн

См. также: [socket-world-games.md](./socket-world-games.md)
