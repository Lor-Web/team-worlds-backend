/**
 * Миры: создание, вступление по коду, список, детали, редактирование.
 */
import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors/AppError.js';
import { WorldPermission } from '../../shared/permissions/world.permissions.js';
import { generateInviteCode } from '../../shared/utils/inviteCode.js';
import {
  assertWorldHasMemberSlot,
  getWorldMemberLimit,
} from '../../shared/worlds/world-limits.js';
import { worldAccessService } from './world-access.service.js';
import {
  toWorldMemberDto,
  toWorldSummaryDto,
  type WorldDetailDto,
  type WorldSummaryDto,
} from './worlds.dto.js';
import { worldsRepository } from './worlds.repository.js';
import type {
  CreateWorldBody,
  JoinWorldBody,
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

export const worldsService = {
  async createWorld(userId: string, input: CreateWorldBody): Promise<WorldSummaryDto> {
    const world = await createWorldWithUniqueInviteCode(input.name, userId);

    return toWorldSummaryDto(world, 'owner', 1);
  },

  async joinWorld(userId: string, input: JoinWorldBody): Promise<WorldSummaryDto> {
    const world = await worldsRepository.findByInviteCode(input.inviteCode);

    if (!world) {
      throw new AppError('Мир с таким кодом не найден', {
        statusCode: 404,
        code: 'INVITE_CODE_NOT_FOUND',
      });
    }

    const existingMembership = await worldsRepository.findMembership(userId, world.id);

    if (existingMembership) {
      const memberCount = await worldsRepository.countMembers(world.id);
      return toWorldSummaryDto(world, existingMembership.role, memberCount);
    }

    const memberCount = await worldsRepository.countMembers(world.id);
    assertWorldHasMemberSlot(world, memberCount);

    const membership = await worldsRepository.createMembership({
      userId,
      worldId: world.id,
      role: 'member',
    });

    const updatedMemberCount = memberCount + 1;
    return toWorldSummaryDto(world, membership.role, updatedMemberCount);
  },

  async listMyWorlds(userId: string): Promise<WorldSummaryDto[]> {
    const memberships = await worldsRepository.listWorldsForUser(userId);

    return memberships.map((membership) =>
      toWorldSummaryDto(
        membership.world,
        membership.role,
        membership.world._count.members,
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

    return {
      id: world.id,
      name: world.name,
      inviteCode: world.inviteCode,
      tier: world.tier,
      maxMembers: getWorldMemberLimit(world.tier),
      ownerId: world.ownerId,
      createdAt: world.createdAt.toISOString(),
      myRole: membership.role,
      memberCount: world.members.length,
      members: world.members.map(toWorldMemberDto),
    };
  },

  async updateWorld(
    userId: string,
    worldId: string,
    input: UpdateWorldBody,
  ): Promise<WorldSummaryDto> {
    const membership = await worldAccessService.requirePermission(
      userId,
      worldId,
      WorldPermission.MANAGE_SETTINGS,
    );

    const world = await worldsRepository.findById(worldId);

    if (!world) {
      throw new AppError('Мир не найден', {
        statusCode: 404,
        code: 'WORLD_NOT_FOUND',
      });
    }

    const updatedWorld = await worldsRepository.updateWorld(worldId, {
      name: input.name,
    });

    const memberCount = await worldsRepository.countMembers(worldId);
    return toWorldSummaryDto(updatedWorld, membership.role, memberCount);
  },
};
