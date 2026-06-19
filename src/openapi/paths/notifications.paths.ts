import { openApiRegistry } from '../registry.js';
import { apiErrorSchema } from '../schemas/common.schemas.js';
import {
  clearAllNotificationsResponseSchema,
  deleteNotificationResponseSchema,
  listNotificationsQuerySchema,
  markAllReadResponseSchema,
  markReadResponseSchema,
  notificationIdParamsSchema,
  notificationListResponseSchema,
  unreadCountResponseSchema,
} from '../schemas/notification.schemas.js';

const tag = 'Notifications';

openApiRegistry.registerPath({
  method: 'get',
  path: '/notifications',
  tags: [tag],
  summary: 'Лента уведомлений',
  description: 'Пагинация cursor-based. Новые сверху.',
  security: [{ bearerAuth: [] }],
  request: {
    query: listNotificationsQuerySchema,
  },
  responses: {
    200: {
      description: 'Страница уведомлений',
      content: {
        'application/json': { schema: notificationListResponseSchema },
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
  path: '/notifications/unread-count',
  tags: [tag],
  summary: 'Число непрочитанных',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Badge для колокольчика',
      content: {
        'application/json': { schema: unreadCountResponseSchema },
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
  method: 'patch',
  path: '/notifications/{notificationId}/read',
  tags: [tag],
  summary: 'Прочитать уведомление',
  description:
    'Идемпотентно: если уведомление уже удалено (например, после accept/decline приглашения), возвращает `notification: null` и актуальный `unreadCount`.',
  security: [{ bearerAuth: [] }],
  request: {
    params: notificationIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Уведомление прочитано или уже отсутствует',
      content: {
        'application/json': { schema: markReadResponseSchema },
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
  path: '/notifications/read-all',
  tags: [tag],
  summary: 'Прочитать все',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Все помечены прочитанными',
      content: {
        'application/json': { schema: markAllReadResponseSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/notifications',
  tags: [tag],
  summary: 'Очистить все уведомления',
  description: 'Удаляет всю ленту пользователя. Через socket приходит `notification:deleted` с `clearedAll: true`.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Лента очищена',
      content: {
        'application/json': { schema: clearAllNotificationsResponseSchema },
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
  method: 'delete',
  path: '/notifications/{notificationId}',
  tags: [tag],
  summary: 'Удалить уведомление',
  description: 'Идемпотентно: если уведомление уже удалено, возвращает `deleted: false`.',
  security: [{ bearerAuth: [] }],
  request: {
    params: notificationIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Уведомление удалено или уже отсутствует',
      content: {
        'application/json': { schema: deleteNotificationResponseSchema },
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
