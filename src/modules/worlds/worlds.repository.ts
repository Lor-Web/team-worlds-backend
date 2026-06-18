import type { World, WorldMemberRole } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

const worldWithMemberCountSelect = {
  id: true,
  name: true,
  inviteCode: true,
  tier: true,
  ownerId: true,
  createdAt: true,
  _count: { select: { members: true } },
} as const;

export const worldsRepository = {
  createWorldWithOwner(data: {
    name: string;
    inviteCode: string;
    ownerId: string;
  }): Promise<World> {
    return prisma.$transaction(async (tx) => {
      const world = await tx.world.create({
        data: {
          name: data.name,
          inviteCode: data.inviteCode,
          ownerId: data.ownerId,
        },
      });

      await tx.worldMember.create({
        data: {
          userId: data.ownerId,
          worldId: world.id,
          role: 'owner',
        },
      });

      return world;
    });
  },

  findById(worldId: string) {
    return prisma.world.findUnique({ where: { id: worldId } });
  },

  findByInviteCode(inviteCode: string) {
    return prisma.world.findUnique({ where: { inviteCode } });
  },

  findMembership(userId: string, worldId: string) {
    return prisma.worldMember.findUnique({
      where: {
        userId_worldId: { userId, worldId },
      },
    });
  },

  createMembership(data: {
    userId: string;
    worldId: string;
    role?: WorldMemberRole;
  }) {
    return prisma.worldMember.create({
      data: {
        userId: data.userId,
        worldId: data.worldId,
        role: data.role ?? 'member',
      },
    });
  },

  listWorldsForUser(userId: string) {
    return prisma.worldMember.findMany({
      where: { userId },
      include: {
        world: {
          select: worldWithMemberCountSelect,
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  },

  findWorldWithMembers(worldId: string) {
    return prisma.world.findUnique({
      where: { id: worldId },
      include: {
        members: {
          include: { user: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  },

  countMembers(worldId: string): Promise<number> {
    return prisma.worldMember.count({ where: { worldId } });
  },

  updateWorld(worldId: string, data: { name: string }) {
    return prisma.world.update({
      where: { id: worldId },
      data,
    });
  },
};
