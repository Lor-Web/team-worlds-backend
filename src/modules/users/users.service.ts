import { AppError } from '../../shared/errors/AppError.js';
import { toPublicUserDto, type PublicUserDto } from './users.dto.js';
import { usersRepository } from './users.repository.js';

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
};
