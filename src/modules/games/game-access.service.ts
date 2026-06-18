/**
 * Проверка доступа к игровой сессии.
 */
import type { GameSession } from '@prisma/client';

import { AppError } from '../../shared/errors/AppError.js';
import { worldAccessService } from '../worlds/world-access.service.js';
import { getActivePlayers, parseSessionSettings } from './game-sessions.dto.js';
import { isSessionVisibleToUser } from './game-sessions.helpers.js';
import { gameSessionsRepository } from './game-sessions.repository.js';

export type GameSessionWithDetails = NonNullable<
  Awaited<ReturnType<typeof gameSessionsRepository.findByIdWithDetails>>
>;

export const gameAccessService = {
  async requireSession(sessionId: string): Promise<GameSession> {
    const session = await gameSessionsRepository.findById(sessionId);

    if (!session) {
      throw new AppError('Игровая сессия не найдена', {
        statusCode: 404,
        code: 'GAME_SESSION_NOT_FOUND',
      });
    }

    return session;
  },

  async requireLobby(session: GameSession): Promise<GameSession> {
    if (session.status !== 'lobby') {
      throw new AppError('Действие доступно только в лобби', {
        statusCode: 409,
        code: 'GAME_SESSION_NOT_IN_LOBBY',
      });
    }

    return session;
  },

  async requireHost(session: GameSession, userId: string): Promise<GameSession> {
    if (session.hostId !== userId) {
      throw new AppError('Только ведущий может выполнить это действие', {
        statusCode: 403,
        code: 'GAME_SESSION_HOST_REQUIRED',
      });
    }

    return session;
  },

  async requireActiveParticipant(
    sessionId: string,
    userId: string,
  ): Promise<NonNullable<Awaited<ReturnType<typeof gameSessionsRepository.findPlayer>>>> {
    const player = await gameSessionsRepository.findPlayer(sessionId, userId);

    if (!player || player.leftAt !== null) {
      throw new AppError('Вы не участник этой сессии', {
        statusCode: 403,
        code: 'NOT_GAME_SESSION_PARTICIPANT',
      });
    }

    return player;
  },

  /** Подписка на лобби: участник или может войти (есть место). */
  async requireLobbyViewer(sessionId: string, userId: string): Promise<GameSessionWithDetails> {
    const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!session) {
      throw new AppError('Игровая сессия не найдена', {
        statusCode: 404,
        code: 'GAME_SESSION_NOT_FOUND',
      });
    }

    await worldAccessService.requireActiveMembership(userId, session.worldId);

    if (!isSessionVisibleToUser(session, userId)) {
      throw new AppError('Нет доступа к этой игре', {
        statusCode: 403,
        code: 'GAME_SESSION_FORBIDDEN',
      });
    }

    if (session.status !== 'lobby') {
      throw new AppError('Лобби закрыто', {
        statusCode: 409,
        code: 'GAME_LOBBY_CLOSED',
      });
    }

    const activePlayers = getActivePlayers(session.players);
    const isParticipant = activePlayers.some((player) => player.userId === userId);
    const settings = parseSessionSettings(session.settings);
    const canJoin = !isParticipant && activePlayers.length < settings.maxPlayers;

    if (!isParticipant && !canJoin) {
      throw new AppError('Сессия заполнена', {
        statusCode: 403,
        code: 'GAME_SESSION_FULL',
      });
    }

    return session;
  },
};
