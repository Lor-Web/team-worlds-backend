import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import {
  createWorldBodySchema,
  joinWorldBodySchema,
  joinWorldResponseSchema,
  updateWorldBodySchema,
  worldDetailResponseSchema,
  worldIdParamsSchema,
  worldListResponseSchema,
  worldResponseSchema,
} from '../schemas/world.schemas.js';

const tag = 'Worlds';

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds',
  tags: [tag],
  summary: 'Создать мир',
  description:
    'Создаёт новый мир. Вы становитесь владельцем (owner). Генерируется уникальный код приглашения.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: createWorldBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Мир создан',
      content: {
        'application/json': {
          schema: worldResponseSchema,
        },
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

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/join',
  tags: [tag],
  summary: 'Вступить в мир',
  description:
    'Вступление по коду приглашения. Если вы уже участник — возвращает мир без ошибки.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: joinWorldBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Успешное вступление или вы уже в мире',
      content: {
        'application/json': { schema: joinWorldResponseSchema },
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
    403: {
      description: 'Достигнут лимит участников для статуса мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Код приглашения не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/worlds',
  tags: [tag],
  summary: 'Мои миры',
  description: 'Список миров, в которых вы участник.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Список миров',
      content: {
        'application/json': { schema: worldListResponseSchema },
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

openApiRegistry.registerPath({
  method: 'get',
  path: '/worlds/{worldId}',
  tags: [tag],
  summary: 'Детали мира',
  description: 'Информация о мире и список участников. Доступно только участникам мира.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Детали мира',
      content: {
        'application/json': { schema: worldDetailResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Вы не участник этого мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Мир не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'patch',
  path: '/worlds/{worldId}',
  tags: [tag],
  summary: 'Редактировать мир',
  description:
    'Обновление настроек мира. Сейчас доступно только название. Требуется право world.settings.manage (у owner есть автоматически). Статус мира (tier) меняется отдельно — позже через админку.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: updateWorldBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Мир обновлён',
      content: {
        'application/json': { schema: worldResponseSchema },
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
    403: {
      description: 'Недостаточно прав или вы не участник мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Мир не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
