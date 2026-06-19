import type { SiteRole } from '@prisma/client';

export type PublicUserDto = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  siteRole: SiteRole;
  createdAt: string;
};

/** Публичный профиль без email — для поиска и карточек в UI. */
export type UserProfileDto = {
  id: string;
  username: string;
  avatar: string | null;
  siteRole: SiteRole;
  createdAt: string;
};

export type UserSearchListDto = {
  users: UserProfileDto[];
  nextCursor: string | null;
};

export function toPublicUserDto(user: {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  siteRole: SiteRole;
  createdAt: Date;
}): PublicUserDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    siteRole: user.siteRole,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserProfileDto(user: {
  id: string;
  username: string;
  avatar: string | null;
  siteRole: SiteRole;
  createdAt: Date;
}): UserProfileDto {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    siteRole: user.siteRole,
    createdAt: user.createdAt.toISOString(),
  };
}

export function encodeUserSearchCursor(user: { username: string; id: string }): string {
  return Buffer.from(JSON.stringify({ username: user.username, id: user.id })).toString('base64url');
}

export function decodeUserSearchCursor(cursor: string): { username: string; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
    username: string;
    id: string;
  };

  return {
    username: parsed.username,
    id: parsed.id,
  };
}
