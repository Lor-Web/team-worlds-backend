import type { User, World, WorldMember, WorldMemberRole } from '@prisma/client';

import { computeWorldProgression, getWorldStageLabel } from '../../config/world-progression.js';
import { getWorldMemberLimit } from '../../shared/worlds/world-limits.js';
import { parseWorldPermissions } from '../../shared/utils/worldPermissions.js';
import { toPublicUserDto } from '../users/users.dto.js';
import type { WorldRankInfo } from './world-ranking.service.js';

export type WorldProfileDto = {
  description: string;
  avatarUrl: string;
  backgroundUrl: string;
};

export type WorldProgressionFieldsDto = ReturnType<typeof computeWorldProgression>;

export type WorldRankingDto = {
  rank: number | null;
  totalWorlds: number;
};

export type WorldOnlineMemberDto = {
  id: string;
  username: string;
  avatar: string | null;
};

export type WorldSummaryDto = WorldProfileDto &
  WorldProgressionFieldsDto &
  WorldRankingDto & {
    id: string;
    name: string;
    inviteCode: string;
    tier: World['tier'];
    maxMembers: number;
    ownerId: string;
    createdAt: string;
    isArchived: boolean;
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

export type WorldDetailDto = WorldSummaryDto & {
  members: WorldMemberDto[];
  onlineMembers: WorldOnlineMemberDto[];
  onlineCount: number;
};

export type WorldLeaderboardItemDto = {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  stage: World['stage'];
  stageName: string;
  memberCount: number;
};

export type WorldLeaderboardResponseDto = {
  worlds: WorldLeaderboardItemDto[];
  totalWorlds: number;
};

function toWorldProfileDto(world: Pick<World, 'description' | 'avatarUrl' | 'backgroundUrl'>): WorldProfileDto {
  return {
    description: world.description,
    avatarUrl: world.avatarUrl,
    backgroundUrl: world.backgroundUrl,
  };
}

function toWorldProgressionFields(world: Pick<World, 'xp'>): WorldProgressionFieldsDto {
  return computeWorldProgression(world.xp);
}

function toWorldRankingDto(
  world: Pick<World, 'deletedAt'>,
  rankInfo?: WorldRankInfo,
): WorldRankingDto {
  if (world.deletedAt || !rankInfo) {
    return {
      rank: null,
      totalWorlds: rankInfo?.totalWorlds ?? 0,
    };
  }

  return {
    rank: rankInfo.rank,
    totalWorlds: rankInfo.totalWorlds,
  };
}

export function toWorldSummaryDto(
  world: World,
  myRole: WorldMemberRole,
  memberCount: number,
  rankInfo?: WorldRankInfo,
): WorldSummaryDto {
  return {
    id: world.id,
    name: world.name,
    inviteCode: world.inviteCode,
    tier: world.tier,
    maxMembers: getWorldMemberLimit(world.tier),
    ownerId: world.ownerId,
    createdAt: world.createdAt.toISOString(),
    isArchived: world.deletedAt !== null,
    myRole,
    memberCount,
    ...toWorldProfileDto(world),
    ...toWorldProgressionFields(world),
    ...toWorldRankingDto(world, rankInfo),
  };
}

export function toWorldDetailDto(
  world: World,
  myRole: WorldMemberRole,
  members: Array<WorldMember & { user: User }>,
  onlineMembers: WorldOnlineMemberDto[],
  rankInfo?: WorldRankInfo,
): WorldDetailDto {
  return {
    ...toWorldSummaryDto(world, myRole, members.length, rankInfo),
    members: members.map(toWorldMemberDto),
    onlineMembers,
    onlineCount: onlineMembers.length,
  };
}

export function toWorldLeaderboardItemDto(
  world: Pick<World, 'id' | 'name' | 'avatarUrl' | 'level' | 'xp' | 'stage'> & {
    _count: { members: number };
  },
  rank: number,
): WorldLeaderboardItemDto {
  return {
    rank,
    id: world.id,
    name: world.name,
    avatarUrl: world.avatarUrl,
    level: world.level,
    xp: world.xp,
    stage: world.stage,
    stageName: getWorldStageLabel(world.stage),
    memberCount: world._count.members,
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
