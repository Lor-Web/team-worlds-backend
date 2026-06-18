import type { GamePlayerRole, GameSessionStatus, GameTemplateSlug } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

const sessionInclude = {
  template: true,
  players: {
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
} as const;

const listSessionInclude = {
  template: { select: { slug: true, name: true } },
  host: { select: { id: true, username: true } },
  players: {
    select: {
      userId: true,
      role: true,
      isReady: true,
      leftAt: true,
    },
  },
} as const;

export const gameSessionsRepository = {
  findTemplateBySlug(slug: GameTemplateSlug) {
    return prisma.gameTemplate.findUnique({ where: { slug } });
  },

  findById(sessionId: string) {
    return prisma.gameSession.findUnique({ where: { id: sessionId } });
  },

  findByIdWithDetails(sessionId: string) {
    return prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
  },

  findPlayer(sessionId: string, userId: string) {
    return prisma.gameSessionPlayer.findUnique({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId },
      },
    });
  },

  createSessionWithHost(data: {
    worldId: string;
    templateId: string;
    hostId: string;
    settings: object;
    gameConfig: object;
  }) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.create({
        data: {
          worldId: data.worldId,
          templateId: data.templateId,
          hostId: data.hostId,
          settings: data.settings,
          gameConfig: data.gameConfig,
        },
      });

      await tx.gameSessionPlayer.create({
        data: {
          gameSessionId: session.id,
          userId: data.hostId,
          role: 'host',
          isReady: true,
        },
      });

      return tx.gameSession.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionInclude,
      });
    });
  },

  upsertPlayerJoin(data: {
    gameSessionId: string;
    userId: string;
    role?: GamePlayerRole;
  }) {
    return prisma.gameSessionPlayer.upsert({
      where: {
        gameSessionId_userId: {
          gameSessionId: data.gameSessionId,
          userId: data.userId,
        },
      },
      update: {
        leftAt: null,
        isReady: false,
        role: data.role ?? 'player',
      },
      create: {
        gameSessionId: data.gameSessionId,
        userId: data.userId,
        role: data.role ?? 'player',
        isReady: false,
      },
    });
  },

  setPlayerLeft(sessionId: string, userId: string) {
    return prisma.gameSessionPlayer.update({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId },
      },
      data: {
        leftAt: new Date(),
        isReady: false,
      },
    });
  },

  setPlayerReady(sessionId: string, userId: string, isReady: boolean) {
    return prisma.gameSessionPlayer.update({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId },
      },
      data: { isReady },
    });
  },

  updateSessionStatus(
    sessionId: string,
    data: {
      status: 'active' | 'cancelled';
      startedAt?: Date;
      finishedAt?: Date;
    },
  ) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data,
    });
  },

  cancelSession(sessionId: string) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
        hostGraceExpiresAt: null,
      },
    });
  },

  setHostGraceExpiresAt(sessionId: string, expiresAt: Date) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: { hostGraceExpiresAt: expiresAt },
    });
  },

  clearHostGraceExpiresAt(sessionId: string) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: { hostGraceExpiresAt: null },
    });
  },

  restoreHostPlayer(sessionId: string, hostId: string) {
    return prisma.gameSessionPlayer.update({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId: hostId },
      },
      data: {
        leftAt: null,
        isReady: true,
        role: 'host',
      },
    });
  },

  findLobbySessionsHostedBy(hostId: string) {
    return prisma.gameSession.findMany({
      where: {
        hostId,
        status: 'lobby',
      },
      include: {
        players: {
          select: { userId: true, leftAt: true },
        },
      },
    });
  },

  findExpiredHostGraceSessions() {
    return prisma.gameSession.findMany({
      where: {
        status: 'lobby',
        hostGraceExpiresAt: { lte: new Date() },
      },
    });
  },

  findPendingHostGraceSessions() {
    return prisma.gameSession.findMany({
      where: {
        status: 'lobby',
        hostGraceExpiresAt: { gt: new Date() },
      },
    });
  },

  countActivePlayers(sessionId: string): Promise<number> {
    return prisma.gameSessionPlayer.count({
      where: { gameSessionId: sessionId, leftAt: null },
    });
  },

  listByWorld(worldId: string, statuses: GameSessionStatus[]) {
    return prisma.gameSession.findMany({
      where: {
        worldId,
        status: { in: statuses },
      },
      include: listSessionInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForList(sessionId: string) {
    return prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: listSessionInclude,
    });
  },
};
