import type { Server } from 'socket.io';

import { AppError } from '../../../shared/errors/AppError.js';
import {
  parseGameLobbyPayload,
  type AuthenticatedSocket,
} from '../../../socket/socket.auth.js';
import { gameLobbyRoom } from '../../../socket/socket.rooms.js';
import { gameAccessService } from '../game-access.service.js';
import { gameLobbyBroadcast } from './game-lobby.broadcast.js';
import { GameLobbySocketEvent, type GameLobbyJoinAck } from './game-lobby.events.js';
import { gameSessionsService } from '../game-sessions.service.js';

function toJoinAckError(error: unknown): GameLobbyJoinAck {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message };
  }

  return { ok: false, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export function registerGameLobbyHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on(
      GameLobbySocketEvent.join,
      async (payload: unknown, ack?: (response: GameLobbyJoinAck) => void) => {
        try {
          const { sessionId } = parseGameLobbyPayload(payload);
          await gameAccessService.requireLobbyViewer(sessionId, socket.data.userId);
          await socket.join(gameLobbyRoom(sessionId));
          await gameLobbyBroadcast.emitSnapshotToSocket(
            socket.id,
            sessionId,
            socket.data.userId,
          );
          ack?.({ ok: true });
        } catch (error) {
          ack?.(toJoinAckError(error));
        }
      },
    );

    socket.on(GameLobbySocketEvent.leave, (payload: unknown) => {
      try {
        const { sessionId } = parseGameLobbyPayload(payload);
        void socket.leave(gameLobbyRoom(sessionId));
        void gameSessionsService.leaveLobbyPresence(socket.data.userId, sessionId);
      } catch {
        // ignore invalid payload
      }
    });
  });
}
