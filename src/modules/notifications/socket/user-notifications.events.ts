/** Socket.IO — персональные уведомления пользователя. */
export const UserNotificationSocketEvent = {
  notificationNew: 'notification:new',
  notificationDeleted: 'notification:deleted',
  unreadCountUpdated: 'notification:unread-count-updated',
} as const;
