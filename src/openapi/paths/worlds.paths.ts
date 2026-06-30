import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import {
  createWorldBodySchema,
  joinWorldBodySchema,
  joinWorldResponseSchema,
  listWorldLeaderboardQuerySchema,
  listWorldsQuerySchema,
  updateWorldBodySchema,
  worldDetailResponseSchema,
  worldIdParamsSchema,
  worldLeaderboardResponseSchema,
  worldListResponseSchema,
  worldMemberParamsSchema,
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
  description:
    'Список миров, в которых вы участник. По умолчанию архивные скрыты; `includeArchived=true` — показать с `isArchived: true`.',
  security: [{ bearerAuth: [] }],
  request: {
    query: listWorldsQuerySchema,
  },
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
  path: '/worlds/leaderboard',
  tags: [tag],
  summary: 'Топ миров',
  description:
    'Глобальный рейтинг активных миров: xp DESC, level DESC, createdAt ASC.',
  security: [{ bearerAuth: [] }],
  request: {
    query: listWorldLeaderboardQuerySchema,
  },
  responses: {
    200: {
      description: 'Топ миров',
      content: {
        'application/json': { schema: worldLeaderboardResponseSchema },
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
    'Обновление профиля мира. Название — право world.settings.manage. Описание, avatarUrl, backgroundUrl — только owner. Архивный мир редактировать нельзя.',
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
    409: {
      description: 'Мир в архиве',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/worlds/{worldId}',
  tags: [tag],
  summary: 'Архивировать мир',
  description:
    'Soft delete: мир помечается архивным (`deletedAt`). Открытые игры отменяются. Только owner. Восстановление — POST /worlds/{worldId}/restore.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Мир в архиве',
      content: {
        'application/json': { schema: worldResponseSchema },
      },
    },
    403: {
      description: 'Только владелец',
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
    409: {
      description: 'Мир уже в архиве',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/{worldId}/restore',
  tags: [tag],
  summary: 'Восстановить мир из архива',
  description: 'Снимает архив (`deletedAt = null`). Только owner.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Мир восстановлен',
      content: {
        'application/json': { schema: worldResponseSchema },
      },
    },
    403: {
      description: 'Только владелец',
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
    409: {
      description: 'Мир не в архиве',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/{worldId}/leave',
  tags: [tag],
  summary: 'Покинуть мир',
  description:
    'Участник (не owner) выходит из мира. Открытые лобби покидаются автоматически. Во время активной игры — 409.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
  },
  responses: {
    204: {
      description: 'Вы покинули мир',
    },
    403: {
      description: 'Вы не участник или вы owner',
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
    409: {
      description: 'Мир в архиве или активная игра',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/worlds/{worldId}/members/{userId}',
  tags: [tag],
  summary: 'Исключить участника',
  description:
    'Owner исключает участника из мира. Нельзя исключить себя или другого owner.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldMemberParamsSchema,
  },
  responses: {
    200: {
      description: 'Участник исключён, обновлённые детали мира',
      content: {
        'application/json': { schema: worldDetailResponseSchema },
      },
    },
    400: {
      description: 'Нельзя исключить себя',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Только owner',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Мир или участник не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Мир в архиве или участник в активной игре',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
