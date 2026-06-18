# Socket.IO — лобби игры (этап B)

REST по-прежнему выполняет действия (`join`, `ready`, `start`). Socket доставляет **live-состояние лобби** (игроки, ready, host grace).

## Подключение

Тот же socket, что и для мира:

```typescript
const socket = io(API_URL, {
  auth: { token: accessToken },
  withCredentials: true,
});
```

## Экран лобби

```typescript
// 1. Войти в игру (если ещё не участник)
if (!isParticipant) {
  await api.post(`/games/${sessionId}/join`);
}

// 2. Подписаться на лобби
socket.emit('game:join', { sessionId }, (ack) => {
  if (!ack.ok) {
    // GAME_LOBBY_CLOSED | GAME_SESSION_FULL | GAME_SESSION_FORBIDDEN ...
    return;
  }
});

socket.on('game:lobby-snapshot', ({ sessionId, session }) => {
  setLobby(session); // полный GameSessionDto
});

socket.on('game:lobby-updated', ({ sessionId, session }) => {
  setLobby(session);
});

socket.on('game:lobby-closed', ({ sessionId, reason }) => {
  // reason: 'started' | 'cancelled'
  if (reason === 'started') navigate(`/games/${sessionId}/play`);
  else navigate(`/worlds/${worldId}`);
});

// 3. При уходе с экрана
socket.emit('game:leave', { sessionId });
```

## Действия в лобби (REST)

| Действие | Endpoint | Socket-реакция |
|----------|----------|----------------|
| Ready | `POST /games/:id/ready` `{ isReady }` | `game:lobby-updated` |
| Старт (host) | `POST /games/:id/start` | `game:lobby-closed` reason=`started` |
| Выход | `POST /games/:id/leave` | `game:lobby-updated` |
| Host disconnect / grace expiry | — | `game:lobby-updated` / `game:lobby-closed` reason=`cancelled` |

Polling `GET /games/:id` больше не нужен — достаточно snapshot + updated.

## Доступ к `game:join`

- Участник мира
- Сессия в статусе `lobby`
- Участник **или** есть свободное место (`canJoin`)
- Приватная игра — только участники

## События

| Client → Server | Server → Client |
|-----------------|-----------------|
| `game:join` `{ sessionId }` + ack | `game:lobby-snapshot` |
| `game:leave` `{ sessionId }` | `game:lobby-updated` |
| | `game:lobby-closed` |

## Комната

`game:{sessionId}` — отдельно от `world:{worldId}`. На экране лобби держите оба: мир для списка, game для деталей.

См. также: [socket-world-games.md](./socket-world-games.md)
