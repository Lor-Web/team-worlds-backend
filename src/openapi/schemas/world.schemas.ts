import { z } from 'zod';

import { WORLD_PERMISSION_CODES } from '../../shared/permissions/world.permissions.js';
import '../setup.js';
import { publicUserSchema } from './user.schemas.js';

export const worldTierSchema = z
  .enum(['STANDARD', 'EXTENDED', 'VIP'])
  .openapi({
    description: 'Статус мира: STANDARD — обычный, EXTENDED — расширенный, VIP — VIP',
    example: 'STANDARD',
  });

export const worldStageSchema = z
  .enum(['OUTPOST', 'SETTLEMENT', 'CITY', 'METROPOLIS', 'CELESTIAL_CITADEL'])
  .openapi({ description: 'Стадия эволюции мира' });

export const worldMemberRoleSchema = z
  .enum(['owner', 'member'])
  .openapi({ description: 'Роль участника в мире' });

export const worldPermissionSchema = z
  .enum(WORLD_PERMISSION_CODES as [string, ...string[]])
  .openapi({ description: 'Дополнительное право участника (owner имеет все права)' });

export const worldProgressionSchema = z
  .object({
    level: z.number().int().openapi({ description: 'Уровень мира' }),
    xp: z.number().int().openapi({ description: 'Накопленный опыт' }),
    stage: worldStageSchema,
    stageName: z.string().openapi({ description: 'Название стадии на русском' }),
    xpInLevel: z.number().int().openapi({ description: 'XP внутри текущего уровня' }),
    xpToNextLevel: z.number().int().openapi({ description: 'XP до следующего уровня' }),
    progressToNextLevel: z
      .number()
      .min(0)
      .max(1)
      .openapi({ description: 'Прогресс до след. уровня (0..1)' }),
  })
  .openapi('WorldProgression');

export const worldProfileSchema = z
  .object({
    description: z.string().openapi({ description: 'Описание мира' }),
    avatarUrl: z.string().openapi({ description: 'URL аватарки (пока заглушка — пустая строка)' }),
    backgroundUrl: z
      .string()
      .openapi({ description: 'URL фона (пока заглушка — пустая строка)' }),
  })
  .openapi('WorldProfile');

export const createWorldBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Название: минимум 2 символа')
      .max(64, 'Название: максимум 64 символа')
      .openapi({ description: 'Название мира', example: 'Наша компания' }),
  })
  .openapi('CreateWorldBody');

export const joinWorldBodySchema = z
  .object({
    inviteCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(6, 'Код приглашения: минимум 6 символов')
      .max(12, 'Код приглашения: максимум 12 символов')
      .regex(/^[A-Z0-9]+$/, 'Код приглашения: только латиница и цифры')
      .openapi({ description: 'Код приглашения в мир', example: 'AB12CD34' }),
  })
  .openapi('JoinWorldBody');

export const worldIdParamsSchema = z
  .object({
    worldId: z.string().cuid('Некорректный ID мира'),
  })
  .openapi('WorldIdParams');

export const worldMemberParamsSchema = worldIdParamsSchema
  .extend({
    userId: z.string().cuid('Некорректный ID пользователя'),
  })
  .openapi('WorldMemberParams');

export const listWorldsQuerySchema = z
  .object({
    includeArchived: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((value) => value === 'true')
      .openapi({
        description: 'Включить архивные миры в список',
      }),
  })
  .openapi('ListWorldsQuery');

export const listWorldLeaderboardQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .openapi({ description: 'Сколько миров вернуть в топе' }),
  })
  .openapi('ListWorldLeaderboardQuery');

export const worldRankingSchema = z
  .object({
    rank: z
      .number()
      .int()
      .nullable()
      .openapi({ description: 'Место в глобальном топе (null для архивных)' }),
    totalWorlds: z.number().int().openapi({ description: 'Всего активных миров' }),
  })
  .openapi('WorldRanking');

export const worldOnlineMemberSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
  })
  .openapi('WorldOnlineMember');

export const updateWorldBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Название: минимум 2 символа')
      .max(64, 'Название: максимум 64 символа')
      .optional()
      .openapi({ description: 'Новое название мира', example: 'Новое название' }),
    description: z
      .string()
      .trim()
      .max(500, 'Описание: максимум 500 символов')
      .optional()
      .openapi({ description: 'Описание мира (только owner)' }),
    avatarUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .openapi({ description: 'URL аватарки (только owner)' }),
    backgroundUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .openapi({ description: 'URL фона (только owner)' }),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.description !== undefined ||
      body.avatarUrl !== undefined ||
      body.backgroundUrl !== undefined,
    { message: 'Укажите хотя бы одно поле для обновления' },
  )
  .openapi('UpdateWorldBody');

export const worldSummarySchema = worldProfileSchema
  .merge(worldProgressionSchema)
  .merge(worldRankingSchema)
  .extend({
    id: z.string().openapi({ description: 'ID мира' }),
    name: z.string().openapi({ description: 'Название' }),
    inviteCode: z.string().openapi({ description: 'Код приглашения' }),
    tier: worldTierSchema.openapi({ description: 'Статус мира' }),
    maxMembers: z
      .number()
      .int()
      .openapi({ description: 'Максимум участников для текущего статуса' }),
    ownerId: z.string().openapi({ description: 'ID владельца' }),
    createdAt: z.string().datetime().openapi({ description: 'Дата создания' }),
    isArchived: z.boolean().openapi({ description: 'Мир в архиве' }),
    myRole: worldMemberRoleSchema.openapi({ description: 'Ваша роль в мире' }),
    memberCount: z.number().int().openapi({ description: 'Текущее число участников' }),
  })
  .openapi('WorldSummary');

export const worldMemberSchema = z
  .object({
    userId: z.string().openapi({ description: 'ID пользователя' }),
    role: worldMemberRoleSchema,
    permissions: z
      .array(worldPermissionSchema)
      .openapi({ description: 'Дополнительные права' }),
    rating: z
      .number()
      .int()
      .min(0)
      .openapi({ description: 'Рейтинг участника в мире (не ниже 0)' }),
    joinedAt: z.string().datetime().openapi({ description: 'Дата вступления' }),
    user: publicUserSchema,
  })
  .openapi('WorldMember');

export const worldDetailSchema = worldSummarySchema
  .extend({
    members: z.array(worldMemberSchema),
    onlineMembers: z
      .array(worldOnlineMemberSchema)
      .openapi({ description: 'Участники мира, сейчас онлайн на сайте' }),
    onlineCount: z
      .number()
      .int()
      .openapi({ description: 'Сколько участников мира онлайн на сайте' }),
  })
  .openapi('WorldDetail');

export const worldLeaderboardItemSchema = z
  .object({
    rank: z.number().int(),
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    level: z.number().int(),
    xp: z.number().int(),
    stage: worldStageSchema,
    stageName: z.string(),
    memberCount: z.number().int(),
  })
  .openapi('WorldLeaderboardItem');

export const worldLeaderboardResponseSchema = z
  .object({
    worlds: z.array(worldLeaderboardItemSchema),
    totalWorlds: z
      .number()
      .int()
      .openapi({ description: 'Всего активных миров в рейтинге' }),
  })
  .openapi('WorldLeaderboardResponse');

export const worldListResponseSchema = z
  .object({
    worlds: z.array(worldSummarySchema),
  })
  .openapi('WorldListResponse');

export const worldDetailResponseSchema = z
  .object({
    world: worldDetailSchema,
  })
  .openapi('WorldDetailResponse');

export const worldResponseSchema = z
  .object({
    world: worldSummarySchema,
  })
  .openapi('WorldResponse');

export const joinWorldResponseSchema = worldResponseSchema.openapi('JoinWorldResponse');

export type CreateWorldBody = z.infer<typeof createWorldBodySchema>;
export type JoinWorldBody = z.infer<typeof joinWorldBodySchema>;
export type UpdateWorldBody = z.infer<typeof updateWorldBodySchema>;
export type ListWorldsQuery = z.infer<typeof listWorldsQuerySchema>;
export type ListWorldLeaderboardQuery = z.infer<typeof listWorldLeaderboardQuerySchema>;
