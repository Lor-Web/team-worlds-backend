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

export const userProfileSchema = z
  .object({
    id: z.string().openapi({ description: 'ID пользователя' }),
    username: z.string().openapi({ description: 'Имя пользователя' }),
    avatar: z.string().nullable().openapi({ description: 'URL аватара' }),
    siteRole: siteRoleSchema,
    createdAt: z.string().datetime().openapi({ description: 'Дата регистрации (ISO 8601)' }),
  })
  .openapi('UserProfile');

export const userResponseSchema = z
  .object({
    user: publicUserSchema,
  })
  .openapi('UserResponse');

export const searchUsersQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(2, 'Минимум 2 символа')
      .max(50, 'Максимум 50 символов')
      .openapi({ description: 'Строка поиска по username (без учёта регистра, подстрока)' }),
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
  .openapi('SearchUsersQuery');

export const userSearchListResponseSchema = z
  .object({
    users: z.array(userProfileSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('UserSearchListResponse');

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
