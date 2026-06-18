import { z } from 'zod';

import '../setup.js';

export const gameTemplateSlugSchema = z
  .enum(['quiz', 'mafia', 'alias', 'custom'])
  .openapi({ description: 'Тип игры' });

export const gameSessionStatusSchema = z
  .enum(['lobby', 'active', 'finished', 'cancelled'])
  .openapi({ description: 'Статус игровой сессии' });

export const gamePlayerRoleSchema = z
  .enum(['host', 'player'])
  .openapi({ description: 'Роль в сессии' });

export const gameSessionSettingsSchema = z
  .object({
    minPlayers: z.number().int().min(1).max(50),
    maxPlayers: z.number().int().min(1).max(50),
    requireAllReady: z.boolean(),
    allowLateJoin: z.boolean(),
    isPrivate: z.boolean(),
    autoStartWhenAllReady: z.boolean(),
  })
  .openapi('GameSessionSettings');

export type GameSessionSettings = z.infer<typeof gameSessionSettingsSchema>;

export const gameSessionSettingsInputSchema = gameSessionSettingsSchema
  .partial()
  .openapi('GameSessionSettingsInput');

export const createGameSessionBodySchema = z
  .object({
    templateSlug: gameTemplateSlugSchema.openapi({
      description: 'Шаблон игры',
      example: 'quiz',
    }),
    settings: gameSessionSettingsInputSchema.optional().openapi({
      description: 'Настройки сессии (перекрывают дефолты шаблона)',
    }),
    gameConfig: z
      .record(z.unknown())
      .optional()
      .openapi({ description: 'Конфиг игры (пока пустой объект для не-Quiz)' }),
  })
  .openapi('CreateGameSessionBody');

export const setReadyBodySchema = z
  .object({
    isReady: z.boolean().openapi({ description: 'Готовность игрока' }),
  })
  .openapi('SetReadyBody');

export const gameSessionIdParamsSchema = z
  .object({
    sessionId: z.string().cuid('Некорректный ID сессии'),
  })
  .openapi('GameSessionIdParams');

export const gameSessionPlayerSchema = z
  .object({
    userId: z.string(),
    role: gamePlayerRoleSchema,
    isReady: z.boolean(),
    joinedAt: z.string().datetime(),
    leftAt: z.string().datetime().nullable(),
    user: z.object({
      id: z.string(),
      username: z.string(),
      avatar: z.string().nullable(),
    }),
  })
  .openapi('GameSessionPlayer');

export const gameSessionSchema = z
  .object({
    id: z.string(),
    worldId: z.string(),
    templateSlug: gameTemplateSlugSchema,
    templateName: z.string(),
    hostId: z.string(),
    status: gameSessionStatusSchema,
    settings: gameSessionSettingsSchema,
    gameConfig: z.record(z.unknown()),
    createdAt: z.string().datetime(),
    startedAt: z.string().datetime().nullable(),
    finishedAt: z.string().datetime().nullable(),
    hostGraceExpiresAt: z.string().datetime().nullable(),
    hostAbsent: z.boolean(),
    players: z.array(gameSessionPlayerSchema),
    myRole: gamePlayerRoleSchema.nullable(),
    myIsReady: z.boolean().nullable(),
  })
  .openapi('GameSession');

export const gameSessionResponseSchema = z
  .object({
    session: gameSessionSchema,
  })
  .openapi('GameSessionResponse');

export const listWorldGamesQuerySchema = z
  .object({
    status: z
      .enum(['lobby', 'active', 'open'])
      .optional()
      .default('open')
      .openapi({
        description:
          'lobby — только сбор игроков; active — только идущие; open — lobby + active (по умолчанию)',
      }),
  })
  .openapi('ListWorldGamesQuery');

export const gameSessionListItemSchema = z
  .object({
    id: z.string().openapi({ description: 'ID сессии' }),
    templateSlug: gameTemplateSlugSchema,
    templateName: z.string().openapi({ description: 'Название типа игры' }),
    hostId: z.string(),
    hostUsername: z.string().openapi({ description: 'Имя ведущего' }),
    status: gameSessionStatusSchema,
    playerCount: z.number().int().openapi({ description: 'Игроков в лобби/сессии' }),
    maxPlayers: z.number().int(),
    readyCount: z.number().int().openapi({ description: 'Сколько игроков ready' }),
    createdAt: z.string().datetime(),
    hostGraceExpiresAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: 'Когда отменится игра, если ведущий не вернётся' }),
    hostAbsent: z.boolean().openapi({ description: 'Ведущий временно отсутствует' }),
    myRole: gamePlayerRoleSchema.nullable(),
    myIsReady: z.boolean().nullable(),
    canJoin: z
      .boolean()
      .openapi({ description: 'Можно ли войти в лобби (status=lobby, есть места)' }),
    isParticipant: z.boolean().openapi({ description: 'Вы уже в этой сессии' }),
  })
  .openapi('GameSessionListItem');

export const gameSessionListResponseSchema = z
  .object({
    sessions: z.array(gameSessionListItemSchema),
  })
  .openapi('GameSessionListResponse');

export type CreateGameSessionBody = z.infer<typeof createGameSessionBodySchema>;
export type SetReadyBody = z.infer<typeof setReadyBodySchema>;
export type ListWorldGamesQuery = z.infer<typeof listWorldGamesQuerySchema>;
