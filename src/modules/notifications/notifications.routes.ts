import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { notificationsController } from './notifications.controller.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from './notifications.validators.js';

export const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

notificationsRoutes.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  notificationsController.list,
);

notificationsRoutes.get('/unread-count', notificationsController.unreadCount);

notificationsRoutes.post('/read-all', notificationsController.markAllRead);

notificationsRoutes.delete('/', notificationsController.clearAll);

notificationsRoutes.patch(
  '/:notificationId/read',
  validate({ params: notificationIdParamsSchema }),
  notificationsController.markRead,
);

notificationsRoutes.delete(
  '/:notificationId',
  validate({ params: notificationIdParamsSchema }),
  notificationsController.deleteOne,
);
