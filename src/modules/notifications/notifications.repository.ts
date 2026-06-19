import type { Notification, NotificationType } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';
import type { NotificationPayloadDto } from './notification-texts.js';

export type NotificationRow = Notification;

export const notificationsRepository = {
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    payload: NotificationPayloadDto;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        payload: data.payload,
      },
    });
  },

  createMany(
    items: Array<{
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
      payload: NotificationPayloadDto;
    }>,
  ): Promise<number> {
    if (items.length === 0) {
      return Promise.resolve(0);
    }

    return prisma.notification
      .createMany({ data: items })
      .then((result) => result.count);
  },

  findByIdForUser(notificationId: string, userId: string): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
  },

  listForUser(input: {
    userId: string;
    limit: number;
    cursor?: { createdAt: Date; id: string };
  }): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId: input.userId,
        ...(input.cursor
          ? {
              OR: [
                { createdAt: { lt: input.cursor.createdAt } },
                {
                  createdAt: input.cursor.createdAt,
                  id: { lt: input.cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit,
    });
  },

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  },

  markRead(notificationId: string, userId: string): Promise<Notification | null> {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    }).then(async (result) => {
      if (result.count === 0) {
        return notificationsRepository.findByIdForUser(notificationId, userId);
      }

      return notificationsRepository.findByIdForUser(notificationId, userId);
    });
  },

  markAllRead(userId: string): Promise<number> {
    return prisma.notification
      .updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      })
      .then((result) => result.count);
  },

  deleteForUser(notificationId: string, userId: string): Promise<string[]> {
    return prisma.notification
      .deleteMany({
        where: { id: notificationId, userId },
      })
      .then((result) => (result.count > 0 ? [notificationId] : []));
  },

  deleteAllForUser(userId: string): Promise<string[]> {
    return prisma.$transaction(async (tx) => {
      const notifications = await tx.notification.findMany({
        where: { userId },
        select: { id: true },
      });

      if (notifications.length === 0) {
        return [];
      }

      const ids = notifications.map((notification) => notification.id);

      await tx.notification.deleteMany({ where: { userId } });

      return ids;
    });
  },

  deleteWorldInviteByInviteId(userId: string, inviteId: string): Promise<string[]> {
    return prisma.$transaction(async (tx) => {
      const notifications = await tx.notification.findMany({
        where: { userId, type: 'WORLD_INVITE' },
        select: { id: true, payload: true },
      });

      const ids = notifications
        .filter((notification) => {
          const payload = notification.payload;

          return (
            typeof payload === 'object' &&
            payload !== null &&
            !Array.isArray(payload) &&
            (payload as { inviteId?: string }).inviteId === inviteId
          );
        })
        .map((notification) => notification.id);

      if (ids.length === 0) {
        return [];
      }

      await tx.notification.deleteMany({ where: { id: { in: ids } } });

      return ids;
    });
  },
};
