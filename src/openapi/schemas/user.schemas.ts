import { z } from 'zod';

import '../setup.js';

export const siteRoleSchema = z
  .enum(['USER', 'ADMIN'])
  .openapi({ description: 'Роль пользователя на сайте' });

export const publicUserSchema = z
  .object({
    id: z.string().openapi({ description: 'ID пользователя' }),
    username: z.string().openapi({ description: 'Имя пользователя' }),
    email: z.string().email().openapi({ description: 'Email' }),
    avatar: z.string().nullable().openapi({ description: 'URL аватара' }),
    siteRole: siteRoleSchema,
    createdAt: z.string().datetime().openapi({ description: 'Дата регистрации (ISO 8601)' }),
  })
  .openapi('PublicUser');

export const userResponseSchema = z
  .object({
    user: publicUserSchema,
  })
  .openapi('UserResponse');
