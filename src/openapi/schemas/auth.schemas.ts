import { z } from 'zod';

import '../setup.js';
import { publicUserSchema } from './user.schemas.js';

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Имя пользователя: минимум 3 символа')
  .max(32, 'Имя пользователя: максимум 32 символа')
  .regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры и подчёркивание')
  .openapi({ description: 'Имя пользователя', example: 'alice' });

const passwordSchema = z
  .string()
  .min(8, 'Пароль: минимум 8 символов')
  .max(128, 'Пароль: максимум 128 символов')
  .openapi({ description: 'Пароль', format: 'password' });

const emailSchema = z
  .string()
  .trim()
  .email('Некорректный email')
  .toLowerCase()
  .openapi({ description: 'Email', example: 'user@example.com' });

export const registerBodySchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .openapi('RegisterBody', { description: 'Данные для регистрации' });

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .openapi('LoginBody', { description: 'Данные для входа' });

export const authTokensResponseSchema = z
  .object({
    accessToken: z
      .string()
      .openapi({ description: 'JWT access token (~15 мин). Хранить в памяти на фронте.' }),
    user: publicUserSchema,
  })
  .openapi('AuthTokensResponse', {
    description: 'Успешная аутентификация. Refresh token устанавливается в httpOnly cookie.',
  });

export const refreshAccessResponseSchema = z
  .object({
    accessToken: z.string().openapi({ description: 'Новый JWT access token' }),
  })
  .openapi('RefreshAccessResponse');

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
