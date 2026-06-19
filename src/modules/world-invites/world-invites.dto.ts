import type { SiteRole, WorldInvite, WorldInviteStatus } from '@prisma/client';

export type WorldInviteDto = {
  id: string;
  worldId: string;
  worldName: string;
  status: WorldInviteStatus;
  inviter: {
    id: string;
    username: string;
    avatar: string | null;
    siteRole: SiteRole;
    createdAt: string;
  };
  inviteeId: string;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
};

export type WorldInviteListDto = {
  invites: WorldInviteDto[];
  nextCursor: string | null;
};

type InviteWithRelations = WorldInvite & {
  world: { id: string; name: string };
  inviter: {
    id: string;
    username: string;
    avatar: string | null;
    siteRole: SiteRole;
    createdAt: Date;
  };
};

export function toWorldInviteDto(invite: InviteWithRelations): WorldInviteDto {
  return {
    id: invite.id,
    worldId: invite.worldId,
    worldName: invite.world.name,
    status: invite.status,
    inviter: {
      id: invite.inviter.id,
      username: invite.inviter.username,
      avatar: invite.inviter.avatar,
      siteRole: invite.inviter.siteRole,
      createdAt: invite.inviter.createdAt.toISOString(),
    },
    inviteeId: invite.inviteeId,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
    respondedAt: invite.respondedAt?.toISOString() ?? null,
  };
}

export function encodeWorldInviteCursor(invite: WorldInvite): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: invite.createdAt.toISOString(),
      id: invite.id,
    }),
  ).toString('base64url');
}

export function decodeWorldInviteCursor(cursor: string): { createdAt: Date; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
    createdAt: string;
    id: string;
  };

  return {
    createdAt: new Date(parsed.createdAt),
    id: parsed.id,
  };
}

export const WORLD_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
