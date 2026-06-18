/**
 * Миры: создание, вступление по коду, список, детали, редактирование, архив.
 */
import { Prisma } from '@prisma/client';

import { WorldXpActivity } from '../../config/world-xp-rewards.js';
import { AppError } from '../../shared/errors/AppError.js';
import { WorldPermission } from '../../shared/permissions/world.permissions.js';
import { generateInviteCode } from '../../shared/utils/inviteCode.js';
import {
  assertWorldHasMemberSlot,
} from '../../shared/worlds/world-limits.js';
import { worldAccessService } from './world-access.service.js';
import { worldPresenceService } from './world-presence.service.js';
import { worldProgressionService } from './world-progression.service.js';
import { worldRankingService } from './world-ranking.service.js';
import {
  toWorldDetailDto,
  toWorldLeaderboardItemDto,
  toWorldSummaryDto,
  type WorldDetailDto,
  type WorldLeaderboardResponseDto,
  type WorldSummaryDto,
} from './worlds.dto.js';
import { worldsRepository } from './worlds.repository.js';
import type {
  CreateWorldBody,
  JoinWorldBody,
  ListWorldsQuery,
  ListWorldLeaderboardQuery,
  UpdateWorldBody,
} from './worlds.validators.js';

const INVITE_CODE_MAX_ATTEMPTS = 5;

async function createWorldWithUniqueInviteCode(
  name: string,
  ownerId: string,
): Promise<ReturnType<typeof worldsRepository.createWorldWithOwner>> {
  for (let attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt++) {
    const inviteCode = generateInviteCode();

    try {
      return await worldsRepository.createWorldWithOwner({
        name,
        inviteCode,
        ownerId,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('inviteCode')
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError('Не удалось создать мир, попробуйте снова', {
    statusCode: 500,
    code: 'INVITE_CODE_GENERATION_FAILED',
  });
}

function assertWorldNotArchived(
  world: { deletedAt: Date | null },
  message = 'Мир в архиве',
): void {
  if (world.deletedAt) {
    throw new AppError(message, {
      statusCode: 409,
      code: 'WORLD_ARCHIVED',
    });
  }
}

function assertOwner(membership: { role: string }): void {
  if (membership.role !== 'owner') {
    throw new AppError('Только владелец может выполнить это действие', {
      statusCode: 403,
      code: 'WORLD_OWNER_REQUIRED',
    });
  }
}

async function buildRankInfoForWorlds(
  worlds: Array<{ id: string; deletedAt: Date | null }>,
): Promise<Map<string, { rank: number; totalWorlds: number }>> {
  const rankMap = await worldRankingService.getRankMap();
  const totalWorlds = await worldsRepository.countActiveWorlds();
  const result = new Map<string, { rank: number; totalWorlds: number }>();

  for (const world of worlds) {
    if (world.deletedAt) {
      continue;
    }

    const rank = rankMap.get(world.id);

    if (rank) {
      result.set(world.id, { rank, totalWorlds });
    }
  }

  return result;
}

export const worldsService = {
  async createWorld(userId: string, input: CreateWorldBody): Promise<WorldSummaryDto> {
    const world = await createWorldWithUniqueInviteCode(input.name, userId);
    const rankInfo = await worldRankingService.getRankForWorld(world.id);

    return toWorldSummaryDto(world, 'owner', 1, rankInfo);
  },

  async joinWorld(userId: string, input: JoinWorldBody): Promise<WorldSummaryDto> {
    const world = await worldsRepository.findByInviteCode(input.inviteCode);

    if (!world) {
      throw new AppError('Мир с таким кодом не найден', {
        statusCode: 404,
        code: 'INVITE_CODE_NOT_FOUND',
      });
    }

    assertWorldNotArchived(world, 'Нельзя вступить в архивный мир');

    const existingMembership = await worldsRepository.findMembership(userId, world.id);

    if (existingMembership) {
      const memberCount = await worldsRepository.countMembers(world.id);
      const rankInfo = await worldRankingService.getRankForWorld(world.id);
      return toWorldSummaryDto(world, existingMembership.role, memberCount, rankInfo);
    }

    const memberCount = await worldsRepository.countMembers(world.id);
    assertWorldHasMemberSlot(world, memberCount);

    const membership = await worldsRepository.createMembership({
      userId,
      worldId: world.id,
      role: 'member',
    });

    await worldProgressionService.awardXpForActivity(world.id, WorldXpActivity.MEMBER_JOINED);

    const updatedWorld = await worldsRepository.findById(world.id);
    const updatedMemberCount = memberCount + 1;
    const rankInfo = await worldRankingService.getRankForWorld(world.id);

    return toWorldSummaryDto(updatedWorld ?? world, membership.role, updatedMemberCount, rankInfo);
  },

  async listMyWorlds(userId: string, query: ListWorldsQuery): Promise<WorldSummaryDto[]> {
    const memberships = await worldsRepository.listWorldsForUser(
      userId,
      query.includeArchived,
    );
    const rankInfoMap = await buildRankInfoForWorlds(
      memberships.map((membership) => membership.world),
    );
    const totalWorlds = await worldsRepository.countActiveWorlds();

    return memberships.map((membership) =>
      toWorldSummaryDto(
        membership.world,
        membership.role,
        membership.world._count.members,
        membership.world.deletedAt
          ? { rank: null, totalWorlds }
          : rankInfoMap.get(membership.world.id) ?? { rank: null, totalWorlds },
      ),
    );
  },

  async getWorldDetails(userId: string, worldId: string): Promise<WorldDetailDto> {
    const membership = await worldAccessService.requireMembership(userId, worldId);
    const world = await worldsRepository.findWorldWithMembers(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    const [onlineMembers, rankInfo] = await Promise.all([
      worldPresenceService.getOnlineMembersForWorld(worldId),
      worldRankingService.getRankForWorld(worldId),
    ]);

    return toWorldDetailDto(
      world,
      membership.role,
      world.members,
      onlineMembers,
      rankInfo,
    );
  },

  async listLeaderboard(query: ListWorldLeaderboardQuery): Promise<WorldLeaderboardResponseDto> {
    const [worlds, totalWorlds] = await Promise.all([
      worldRankingService.listLeaderboard(query.limit),
      worldsRepository.countActiveWorlds(),
    ]);

    return {
      worlds: worlds.map((world, index) => toWorldLeaderboardItemDto(world, index + 1)),
      totalWorlds,
    };
  },

  async updateWorld(
    userId: string,
    worldId: string,
    input: UpdateWorldBody,
  ): Promise<WorldSummaryDto> {
    const membership = await worldAccessService.requireMembership(userId, worldId);
    const world = await worldsRepository.findById(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    assertWorldNotArchived(world);

    const hasOwnerFields =
      input.description !== undefined ||
      input.avatarUrl !== undefined ||
      input.backgroundUrl !== undefined;

    if (hasOwnerFields) {
      assertOwner(membership);
    }

    if (input.name !== undefined) {
      await worldAccessService.requirePermission(
        userId,
        worldId,
        WorldPermission.MANAGE_SETTINGS,
      );
    }

    const updatedWorld = await worldsRepository.updateWorld(worldId, {
      name: input.name,
      description: input.description,
      avatarUrl: input.avatarUrl,
      backgroundUrl: input.backgroundUrl,
    });

    const memberCount = await worldsRepository.countMembers(worldId);
    const rankInfo = await worldRankingService.getRankForWorld(worldId);

    return toWorldSummaryDto(updatedWorld, membership.role, memberCount, rankInfo);
  },

  async archiveWorld(userId: string, worldId: string): Promise<WorldSummaryDto> {
    const membership = await worldAccessService.requireMembership(userId, worldId);
    assertOwner(membership);

    const world = await worldsRepository.findById(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    if (world.deletedAt) {
      throw new AppError('Мир уже в архиве', {
        statusCode: 409,
        code: 'WORLD_ALREADY_ARCHIVED',
      });
    }

    const archivedWorld = await worldsRepository.softDeleteWorld(worldId);
    const memberCount = await worldsRepository.countMembers(worldId);
    const totalWorlds = await worldsRepository.countActiveWorlds();

    return toWorldSummaryDto(archivedWorld, membership.role, memberCount, {
      rank: null,
      totalWorlds,
    });
  },

  async restoreWorld(userId: string, worldId: string): Promise<WorldSummaryDto> {
    const membership = await worldAccessService.requireMembership(userId, worldId);
    assertOwner(membership);

    const world = await worldsRepository.findById(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    if (!world.deletedAt) {
      throw new AppError('Мир не в архиве', {
        statusCode: 409,
        code: 'WORLD_NOT_ARCHIVED',
      });
    }

    const restoredWorld = await worldsRepository.restoreWorld(worldId);
    const memberCount = await worldsRepository.countMembers(worldId);
    const rankInfo = await worldRankingService.getRankForWorld(worldId);

    return toWorldSummaryDto(restoredWorld, membership.role, memberCount, rankInfo);
  },
};

export { assertWorldNotArchived };
