/**
 * Таймер ожидания возвращения ведущего. По истечении — отмена сессии.
 */
import { Prisma } from '@prisma/client';

import { computeHostGraceExpiresAt } from '../../config/host-grace.js';
import { gameSessionsRepository } from '../games/game-sessions.repository.js';
import { gameLobbyBroadcast } from '../games/socket/game-lobby.broadcast.js';
import { worldGamesBroadcast } from '../worlds/socket/world-games.broadcast.js';

const graceTimers = new Map<string, NodeJS.Timeout>();

async function cancelSessionAfterGrace(sessionId: string, worldId: string): Promise<void> {
  graceTimers.delete(sessionId);

  const session = await gameSessionsRepository.findById(sessionId);

  if (!session || session.status !== 'lobby') {
    return;
  }

  if (!session.hostGraceExpiresAt || session.hostGraceExpiresAt.getTime() > Date.now()) {
    return;
  }

  await gameSessionsRepository.cancelSession(sessionId);
  await worldGamesBroadcast.gameRemoved(worldId, sessionId);
  await gameLobbyBroadcast.lobbyClosed(sessionId, 'cancelled');
}

function scheduleGraceTimer(sessionId: string, worldId: string, expiresAt: Date): void {
  const existing = graceTimers.get(sessionId);
  if (existing) {
    clearTimeout(existing);
  }

  const delayMs = Math.max(0, expiresAt.getTime() - Date.now());

  const timer = setTimeout(() => {
    void cancelSessionAfterGrace(sessionId, worldId);
  }, delayMs);

  graceTimers.set(sessionId, timer);
}

export const hostGraceService = {
  async begin(sessionId: string, worldId: string): Promise<Date> {
    const expiresAt = computeHostGraceExpiresAt();
    await gameSessionsRepository.setHostGraceExpiresAt(sessionId, expiresAt);
    scheduleGraceTimer(sessionId, worldId, expiresAt);
    return expiresAt;
  },

  cancel(sessionId: string): void {
    const timer = graceTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      graceTimers.delete(sessionId);
    }
  },

  async clear(sessionId: string): Promise<void> {
    this.cancel(sessionId);
    await gameSessionsRepository.clearHostGraceExpiresAt(sessionId);
  },

  async restoreHost(sessionId: string, worldId: string, hostId: string): Promise<void> {
    await gameSessionsRepository.restoreHostPlayer(sessionId, hostId);
    await this.clear(sessionId);
    await worldGamesBroadcast.gameUpdated(worldId, sessionId);
  },

  async handleHostDisconnect(hostId: string): Promise<void> {
    const sessions = await gameSessionsRepository.findLobbySessionsHostedBy(hostId);

    for (const session of sessions) {
      if (session.hostGraceExpiresAt) {
        continue;
      }

      const hostPlayer = session.players.find((player) => player.userId === hostId);

      if (hostPlayer?.leftAt !== null) {
        continue;
      }

      await gameSessionsRepository.setPlayerLeft(session.id, hostId);
      await this.begin(session.id, session.worldId);
      await worldGamesBroadcast.gameUpdated(session.worldId, session.id);
      await gameLobbyBroadcast.lobbyUpdated(session.id);
    }
  },

  async recoverPendingTimers(): Promise<void> {
    try {
      const expired = await gameSessionsRepository.findExpiredHostGraceSessions();

      for (const session of expired) {
        await gameSessionsRepository.cancelSession(session.id);
        await worldGamesBroadcast.gameRemoved(session.worldId, session.id);
        await gameLobbyBroadcast.lobbyClosed(session.id, 'cancelled');
      }

      const pending = await gameSessionsRepository.findPendingHostGraceSessions();

      for (const session of pending) {
        if (session.hostGraceExpiresAt) {
          scheduleGraceTimer(session.id, session.worldId, session.hostGraceExpiresAt);
        }
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2021'
      ) {
        console.warn(
          'Host grace recovery skipped: GameSession table missing. Run `npx prisma migrate dev`.',
        );
        return;
      }

      throw error;
    }
  },
};
