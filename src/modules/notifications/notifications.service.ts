import { userNotificationsBroadcast } from './socket/user-notifications.broadcast.js';
import type { CreateNotificationInput } from './notification-texts.js';
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  toNotificationDto,
  type NotificationDto,
  type NotificationListDto,
} from './notifications.dto.js';
import { notificationsRepository } from './notifications.repository.js';
import type { ListNotificationsQuery } from './notifications.validators.js';

async function deliverNotification(input: CreateNotificationInput): Promise<NotificationDto> {
  const notification = await notificationsRepository.create(input);
  const dto = toNotificationDto(notification);

  await userNotificationsBroadcast.notificationCreated(input.userId, dto);

  return dto;
}

async function deliverToUsers(
  userIds: string[],
  build: (userId: string) => CreateNotificationInput,
): Promise<void> {
  const uniqueUserIds = [...new Set(userIds)];

  for (const userId of uniqueUserIds) {
    await deliverNotification(build(userId));
  }
}

export const notificationsService = {
  async list(userId: string, query: ListNotificationsQuery): Promise<NotificationListDto> {
    const cursor = query.cursor ? decodeNotificationCursor(query.cursor) : undefined;
    const rows = await notificationsRepository.listForUser({
      userId,
      limit: query.limit + 1,
      cursor,
    });

    const hasMore = rows.length > query.limit;
    const notifications = hasMore ? rows.slice(0, query.limit) : rows;
    const last = notifications.at(-1);

    return {
      notifications: notifications.map(toNotificationDto),
      nextCursor: hasMore && last ? encodeNotificationCursor(last) : null,
    };
  },

  async getUnreadCount(userId: string): Promise<number> {
    return notificationsRepository.countUnread(userId);
  },

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<{ notification: NotificationDto | null; unreadCount: number }> {
    const notification = await notificationsRepository.markRead(notificationId, userId);
    const unreadCount = await notificationsRepository.countUnread(userId);

    await userNotificationsBroadcast.unreadCountUpdated(userId);

    if (!notification) {
      return { notification: null, unreadCount };
    }

    return {
      notification: toNotificationDto(notification),
      unreadCount,
    };
  },

  async markAllRead(userId: string): Promise<number> {
    const count = await notificationsRepository.markAllRead(userId);
    await userNotificationsBroadcast.unreadCountUpdated(userId);
    return count;
  },

  async deleteOne(
    userId: string,
    notificationId: string,
  ): Promise<{ deleted: boolean; unreadCount: number }> {
    const deletedIds = await notificationsRepository.deleteForUser(notificationId, userId);
    const unreadCount = await notificationsRepository.countUnread(userId);

    if (deletedIds.length > 0) {
      await userNotificationsBroadcast.notificationsDeleted(userId, deletedIds);
    } else {
      await userNotificationsBroadcast.unreadCountUpdated(userId);
    }

    return {
      deleted: deletedIds.length > 0,
      unreadCount,
    };
  },

  async clearAll(userId: string): Promise<{ deletedCount: number; unreadCount: number }> {
    const deletedIds = await notificationsRepository.deleteAllForUser(userId);

    if (deletedIds.length > 0) {
      await userNotificationsBroadcast.notificationsDeleted(userId, deletedIds, true);
    } else {
      await userNotificationsBroadcast.unreadCountUpdated(userId);
    }

    return {
      deletedCount: deletedIds.length,
      unreadCount: 0,
    };
  },

  deliverNotification,
  deliverToUsers,

  async removeWorldInviteNotifications(userId: string, inviteId: string): Promise<void> {
    const deletedIds = await notificationsRepository.deleteWorldInviteByInviteId(userId, inviteId);

    if (deletedIds.length === 0) {
      return;
    }

    await userNotificationsBroadcast.notificationsDeleted(userId, deletedIds);
  },
};
