import { openApiRegistry } from '../registry.js';
import {
  authTokensResponseSchema,
  loginBodySchema,
  refreshAccessResponseSchema,
  registerBodySchema,
} from '../schemas/auth.schemas.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';

const tag = 'Authentication';

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: [tag],
  summary: 'Регистрация',
  description:
    'Создаёт пользователя, возвращает access token и профиль. Refresh token записывается в httpOnly cookie (нужен credentials: include на фронте).',
  request: {
    body: {
      content: {
        'application/json': { schema: registerBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Пользователь создан',
      content: {
        'application/json': { schema: authTokensResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации',
      content: {
        'application/json': { schema: validationErrorSchema },
      },
    },
    409: {
      description: 'Email или имя пользователя уже заняты',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: [tag],
  summary: 'Вход',
  description:
    'Проверяет email и пароль. Возвращает access token и профиль. Refresh token — в httpOnly cookie.',
  request: {
    body: {
      content: {
        'application/json': { schema: loginBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Успешный вход',
      content: {
        'application/json': { schema: authTokensResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации',
      content: {
        'application/json': { schema: validationErrorSchema },
      },
    },
    401: {
      description: 'Неверный email или пароль',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: [tag],
  summary: 'Обновить access token',
  description:
    'Использует refresh token из cookie. Выполняет rotation: старый refresh удаляется, выдаётся новый в cookie. Вызывать при загрузке приложения для «тихого» входа.',
  security: [{ refreshCookie: [] }],
  responses: {
    200: {
      description: 'Новый access token',
      content: {
        'application/json': { schema: refreshAccessResponseSchema },
      },
    },
    401: {
      description: 'Cookie отсутствует, истёк или недействителен',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: [tag],
  summary: 'Выход',
  description: 'Отзывает refresh token в БД и удаляет cookie. Тело ответа пустое.',
  security: [{ refreshCookie: [] }],
  responses: {
    204: {
      description: 'Успешный выход',
    },
    401: {
      description: 'Недействительный refresh token (опционально)',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
