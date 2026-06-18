/** События Socket.IO для списка игр в мире (этап A). */
export const WorldGamesSocketEvent = {
  join: 'world:join',
  leave: 'world:leave',
  gamesSnapshot: 'world:games-snapshot',
  gameCreated: 'world:game-created',
  gameUpdated: 'world:game-updated',
  gameRemoved: 'world:game-removed',
  presenceUpdated: 'world:presence-updated',
} as const;

export type WorldGamesJoinAck =
  | { ok: true }
  | { ok: false; code: string; message: string };
