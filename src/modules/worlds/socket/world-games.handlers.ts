import type { Server } from 'socket.io';

import { AppError } from '../../../shared/errors/AppError.js';
import type { AuthenticatedSocket } from '../../../socket/socket.auth.js';
import {
  parseWorldJoinPayload,
  parseWorldLeavePayload,
} from '../../../socket/socket.auth.js';
import { worldGamesRoom } from '../../../socket/socket.rooms.js';
import { worldAccessService } from '../world-access.service.js';
import { worldGamesBroadcast } from './world-games.broadcast.js';
import { WorldGamesSocketEvent, type WorldGamesJoinAck } from './world-games.events.js';
import { hostGraceService } from '../../games/host-grace.service.js';
import { worldPresenceBroadcast } from './world-presence.broadcast.js';

function toJoinAckError(error: unknown): WorldGamesJoinAck {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message };
  }

  return { ok: false, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export function registerWorldGamesHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on(
      WorldGamesSocketEvent.join,
      async (payload: unknown, ack?: (response: WorldGamesJoinAck) => void) => {
        try {
          const { worldId } = parseWorldJoinPayload(payload);
          await worldAccessService.requireActiveMembership(socket.data.userId, worldId);
          await socket.join(worldGamesRoom(worldId));
          await worldGamesBroadcast.emitSnapshotToSocket(socket.id, worldId, socket.data.userId);
          await worldPresenceBroadcast.emitPresenceSnapshotToSocket(socket.id, worldId);
          ack?.({ ok: true });
        } catch (error) {
          ack?.(toJoinAckError(error));
        }
      },
    );

    socket.on(WorldGamesSocketEvent.leave, (payload: unknown) => {
      try {
        const { worldId } = parseWorldLeavePayload(payload);
        void socket.leave(worldGamesRoom(worldId));
      } catch {
        // ignore invalid payload
      }
    });

    socket.on('disconnect', () => {
      void hostGraceService.handleHostDisconnect(socket.data.userId);
    });
  });
}
