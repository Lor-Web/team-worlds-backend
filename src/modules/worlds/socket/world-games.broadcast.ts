/**
 * Broadcast списка игр в комнату мира.
 * Каждый клиент получает персонализированный GameSessionListItem (canJoin, myRole).
 */
import { getSocketServer } from '../../../socket/socket.server.js';
import { worldGamesRoom } from '../../../socket/socket.rooms.js';
import { toGameSessionListItemDto } from '../../games/game-sessions.dto.js';
import {
  isOpenWorldGameStatus,
  isSessionVisibleToUser,
  OPEN_WORLD_GAME_STATUSES,
} from '../../games/game-sessions.helpers.js';
import { gameSessionsRepository } from '../../games/game-sessions.repository.js';
import { worldAccessService } from '../world-access.service.js';
import { WorldGamesSocketEvent } from './world-games.events.js';

async function listOpenSessionsForUser(
  userId: string,
  worldId: string,
) {
  await worldAccessService.requireActiveMembership(userId, worldId);

  const sessions = await gameSessionsRepository.listByWorld(worldId, OPEN_WORLD_GAME_STATUSES);

  return sessions
    .filter((session) => isSessionVisibleToUser(session, userId))
    .map((session) => toGameSessionListItemDto(session, userId));
}

async function emitPersonalizedToRoom(
  worldId: string,
  event: typeof WorldGamesSocketEvent.gameCreated | typeof WorldGamesSocketEvent.gameUpdated,
  sessionId: string,
): Promise<void> {
  const session = await gameSessionsRepository.findByIdForList(sessionId);

  if (!session) {
    return;
  }

  const io = getSocketServer();
  const room = worldGamesRoom(worldId);
  const sockets = await io.in(room).fetchSockets();

  for (const remoteSocket of sockets) {
    const userId = remoteSocket.data.userId as string | undefined;

    if (!userId || !isSessionVisibleToUser(session, userId)) {
      continue;
    }

    remoteSocket.emit(event, {
      worldId,
      session: toGameSessionListItemDto(session, userId),
    });
  }
}

export const worldGamesBroadcast = {
  async emitSnapshotToSocket(
    socketId: string,
    worldId: string,
    userId: string,
  ): Promise<void> {
    const sessions = await listOpenSessionsForUser(userId, worldId);

    const io = getSocketServer();
    io.to(socketId).emit(WorldGamesSocketEvent.gamesSnapshot, { worldId, sessions });
  },

  async gameCreated(worldId: string, sessionId: string): Promise<void> {
    await emitPersonalizedToRoom(worldId, WorldGamesSocketEvent.gameCreated, sessionId);
  },

  async gameUpdated(worldId: string, sessionId: string): Promise<void> {
    const session = await gameSessionsRepository.findById(sessionId);

    if (!session) {
      return;
    }

    if (!isOpenWorldGameStatus(session.status)) {
      await this.gameRemoved(worldId, sessionId);
      return;
    }

    await emitPersonalizedToRoom(worldId, WorldGamesSocketEvent.gameUpdated, sessionId);
  },

  async gameRemoved(worldId: string, sessionId: string): Promise<void> {
    const io = getSocketServer();
    io.to(worldGamesRoom(worldId)).emit(WorldGamesSocketEvent.gameRemoved, {
      worldId,
      sessionId,
    });
  },
};
