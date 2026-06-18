import type { User, World, WorldMember, WorldMemberRole } from '@prisma/client';

import { getWorldMemberLimit } from '../../shared/worlds/world-limits.js';
import { parseWorldPermissions } from '../../shared/utils/worldPermissions.js';
import { toPublicUserDto } from '../users/users.dto.js';

export type WorldSummaryDto = {
  id: string;
  name: string;
  inviteCode: string;
  tier: World['tier'];
  maxMembers: number;
  ownerId: string;
  createdAt: string;
  myRole: WorldMemberRole;
  memberCount: number;
};

export type WorldMemberDto = {
  userId: string;
  role: WorldMemberRole;
  permissions: string[];
  joinedAt: string;
  user: ReturnType<typeof toPublicUserDto>;
};

export type WorldDetailDto = {
  id: string;
  name: string;
  inviteCode: string;
  tier: World['tier'];
  maxMembers: number;
  ownerId: string;
  createdAt: string;
  myRole: WorldMemberRole;
  memberCount: number;
  members: WorldMemberDto[];
};

export function toWorldSummaryDto(
  world: World,
  myRole: WorldMemberRole,
  memberCount: number,
): WorldSummaryDto {
  return {
    id: world.id,
    name: world.name,
    inviteCode: world.inviteCode,
    tier: world.tier,
    maxMembers: getWorldMemberLimit(world.tier),
    ownerId: world.ownerId,
    createdAt: world.createdAt.toISOString(),
    myRole,
    memberCount,
  };
}

export function toWorldMemberDto(
  member: WorldMember & { user: User },
): WorldMemberDto {
  return {
    userId: member.userId,
    role: member.role,
    permissions: parseWorldPermissions(member.permissions),
    joinedAt: member.joinedAt.toISOString(),
    user: toPublicUserDto(member.user),
  };
}
