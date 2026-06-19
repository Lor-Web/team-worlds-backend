import type { WorldInviteStatus } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

const inviteWithRelationsInclude = {
  world: { select: { id: true, name: true } },
  inviter: { select: { id: true, username: true, avatar: true, siteRole: true, createdAt: true } },
} as const;

export const worldInvitesRepository = {
  findByIdWithRelations(inviteId: string) {
    return prisma.worldInvite.findUnique({
      where: { id: inviteId },
      include: inviteWithRelationsInclude,
    });
  },

  upsertPending(data: {
    worldId: string;
    inviterId: string;
    inviteeId: string;
    expiresAt: Date;
  }) {
    return prisma.worldInvite.upsert({
      where: {
        worldId_inviteeId: {
          worldId: data.worldId,
          inviteeId: data.inviteeId,
        },
      },
      create: {
        worldId: data.worldId,
        inviterId: data.inviterId,
        inviteeId: data.inviteeId,
        expiresAt: data.expiresAt,
        status: 'pending',
      },
      update: {
        inviterId: data.inviterId,
        expiresAt: data.expiresAt,
        status: 'pending',
        respondedAt: null,
      },
      include: inviteWithRelationsInclude,
    });
  },

  listIncoming(input: {
    inviteeId: string;
    status: WorldInviteStatus;
    limit: number;
    cursor?: { createdAt: Date; id: string };
  }) {
    const now = new Date();

    return prisma.worldInvite.findMany({
      where: {
        inviteeId: input.inviteeId,
        status: input.status,
        ...(input.status === 'pending' ? { expiresAt: { gt: now } } : {}),
        ...(input.cursor
          ? {
              OR: [
                { createdAt: { lt: input.cursor.createdAt } },
                {
                  createdAt: input.cursor.createdAt,
                  id: { lt: input.cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      include: inviteWithRelationsInclude,
    });
  },

  markResponded(inviteId: string, status: Exclude<WorldInviteStatus, 'pending' | 'expired'>) {
    return prisma.worldInvite.update({
      where: { id: inviteId },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: inviteWithRelationsInclude,
    });
  },

  markExpired(inviteId: string) {
    return prisma.worldInvite.update({
      where: { id: inviteId },
      data: {
        status: 'expired',
        respondedAt: new Date(),
      },
      include: inviteWithRelationsInclude,
    });
  },
};
