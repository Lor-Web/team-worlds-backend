/**
 * GameSession: lifecycle лобби (create, join, leave, ready, start).
 */
import { AppError } from '../../shared/errors/AppError.js';
import { WorldPermission } from '../../shared/permissions/world.permissions.js';
import { mergeGameSessionSettings } from '../../config/game-session.js';
import { WorldXpActivity } from '../../config/world-xp-rewards.js';
import { worldGamesBroadcast } from '../worlds/socket/world-games.broadcast.js';
import { worldAccessService } from '../worlds/world-access.service.js';
import { worldProgressionService } from '../worlds/world-progression.service.js';
import { gameAccessService } from './game-access.service.js';
import { hostGraceService } from './host-grace.service.js';
import { gameLobbyBroadcast } from './socket/game-lobby.broadcast.js';
import {
  getActivePlayers,
  parseGameConfig,
  parseSessionSettings,
  toGameSessionDto,
  toGameSessionListItemDto,
  type GameSessionDto,
  type GameSessionListItemDto,
} from './game-sessions.dto.js';
import {
  isSessionVisibleToUser,
  resolveListStatuses,
} from './game-sessions.helpers.js';
import { gameSessionsRepository } from './game-sessions.repository.js';
import { notificationTriggers } from '../notifications/notification-triggers.js';
import { quizTemplatesService } from '../quiz-templates/quiz-templates.service.js';
import { quizGameService } from '../quiz-game/quiz-game.service.js';
import { quizGameEngine } from '../quiz-game/quiz-game.engine.js';
import { quizGameBroadcast } from '../quiz-game/socket/quiz-game.broadcast.js';
import type {
  CreateGameSessionBody,
  ListWorldGamesQuery,
  SetReadyBody,
} from './game-sessions.validators.js';

async function getSessionDto(sessionId: string, viewerUserId: string): Promise<GameSessionDto> {
  const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

  if (!session) {
    throw new AppError('Игровая сессия не найдена', {
      statusCode: 404,
      code: 'GAME_SESSION_NOT_FOUND',
    });
  }

  return toGameSessionDto(session, viewerUserId);
}

function assertPlayerCapacity(activeCount: number, maxPlayers: number): void {
  if (activeCount >= maxPlayers) {
    throw new AppError('Сессия заполнена', {
      statusCode: 403,
      code: 'GAME_SESSION_FULL',
    });
  }
}

function assertCanStart(
  activePlayers: Array<{ isReady: boolean; role: string }>,
  settings: ReturnType<typeof parseSessionSettings>,
): void {
  if (activePlayers.length < settings.minPlayers) {
    throw new AppError('Недостаточно игроков для старта', {
      statusCode: 409,
      code: 'GAME_SESSION_NOT_ENOUGH_PLAYERS',
    });
  }

  if (settings.requireAllReady) {
    const notReady = activePlayers.some((player) => !player.isReady);
    if (notReady) {
      throw new AppError('Не все игроки готовы', {
        statusCode: 409,
        code: 'GAME_SESSION_NOT_ALL_READY',
      });
    }
  }
}

async function resolveGameConfigForCreate(
  worldId: string,
  input: CreateGameSessionBody,
): Promise<Record<string, unknown>> {
  if (input.templateSlug === 'quiz') {
    const quizSnapshot = await quizTemplatesService.buildSnapshotForSession(
      worldId,
      input.quizTemplateId!,
    );

    return {
      quizSnapshot,
      quizLobby: input.quizLobby!,
    };
  }

  return input.gameConfig ?? {};
}

export const gameSessionsService = {
  async createSession(
    userId: string,
    worldId: string,
    input: CreateGameSessionBody,
  ): Promise<GameSessionDto> {
    await worldAccessService.requireActiveMembership(userId, worldId);
    await worldAccessService.requirePermission(userId, worldId, WorldPermission.HOST_GAME);

    const template = await gameSessionsRepository.findTemplateBySlug(input.templateSlug);

    if (!template || !template.isEnabled) {
      throw new AppError('Шаблон игры не найден или отключён', {
        statusCode: 404,
        code: 'GAME_TEMPLATE_NOT_FOUND',
      });
    }

    const settings = mergeGameSessionSettings(template.defaultSettings, input.settings);

    if (settings.minPlayers > settings.maxPlayers) {
      throw new AppError('minPlayers не может быть больше maxPlayers', {
        statusCode: 400,
        code: 'INVALID_GAME_SESSION_SETTINGS',
      });
    }

    if (settings.maxPlayers > template.maxPlayers) {
      throw new AppError(`Максимум игроков для этого шаблона: ${template.maxPlayers}`, {
        statusCode: 400,
        code: 'INVALID_GAME_SESSION_SETTINGS',
      });
    }

    const gameConfig = await resolveGameConfigForCreate(worldId, input);

    const session = await gameSessionsRepository.createSessionWithHost({
      worldId,
      templateId: template.id,
      hostId: userId,
      settings,
      gameConfig,
    });

    await worldGamesBroadcast.gameCreated(worldId, session.id);

    await notificationTriggers.onWorldGameCreated({
      worldId,
      sessionId: session.id,
      hostId: userId,
    });

    return toGameSessionDto(session, userId);
  },

  async getSession(userId: string, sessionId: string): Promise<GameSessionDto> {
    const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!session) {
      throw new AppError('Игровая сессия не найдена', {
        statusCode: 404,
        code: 'GAME_SESSION_NOT_FOUND',
      });
    }

    await worldAccessService.requireActiveMembership(userId, session.worldId);

    return toGameSessionDto(session, userId);
  },

  async listWorldSessions(
    userId: string,
    worldId: string,
    query: ListWorldGamesQuery,
  ): Promise<GameSessionListItemDto[]> {
    await worldAccessService.requireActiveMembership(userId, worldId);

    const statuses = resolveListStatuses(query.status);
    const sessions = await gameSessionsRepository.listByWorld(worldId, statuses);

    return sessions
      .filter((session) => isSessionVisibleToUser(session, userId))
      .map((session) => toGameSessionListItemDto(session, userId));
  },

  async joinSession(userId: string, sessionId: string): Promise<GameSessionDto> {
    const session = await gameAccessService.requireSession(sessionId);
    await gameAccessService.requireLobby(session);
    await worldAccessService.requireActiveMembership(userId, session.worldId);

    if (session.hostId === userId && session.hostGraceExpiresAt) {
      await hostGraceService.restoreHost(sessionId, session.worldId, userId);
      await gameLobbyBroadcast.lobbyUpdated(sessionId);
      return getSessionDto(sessionId, userId);
    }

    const settings = parseSessionSettings(session.settings);
    const existingPlayer = await gameSessionsRepository.findPlayer(sessionId, userId);

    if (existingPlayer?.leftAt === null) {
      return getSessionDto(sessionId, userId);
    }

    const activeCount = await gameSessionsRepository.countActivePlayers(sessionId);
    assertPlayerCapacity(activeCount, settings.maxPlayers);

    await gameSessionsRepository.upsertPlayerJoin({
      gameSessionId: sessionId,
      userId,
      role: 'player',
    });

    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);

    await gameLobbyBroadcast.lobbyUpdated(sessionId);

    return getSessionDto(sessionId, userId);
  },

  async leaveSession(userId: string, sessionId: string): Promise<GameSessionDto> {
    const session = await gameAccessService.requireSession(sessionId);
    await gameAccessService.requireLobby(session);
    await gameAccessService.requireActiveParticipant(sessionId, userId);

    if (session.hostId === userId) {
      await gameSessionsRepository.setPlayerLeft(sessionId, userId);
      await hostGraceService.begin(sessionId, session.worldId);
      await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
      await gameLobbyBroadcast.lobbyUpdated(sessionId);
      return getSessionDto(sessionId, userId);
    }

    await gameSessionsRepository.setPlayerLeft(sessionId, userId);
    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
    await gameLobbyBroadcast.lobbyUpdated(sessionId);

    return getSessionDto(sessionId, userId);
  },

  async leaveLobbyPresence(userId: string, sessionId: string): Promise<void> {
    const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!session || session.status !== 'lobby') {
      return;
    }

    const player = session.players.find((item) => item.userId === userId);

    if (!player || player.leftAt !== null) {
      return;
    }

    await gameSessionsRepository.setPlayerLeft(sessionId, userId);

    if (session.hostId === userId && !session.hostGraceExpiresAt) {
      await hostGraceService.begin(sessionId, session.worldId);
    }

    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
    await gameLobbyBroadcast.lobbyUpdated(sessionId);
  },

  async setReady(
    userId: string,
    sessionId: string,
    input: SetReadyBody,
  ): Promise<GameSessionDto> {
    const session = await gameAccessService.requireSession(sessionId);
    await gameAccessService.requireLobby(session);
    await gameAccessService.requireActiveParticipant(sessionId, userId);

    if (session.hostId === userId && !input.isReady) {
      throw new AppError('Ведущий не может снять готовность', {
        statusCode: 409,
        code: 'GAME_HOST_CANNOT_UNREADY',
      });
    }

    await gameSessionsRepository.setPlayerReady(sessionId, userId, input.isReady);
    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
    await gameLobbyBroadcast.lobbyUpdated(sessionId);

    return getSessionDto(sessionId, userId);
  },

  async startSession(userId: string, sessionId: string): Promise<GameSessionDto> {
    const session = await gameAccessService.requireSession(sessionId);
    await gameAccessService.requireLobby(session);
    await gameAccessService.requireHost(session, userId);

    if (session.hostGraceExpiresAt) {
      throw new AppError('Ведущий временно отсутствует', {
        statusCode: 409,
        code: 'GAME_HOST_ABSENT',
      });
    }

    const sessionWithPlayers = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!sessionWithPlayers) {
      throw new AppError('Игровая сессия не найдена', {
        statusCode: 404,
        code: 'GAME_SESSION_NOT_FOUND',
      });
    }

    const settings = parseSessionSettings(sessionWithPlayers.settings);
    const activePlayers = getActivePlayers(sessionWithPlayers.players);

    assertCanStart(activePlayers, settings);

    const isQuiz = sessionWithPlayers.template.slug === 'quiz';
    let gameConfig = parseGameConfig(sessionWithPlayers.gameConfig);

    if (isQuiz) {
      const activePlayerIds = activePlayers.map((player) => player.userId);
      quizGameService.assertCanStart(activePlayerIds, gameConfig);
      gameConfig = quizGameService.initRuntimeOnStart(gameConfig, activePlayerIds);
      await gameSessionsRepository.updateGameConfig(sessionId, gameConfig);
    }

    await gameSessionsRepository.updateSessionStatus(sessionId, {
      status: 'active',
      startedAt: new Date(),
    });

    await hostGraceService.clear(sessionId);

    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
    await gameLobbyBroadcast.lobbyClosed(sessionId, 'started');
    await worldProgressionService.awardXpForActivity(
      session.worldId,
      WorldXpActivity.GAME_STARTED,
    );

    if (isQuiz) {
      await quizGameBroadcast.gameStarted(sessionId, gameConfig);
      await quizGameEngine.beginGame(sessionId);
    }

    return getSessionDto(sessionId, userId);
  },
};
