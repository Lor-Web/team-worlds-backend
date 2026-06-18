import type { User } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

export const authRepository = {
  createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  },

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  deleteRefreshTokenById(id: string) {
    return prisma.refreshToken.deleteMany({ where: { id } });
  },

  deleteRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.deleteMany({ where: { tokenHash } });
  },
};
