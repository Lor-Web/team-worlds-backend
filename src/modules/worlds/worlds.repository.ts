import type { World, WorldMemberRole, WorldStage } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

const worldSummarySelect = {
  id: true,
  name: true,
  description: true,
  avatarUrl: true,
  backgroundUrl: true,
  inviteCode: true,
  tier: true,
  level: true,
  xp: true,
  stage: true,
  ownerId: true,
  deletedAt: true,
  createdAt: true,
  _count: { select: { members: true } },
} as const;

export type WorldSummaryRow = World & {
  _count: { members: number };
};

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
    return prisma.world.findFirst({
      where: {
        inviteCode,
        deletedAt: null,
      },
    });
  },

  deleteMembership(userId: string, worldId: string) {
    return prisma.worldMember.delete({
      where: {
        userId_worldId: { userId, worldId },
      },
    });
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

  listWorldsForUser(userId: string, includeArchived: boolean) {
    return prisma.worldMember.findMany({
      where: {
        userId,
        world: includeArchived ? undefined : { deletedAt: null },
      },
      include: {
        world: {
          select: worldSummarySelect,
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

  updateWorld(
    worldId: string,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      backgroundUrl?: string;
    },
  ) {
    return prisma.world.update({
      where: { id: worldId },
      data,
    });
  },

  updateProgression(
    worldId: string,
    data: { xp: number; level: number; stage: WorldStage },
  ) {
    return prisma.world.update({
      where: { id: worldId },
      data,
    });
  },

  softDeleteWorld(worldId: string): Promise<World> {
    return prisma.$transaction(async (tx) => {
      await tx.gameSession.updateMany({
        where: {
          worldId,
          status: { in: ['lobby', 'active'] },
        },
        data: {
          status: 'cancelled',
          finishedAt: new Date(),
        },
      });

      return tx.world.update({
        where: { id: worldId },
        data: { deletedAt: new Date() },
      });
    });
  },

  restoreWorld(worldId: string): Promise<World> {
    return prisma.world.update({
      where: { id: worldId },
      data: { deletedAt: null },
    });
  },

  listMemberUsers(worldId: string) {
    return prisma.worldMember.findMany({
      where: { worldId },
      select: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    }).then((rows) => rows.map((row) => row.user));
  },

  listMemberUserIds(worldId: string, excludeUserIds: string[] = []): Promise<string[]> {
    return prisma.worldMember
      .findMany({
        where: {
          worldId,
          userId: excludeUserIds.length > 0 ? { notIn: excludeUserIds } : undefined,
        },
        select: { userId: true },
      })
      .then((rows) => rows.map((row) => row.userId));
  },

  listWorldIdsForUser(userId: string): Promise<string[]> {
    return prisma.worldMember
      .findMany({
        where: { userId },
        select: { worldId: true },
      })
      .then((rows) => rows.map((row) => row.worldId));
  },

  countActiveWorlds(): Promise<number> {
    return prisma.world.count({ where: { deletedAt: null } });
  },

  hasActiveGameParticipation(userId: string, worldId: string): Promise<boolean> {
    return prisma.gameSessionPlayer
      .findFirst({
        where: {
          userId,
          leftAt: null,
          session: { worldId, status: 'active' },
        },
        select: { userId: true },
      })
      .then((row) => row !== null);
  },

  listLobbyParticipations(userId: string, worldId: string) {
    return prisma.gameSessionPlayer.findMany({
      where: {
        userId,
        leftAt: null,
        session: { worldId, status: 'lobby' },
      },
      include: {
        session: { select: { id: true, hostId: true, worldId: true } },
      },
    });
  },

  expirePendingInvitesForUser(worldId: string, userId: string) {
    return prisma.worldInvite.updateMany({
      where: { worldId, inviteeId: userId, status: 'pending' },
      data: { status: 'declined', respondedAt: new Date() },
    });
  },

  listActiveWorldsForRanking() {
    return prisma.world.findMany({
      where: { deletedAt: null },
      select: { id: true, xp: true, level: true, createdAt: true },
      orderBy: [{ xp: 'desc' }, { level: 'desc' }, { createdAt: 'asc' }],
    });
  },

  async getWorldRank(
    world: Pick<World, 'id' | 'xp' | 'level' | 'createdAt' | 'deletedAt'>,
  ): Promise<number> {
    if (world.deletedAt) {
      return 0;
    }

    const ahead = await prisma.world.count({
      where: {
        deletedAt: null,
        OR: [
          { xp: { gt: world.xp } },
          {
            xp: world.xp,
            level: { gt: world.level },
          },
          {
            xp: world.xp,
            level: world.level,
            createdAt: { lt: world.createdAt },
          },
        ],
      },
    });

    return ahead + 1;
  },

  listLeaderboard(limit: number) {
    return prisma.world.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        level: true,
        xp: true,
        stage: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: [{ xp: 'desc' }, { level: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
  },
};
