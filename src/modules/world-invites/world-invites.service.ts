/**
 * Приглашения в мир: создание, входящие, принятие и отклонение.
 */
import { AppError } from '../../shared/errors/AppError.js';
import { prisma } from '../../shared/db/prisma.js';
import { WorldPermission } from '../../shared/permissions/world.permissions.js';
import { notificationTriggers } from '../notifications/notification-triggers.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { usersRepository } from '../users/users.repository.js';
import {
  assertWorldNotArchived,
  worldsService,
} from '../worlds/worlds.service.js';
import {
  hasWorldPermission,
  worldAccessService,
  type WorldMembership,
} from '../worlds/world-access.service.js';
import { worldsRepository } from '../worlds/worlds.repository.js';
import type { WorldSummaryDto } from '../worlds/worlds.dto.js';
import {
  decodeWorldInviteCursor,
  encodeWorldInviteCursor,
  toWorldInviteDto,
  WORLD_INVITE_TTL_MS,
  type WorldInviteDto,
  type WorldInviteListDto,
} from './world-invites.dto.js';
import { worldInvitesRepository } from './world-invites.repository.js';
import type { CreateWorldInviteBody, ListWorldInvitesQuery } from './world-invites.validators.js';

function assertCanManageInvites(membership: WorldMembership): void {
  if (!hasWorldPermission(membership, WorldPermission.MANAGE_MEMBERS)) {
    throw new AppError('Недостаточно прав для приглашения участников', {
      statusCode: 403,
      code: 'WORLD_PERMISSION_DENIED',
    });
  }
}

function assertInvitePendingAndValid(invite: {
  status: string;
  expiresAt: Date;
  id: string;
}): void {
  if (invite.status !== 'pending') {
    throw new AppError('Приглашение уже обработано', {
      statusCode: 409,
      code: 'INVITE_NOT_PENDING',
    });
  }

  if (invite.expiresAt <= new Date()) {
    void worldInvitesRepository.markExpired(invite.id);
    throw new AppError('Срок действия приглашения истёк', {
      statusCode: 409,
      code: 'INVITE_EXPIRED',
    });
  }
}

export const worldInvitesService = {
  async createInvite(
    inviterId: string,
    worldId: string,
    input: CreateWorldInviteBody,
  ): Promise<WorldInviteDto> {
    if (inviterId === input.userId) {
      throw new AppError('Нельзя пригласить себя', {
        statusCode: 400,
        code: 'CANNOT_INVITE_SELF',
      });
    }

    const membership = await worldAccessService.requireActiveMembership(inviterId, worldId);
    assertCanManageInvites(membership);

    const invitee = await usersRepository.findById(input.userId);

    if (!invitee) {
      throw new AppError('Пользователь не найден', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    const existingMembership = await worldsRepository.findMembership(input.userId, worldId);

    if (existingMembership) {
      throw new AppError('Пользователь уже участник этого мира', {
        statusCode: 409,
        code: 'ALREADY_WORLD_MEMBER',
      });
    }

    const expiresAt = new Date(Date.now() + WORLD_INVITE_TTL_MS);
    const invite = await worldInvitesRepository.upsertPending({
      worldId,
      inviterId,
      inviteeId: input.userId,
      expiresAt,
    });

    await notificationTriggers.onWorldInvite({
      worldId,
      inviteeUserId: input.userId,
      inviterUserId: inviterId,
      inviteId: invite.id,
    });

    return toWorldInviteDto(invite);
  },

  async listIncoming(userId: string, query: ListWorldInvitesQuery): Promise<WorldInviteListDto> {
    await prisma.worldInvite.updateMany({
      where: {
        inviteeId: userId,
        status: 'pending',
        expiresAt: { lte: new Date() },
      },
      data: {
        status: 'expired',
        respondedAt: new Date(),
      },
    });

    const cursor = query.cursor ? decodeWorldInviteCursor(query.cursor) : undefined;
    const rows = await worldInvitesRepository.listIncoming({
      inviteeId: userId,
      status: query.status,
      limit: query.limit,
      cursor,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const lastInvite = page.at(-1);

    return {
      invites: page.map(toWorldInviteDto),
      nextCursor: hasMore && lastInvite ? encodeWorldInviteCursor(lastInvite) : null,
    };
  },

  async acceptInvite(
    userId: string,
    inviteId: string,
  ): Promise<{ invite: WorldInviteDto; world: WorldSummaryDto }> {
    const invite = await worldInvitesRepository.findByIdWithRelations(inviteId);

    if (!invite) {
      throw new AppError('Приглашение не найдено', {
        statusCode: 404,
        code: 'INVITE_NOT_FOUND',
      });
    }

    if (invite.inviteeId !== userId) {
      throw new AppError('Это приглашение адресовано другому пользователю', {
        statusCode: 403,
        code: 'INVITE_FORBIDDEN',
      });
    }

    assertInvitePendingAndValid(invite);

    const world = await worldsRepository.findById(invite.worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    assertWorldNotArchived(world, 'Нельзя вступить в архивный мир');

    const existingMembership = await worldsRepository.findMembership(userId, invite.worldId);

    if (existingMembership) {
      throw new AppError('Вы уже участник этого мира', {
        statusCode: 409,
        code: 'ALREADY_WORLD_MEMBER',
      });
    }

    const worldSummary = await worldsService.joinWorldById(userId, invite.worldId);
    const acceptedInvite = await worldInvitesRepository.markResponded(inviteId, 'accepted');

    await notificationsService.removeWorldInviteNotifications(userId, inviteId);

    return {
      invite: toWorldInviteDto(acceptedInvite),
      world: worldSummary,
    };
  },

  async declineInvite(userId: string, inviteId: string): Promise<WorldInviteDto> {
    const invite = await worldInvitesRepository.findByIdWithRelations(inviteId);

    if (!invite) {
      throw new AppError('Приглашение не найдено', {
        statusCode: 404,
        code: 'INVITE_NOT_FOUND',
      });
    }

    if (invite.inviteeId !== userId) {
      throw new AppError('Это приглашение адресовано другому пользователю', {
        statusCode: 403,
        code: 'INVITE_FORBIDDEN',
      });
    }

    assertInvitePendingAndValid(invite);

    const declinedInvite = await worldInvitesRepository.markResponded(inviteId, 'declined');

    await notificationsService.removeWorldInviteNotifications(userId, inviteId);

    return toWorldInviteDto(declinedInvite);
  },
};
