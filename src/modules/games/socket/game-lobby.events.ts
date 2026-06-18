/** События Socket.IO для лобби игры (этап B). */
export const GameLobbySocketEvent = {
  join: 'game:join',
  leave: 'game:leave',
  lobbySnapshot: 'game:lobby-snapshot',
  lobbyUpdated: 'game:lobby-updated',
  lobbyClosed: 'game:lobby-closed',
} as const;

export type GameLobbyClosedReason = 'started' | 'cancelled';

export type GameLobbyJoinAck =
  | { ok: true }
  | { ok: false; code: string; message: string };
