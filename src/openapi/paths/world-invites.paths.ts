import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import { worldIdParamsSchema } from '../schemas/world.schemas.js';
import {
  acceptWorldInviteResponseSchema,
  createWorldInviteBodySchema,
  listWorldInvitesQuerySchema,
  worldInviteIdParamsSchema,
  worldInviteListResponseSchema,
  worldInviteResponseSchema,
} from '../schemas/world-invite.schemas.js';

const worldsTag = 'Worlds';
const invitesTag = 'World Invites';

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/{worldId}/invites',
  tags: [worldsTag],
  summary: 'Пригласить пользователя в мир',
  description:
    'Создаёт или обновляет pending-приглашение (TTL 7 дней). Доступ: owner или право `world.members.manage`. Если пользователь уже в мире — 409.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: createWorldInviteBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Приглашение создано или обновлено',
      content: {
        'application/json': { schema: worldInviteResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации или нельзя пригласить себя',
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
      description: 'Нет прав в мире',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Мир или пользователь не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Пользователь уже участник мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/world-invites/incoming',
  tags: [invitesTag],
  summary: 'Входящие приглашения в мир',
  description: 'Список приглашений для текущего пользователя. По умолчанию — только pending и не истёкшие.',
  security: [{ bearerAuth: [] }],
  request: {
    query: listWorldInvitesQuerySchema,
  },
  responses: {
    200: {
      description: 'Страница входящих приглашений',
      content: {
        'application/json': { schema: worldInviteListResponseSchema },
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
  path: '/world-invites/{inviteId}/accept',
  tags: [invitesTag],
  summary: 'Принять приглашение в мир',
  description: 'Вступление в мир по приглашению. Автоматически добавляет пользователя как member.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldInviteIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Приглашение принято, пользователь в мире',
      content: {
        'application/json': { schema: acceptWorldInviteResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Приглашение адресовано другому пользователю',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Приглашение не найдено',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Приглашение уже обработано, истекло или пользователь уже в мире',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/world-invites/{inviteId}/decline',
  tags: [invitesTag],
  summary: 'Отклонить приглашение в мир',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldInviteIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Приглашение отклонено',
      content: {
        'application/json': { schema: worldInviteResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Приглашение адресовано другому пользователю',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Приглашение не найдено',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Приглашение уже обработано или истекло',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
