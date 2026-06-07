import type { PublicUserDto } from '../users/users.dto.js';

export type AuthTokensResponseDto = {
  accessToken: string;
  user: PublicUserDto;
};
