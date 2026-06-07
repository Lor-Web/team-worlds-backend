import { openApiRegistry } from '../registry.js';
import { apiErrorSchema } from '../schemas/common.schemas.js';
import { userResponseSchema } from '../schemas/user.schemas.js';

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
