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

export const worldMemberRoleSchema = z
  .enum(['owner', 'member'])
  .openapi({ description: 'Роль участника в мире' });

export const worldPermissionSchema = z
  .enum(WORLD_PERMISSION_CODES as [string, ...string[]])
  .openapi({ description: 'Дополнительное право участника (owner имеет все права)' });

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

export const updateWorldBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Название: минимум 2 символа')
      .max(64, 'Название: максимум 64 символа')
      .openapi({ description: 'Новое название мира', example: 'Новое название' }),
  })
  .openapi('UpdateWorldBody');

export const worldSummarySchema = z
  .object({
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
    joinedAt: z.string().datetime().openapi({ description: 'Дата вступления' }),
    user: publicUserSchema,
  })
  .openapi('WorldMember');

export const worldDetailSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    inviteCode: z.string(),
    tier: worldTierSchema,
    maxMembers: z.number().int(),
    ownerId: z.string(),
    createdAt: z.string().datetime(),
    myRole: worldMemberRoleSchema,
    memberCount: z.number().int(),
    members: z.array(worldMemberSchema),
  })
  .openapi('WorldDetail');

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
