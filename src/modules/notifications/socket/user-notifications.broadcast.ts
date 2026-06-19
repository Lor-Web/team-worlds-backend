import { getSocketServer } from '../../../socket/socket.server.js';
import { userRoom } from '../../../socket/socket.rooms.js';
import type { NotificationDto } from '../notifications.dto.js';
import { notificationsRepository } from '../notifications.repository.js';
import { UserNotificationSocketEvent } from './user-notifications.events.js';

export const userNotificationsBroadcast = {
  async notificationCreated(userId: string, notification: NotificationDto): Promise<void> {
    const io = getSocketServer();
    const unreadCount = await notificationsRepository.countUnread(userId);

    io.to(userRoom(userId)).emit(UserNotificationSocketEvent.notificationNew, {
      notification,
      unreadCount,
    });
  },

  async unreadCountUpdated(userId: string): Promise<void> {
    const io = getSocketServer();
    const unreadCount = await notificationsRepository.countUnread(userId);

    io.to(userRoom(userId)).emit(UserNotificationSocketEvent.unreadCountUpdated, {
      unreadCount,
    });
  },

  async notificationsDeleted(
    userId: string,
    notificationIds: string[],
    clearedAll = false,
  ): Promise<void> {
    const io = getSocketServer();
    const unreadCount = await notificationsRepository.countUnread(userId);

    io.to(userRoom(userId)).emit(UserNotificationSocketEvent.notificationDeleted, {
      notificationIds: clearedAll ? [] : notificationIds,
      clearedAll: clearedAll || undefined,
      unreadCount,
    });
  },

  async emitUnreadCountToSocket(socketId: string, userId: string): Promise<void> {
    const io = getSocketServer();
    const unreadCount = await notificationsRepository.countUnread(userId);

    io.to(socketId).emit(UserNotificationSocketEvent.unreadCountUpdated, {
      unreadCount,
    });
  },
};
