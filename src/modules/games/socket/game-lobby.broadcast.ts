/**
 * Broadcast состояния лобби в комнату game:{sessionId}.
 * Каждый клиент получает GameSessionDto с персональными myRole / myIsReady.
 */
import { getSocketServer } from '../../../socket/socket.server.js';
import { gameLobbyRoom } from '../../../socket/socket.rooms.js';
import { toGameSessionDto } from '../game-sessions.dto.js';
import { gameSessionsRepository } from '../game-sessions.repository.js';
import {
  GameLobbySocketEvent,
  type GameLobbyClosedReason,
} from './game-lobby.events.js';

async function emitPersonalizedLobbyUpdate(sessionId: string): Promise<void> {
  const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

  if (!session) {
    return;
  }

  if (session.status !== 'lobby') {
    await gameLobbyBroadcast.lobbyClosed(sessionId, session.status === 'active' ? 'started' : 'cancelled');
    return;
  }

  const io = getSocketServer();
  const sockets = await io.in(gameLobbyRoom(sessionId)).fetchSockets();

  for (const remoteSocket of sockets) {
    const userId = remoteSocket.data.userId as string | undefined;

    if (!userId) {
      continue;
    }

    remoteSocket.emit(GameLobbySocketEvent.lobbyUpdated, {
      sessionId,
      session: toGameSessionDto(session, userId),
    });
  }
}

export const gameLobbyBroadcast = {
  async emitSnapshotToSocket(
    socketId: string,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!session) {
      return;
    }

    const io = getSocketServer();
    io.to(socketId).emit(GameLobbySocketEvent.lobbySnapshot, {
      sessionId,
      session: toGameSessionDto(session, userId),
    });
  },

  async lobbyUpdated(sessionId: string): Promise<void> {
    await emitPersonalizedLobbyUpdate(sessionId);
  },

  async lobbyClosed(sessionId: string, reason: GameLobbyClosedReason): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(GameLobbySocketEvent.lobbyClosed, {
      sessionId,
      reason,
    });
  },
};
