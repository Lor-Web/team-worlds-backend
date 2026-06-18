# Socket.IO — список игр в мире (этап A)

## Подключение

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken },
  withCredentials: true,
});
```

## Экран мира

```typescript
const { sessions } = await api(`/worlds/${worldId}/games`);

socket.emit('world:join', { worldId }, (ack) => {
  if (!ack.ok) console.error(ack);
});

socket.on('world:games-snapshot', ({ sessions }) => setGames(sessions));
socket.on('world:game-created', ({ session }) =>
  setGames((prev) => [session, ...prev.filter((g) => g.id !== session.id)]),
);
socket.on('world:game-updated', ({ session }) =>
  setGames((prev) => prev.map((g) => (g.id === session.id ? session : g))),
);
socket.on('world:game-removed', ({ sessionId }) =>
  setGames((prev) => prev.filter((g) => g.id !== sessionId)),
);

socket.emit('world:leave', { worldId });
```

## Ожидание ведущего (host grace)

Если ведущий вышел или отключился (закрыл вкладку):

- Игра **не удаляется сразу**
- В списке: `hostAbsent: true`, `hostGraceExpiresAt` — ISO время отмены
- По умолчанию **60 сек** (`HOST_GRACE_PERIOD_SECONDS` в `.env`)
- Ведущий может вернуться: `POST /games/:sessionId/join`
- После таймера — `world:game-removed`

**UI:** показать таймер «Ведущий отключился, игра закроется через N сек».

## События

| Client → Server | Server → Client |
|-----------------|-----------------|
| `world:join` | `world:games-snapshot` |
| `world:leave` | `world:game-created` / `world:game-updated` |
| disconnect (авто) | `world:game-removed` |
| | `world:presence-updated` |

## Онлайн-участники

Модель: **«онлайн на сайте»** среди участников мира. Подробно: [world-presence.md](./world-presence.md).

При `world:join` сразу приходит `world:presence-updated`:

```typescript
socket.on('world:presence-updated', ({ worldId, onlineMembers }) => {
  // onlineMembers: { id, username, avatar }[] — участники ЭТОГО мира на сайте
});
```

Socket подключай **при входе в приложение**, не только на экране мира.

REST: `GET /worlds/:id` → `onlineMembers`, `onlineCount`.

REST без изменений: `join`, `ready`, `start`. Старт заблокирован, пока `hostAbsent: true` (`409 GAME_HOST_ABSENT`).

**Лобби (этап B):** см. [socket-game-lobby.md](./socket-game-lobby.md) — `game:join`, `game:lobby-snapshot`, `game:lobby-updated`.
