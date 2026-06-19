import { z } from 'zod';

import '../setup.js';
import { userProfileSchema } from './user.schemas.js';
import { worldSummarySchema } from './world.schemas.js';

export const worldInviteStatusSchema = z
  .enum(['pending', 'accepted', 'declined', 'expired'])
  .openapi({ description: 'Статус приглашения в мир' });

export const createWorldInviteBodySchema = z
  .object({
    userId: z.string().cuid('Некорректный ID пользователя'),
  })
  .openapi('CreateWorldInviteBody');

export const worldInviteIdParamsSchema = z
  .object({
    inviteId: z.string().cuid('Некорректный ID приглашения'),
  })
  .openapi('WorldInviteIdParams');

export const listWorldInvitesQuerySchema = z
  .object({
    status: worldInviteStatusSchema.optional().default('pending').openapi({
      description: 'Фильтр по статусу (по умолчанию pending)',
    }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .openapi({ description: 'Размер страницы' }),
    cursor: z
      .string()
      .optional()
      .openapi({ description: 'Курсор следующей страницы из предыдущего ответа' }),
  })
  .openapi('ListWorldInvitesQuery');

export const worldInviteSchema = z
  .object({
    id: z.string(),
    worldId: z.string(),
    worldName: z.string(),
    status: worldInviteStatusSchema,
    inviter: userProfileSchema,
    inviteeId: z.string(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    respondedAt: z.string().datetime().nullable(),
  })
  .openapi('WorldInvite');

export const worldInviteResponseSchema = z
  .object({
    invite: worldInviteSchema,
  })
  .openapi('WorldInviteResponse');

export const worldInviteListResponseSchema = z
  .object({
    invites: z.array(worldInviteSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('WorldInviteListResponse');

export const acceptWorldInviteResponseSchema = z
  .object({
    invite: worldInviteSchema,
    world: worldSummarySchema,
  })
  .openapi('AcceptWorldInviteResponse');

export type CreateWorldInviteBody = z.infer<typeof createWorldInviteBodySchema>;
export type ListWorldInvitesQuery = z.infer<typeof listWorldInvitesQuerySchema>;
