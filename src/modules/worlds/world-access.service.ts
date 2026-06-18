/**
 * Проверка членства и прав внутри мира.
 * owner всегда имеет все права; остальным права выдаются явно (этап 3).
 */
import type { WorldMember, WorldMemberRole } from '@prisma/client';

import { AppError } from '../../shared/errors/AppError.js';
import type { WorldPermissionCode } from '../../shared/permissions/world.permissions.js';
import { parseWorldPermissions } from '../../shared/utils/worldPermissions.js';
import { worldsRepository } from './worlds.repository.js';

export type WorldMembership = {
  userId: string;
  worldId: string;
  role: WorldMemberRole;
  permissions: WorldPermissionCode[];
  joinedAt: Date;
};

function toWorldMembership(member: WorldMember): WorldMembership {
  return {
    userId: member.userId,
    worldId: member.worldId,
    role: member.role,
    permissions: parseWorldPermissions(member.permissions),
    joinedAt: member.joinedAt,
  };
}

export function hasWorldPermission(
  member: Pick<WorldMembership, 'role' | 'permissions'>,
  permission: WorldPermissionCode,
): boolean {
  if (member.role === 'owner') {
    return true;
  }

  return member.permissions.includes(permission);
}

export const worldAccessService = {
  async getMembership(
    userId: string,
    worldId: string,
  ): Promise<WorldMembership | null> {
    const member = await worldsRepository.findMembership(userId, worldId);

    if (!member) {
      return null;
    }

    return toWorldMembership(member);
  },

  async requireMembership(userId: string, worldId: string): Promise<WorldMembership> {
    const membership = await this.getMembership(userId, worldId);

    if (!membership) {
      throw new AppError('Вы не участник этого мира', {
        statusCode: 403,
        code: 'NOT_WORLD_MEMBER',
      });
    }

    return membership;
  },

  async requireActiveMembership(userId: string, worldId: string): Promise<WorldMembership> {
    const membership = await this.requireMembership(userId, worldId);
    const world = await worldsRepository.findById(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    if (world.deletedAt) {
      throw new AppError('Мир в архиве', {
        statusCode: 409,
        code: 'WORLD_ARCHIVED',
      });
    }

    return membership;
  },

  async requirePermission(
    userId: string,
    worldId: string,
    permission: WorldPermissionCode,
  ): Promise<WorldMembership> {
    const membership = await this.requireMembership(userId, worldId);

    if (!hasWorldPermission(membership, permission)) {
      throw new AppError('Недостаточно прав в этом мире', {
        statusCode: 403,
        code: 'WORLD_PERMISSION_DENIED',
      });
    }

    return membership;
  },
};
