import type { User } from '@prisma/client';

import { prisma } from '../../shared/db/prisma.js';

type UserSearchRow = Pick<User, 'id' | 'username' | 'avatar' | 'siteRole' | 'createdAt'>;

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export const usersRepository = {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  },

  searchByUsername(input: {
    query: string;
    excludeUserId: string;
    limit: number;
    cursor?: { username: string; id: string };
  }): Promise<UserSearchRow[]> {
    const likePattern = `%${escapeLikePattern(input.query)}%`;

    if (input.cursor) {
      return prisma.$queryRaw<UserSearchRow[]>`
        SELECT id, username, avatar, siteRole, createdAt
        FROM User
        WHERE id != ${input.excludeUserId}
          AND lower(username) LIKE lower(${likePattern}) ESCAPE '\\'
          AND (
            username > ${input.cursor.username}
            OR (username = ${input.cursor.username} AND id > ${input.cursor.id})
          )
        ORDER BY username ASC, id ASC
        LIMIT ${input.limit + 1}
      `;
    }

    return prisma.$queryRaw<UserSearchRow[]>`
      SELECT id, username, avatar, siteRole, createdAt
      FROM User
      WHERE id != ${input.excludeUserId}
        AND lower(username) LIKE lower(${likePattern}) ESCAPE '\\'
      ORDER BY username ASC, id ASC
      LIMIT ${input.limit + 1}
    `;
  },
};
