import { z } from 'zod';

import '../setup.js';

export const notificationTypeSchema = z
  .enum([
    'WORLD_GAME_CREATED',
    'WORLD_MEMBER_JOINED',
    'WORLD_PROGRESSION',
    'WORLD_INVITE',
    'GAME_INVITE',
    'WORLD_ARCHIVED',
  ])
  .openapi({ description: 'Тип уведомления' });

export const notificationPayloadSchema = z
  .object({
    worldId: z.string().optional(),
    worldName: z.string().optional(),
    sessionId: z.string().optional(),
    templateSlug: z.string().optional(),
    actorUserId: z.string().optional(),
    actorUsername: z.string().optional(),
    level: z.number().int().optional(),
    stage: z.string().optional(),
    stageName: z.string().optional(),
    inviteId: z.string().optional(),
  })
  .openapi('NotificationPayload');

export const notificationSchema = z
  .object({
    id: z.string(),
    type: notificationTypeSchema,
    title: z.string(),
    body: z.string(),
    payload: notificationPayloadSchema,
    readAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi('Notification');

export const notificationIdParamsSchema = z
  .object({
    notificationId: z.string().cuid('Некорректный ID уведомления'),
  })
  .openapi('NotificationIdParams');

export const listNotificationsQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .openapi({ description: 'Размер страницы' }),
    cursor: z
      .string()
      .optional()
      .openapi({ description: 'Курсор следующей страницы из предыдущего ответа' }),
  })
  .openapi('ListNotificationsQuery');

export const notificationListResponseSchema = z
  .object({
    notifications: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('NotificationListResponse');

export const unreadCountResponseSchema = z
  .object({
    unreadCount: z.number().int(),
  })
  .openapi('UnreadCountResponse');

export const markAllReadResponseSchema = z
  .object({
    markedCount: z.number().int(),
  })
  .openapi('MarkAllReadResponse');

export const notificationResponseSchema = z
  .object({
    notification: notificationSchema,
  })
  .openapi('NotificationResponse');

export const markReadResponseSchema = z
  .object({
    notification: notificationSchema.nullable().openapi({
      description: 'null — уведомление уже удалено или не найдено (идемпотентный успех)',
    }),
    unreadCount: z.number().int().openapi({ description: 'Актуальное число непрочитанных' }),
  })
  .openapi('MarkReadResponse');

export const deleteNotificationResponseSchema = z
  .object({
    deleted: z.boolean().openapi({
      description: 'false — уведомление уже удалено (идемпотентный успех)',
    }),
    unreadCount: z.number().int(),
  })
  .openapi('DeleteNotificationResponse');

export const clearAllNotificationsResponseSchema = z
  .object({
    deletedCount: z.number().int(),
    unreadCount: z.number().int(),
  })
  .openapi('ClearAllNotificationsResponse');

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
