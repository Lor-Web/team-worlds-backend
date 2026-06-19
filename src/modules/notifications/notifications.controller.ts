import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { notificationsService } from './notifications.service.js';
import type { ListNotificationsQuery } from './notifications.validators.js';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const query = req.query as unknown as ListNotificationsQuery;
    const result = await notificationsService.list(userId, query);

    res.json(result);
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const unreadCount = await notificationsService.getUnreadCount(userId);

    res.json({ unreadCount });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { notificationId } = req.params as { notificationId: string };
    const result = await notificationsService.markRead(userId, notificationId);

    res.json(result);
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const markedCount = await notificationsService.markAllRead(userId);

    res.json({ markedCount });
  }),

  deleteOne: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { notificationId } = req.params as { notificationId: string };
    const result = await notificationsService.deleteOne(userId, notificationId);

    res.json(result);
  }),

  clearAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const result = await notificationsService.clearAll(userId);

    res.json(result);
  }),
};
