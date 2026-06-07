import type { SiteRole } from '@prisma/client';

export type PublicUserDto = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  siteRole: SiteRole;
  createdAt: string;
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
