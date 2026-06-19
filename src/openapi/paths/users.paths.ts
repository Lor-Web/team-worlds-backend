import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import {
  searchUsersQuerySchema,
  userResponseSchema,
  userSearchListResponseSchema,
} from '../schemas/user.schemas.js';

openApiRegistry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Текущий пользователь',
  description: 'Возвращает профиль авторизованного пользователя по access token.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Профиль пользователя',
      content: {
        'application/json': { schema: userResponseSchema },
      },
    },
    401: {
      description: 'Токен отсутствует, истёк или недействителен',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Пользователь не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/users/search',
  tags: ['Users'],
  summary: 'Поиск пользователей',
  description:
    'Поиск по username (подстрока, без учёта регистра). Доступен любому авторизованному пользователю. Из результатов исключается только текущий пользователь. Email не возвращается.',
  security: [{ bearerAuth: [] }],
  request: {
    query: searchUsersQuerySchema,
  },
  responses: {
    200: {
      description: 'Страница результатов поиска',
      content: {
        'application/json': { schema: userSearchListResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации',
      content: {
        'application/json': { schema: validationErrorSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
