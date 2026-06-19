import { AppError } from '../../shared/errors/AppError.js';
import {
  decodeUserSearchCursor,
  encodeUserSearchCursor,
  toPublicUserDto,
  toUserProfileDto,
  type PublicUserDto,
  type UserSearchListDto,
} from './users.dto.js';
import { usersRepository } from './users.repository.js';
import type { SearchUsersQuery } from './users.validators.js';

export const usersService = {
  async getProfile(userId: string): Promise<PublicUserDto> {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    return toPublicUserDto(user);
  },

  async searchUsers(userId: string, query: SearchUsersQuery): Promise<UserSearchListDto> {
    const cursor = query.cursor ? decodeUserSearchCursor(query.cursor) : undefined;
    const rows = await usersRepository.searchByUsername({
      query: query.q,
      excludeUserId: userId,
      limit: query.limit,
      cursor,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const lastUser = page.at(-1);

    return {
      users: page.map(toUserProfileDto),
      nextCursor: hasMore && lastUser ? encodeUserSearchCursor(lastUser) : null,
    };
  },
};
