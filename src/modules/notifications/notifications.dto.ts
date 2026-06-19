import type { Notification, NotificationType } from '@prisma/client';

import type { NotificationPayloadDto } from './notification-texts.js';

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: NotificationPayloadDto;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListDto = {
  notifications: NotificationDto[];
  nextCursor: string | null;
};

function parsePayload(value: unknown): NotificationPayloadDto {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as NotificationPayloadDto;
  }

  return {};
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    payload: parsePayload(notification.payload),
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function encodeNotificationCursor(notification: Notification): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: notification.createdAt.toISOString(),
      id: notification.id,
    }),
  ).toString('base64url');
}

export function decodeNotificationCursor(cursor: string): { createdAt: Date; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
    createdAt: string;
    id: string;
  };

  return {
    createdAt: new Date(parsed.createdAt),
    id: parsed.id,
  };
}
