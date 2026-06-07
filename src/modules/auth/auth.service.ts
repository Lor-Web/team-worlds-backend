/**
 * Auth module: registration, login, refresh rotation, logout.
 * Access JWT is returned in JSON; refresh token is an opaque cookie stored hashed in DB.
 */
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { expiresAtFromNow } from '../../shared/utils/duration.js';
import { signAccessToken } from '../../shared/utils/jwt.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../../shared/utils/refreshCookie.js';
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../shared/utils/tokenHash.js';
import { toPublicUserDto } from '../users/users.dto.js';
import { usersRepository } from '../users/users.repository.js';
import type { AuthTokensResponseDto } from './auth.dto.js';
import { authRepository } from './auth.repository.js';
import type { LoginBody, RegisterBody } from './auth.validators.js';

async function issueAuthSession(
  res: Response,
  userId: string,
): Promise<AuthTokensResponseDto> {
  const user = await usersRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', {
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  }

  const refreshToken = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(refreshToken);
  const expiresAt = expiresAtFromNow(env.JWT_REFRESH_EXPIRES_IN);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  setRefreshTokenCookie(res, refreshToken, expiresAt);

  return {
    accessToken: signAccessToken(user.id),
    user: toPublicUserDto(user),
  };
}

function mapPrismaUniqueError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (error.code !== 'P2002') {
    return null;
  }

  const target = error.meta?.target;

  if (Array.isArray(target) && target.includes('email')) {
    return new AppError('Email is already registered', {
      statusCode: 409,
      code: 'EMAIL_ALREADY_EXISTS',
    });
  }

  if (Array.isArray(target) && target.includes('username')) {
    return new AppError('Username is already taken', {
      statusCode: 409,
      code: 'USERNAME_ALREADY_EXISTS',
    });
  }

  return new AppError('User already exists', {
    statusCode: 409,
    code: 'USER_ALREADY_EXISTS',
  });
}

export const authService = {
  async register(
    res: Response,
    input: RegisterBody,
  ): Promise<AuthTokensResponseDto> {
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await authRepository.createUser({
        username: input.username,
        email: input.email,
        passwordHash,
      });

      return issueAuthSession(res, user.id);
    } catch (error) {
      const mapped = mapPrismaUniqueError(error);
      if (mapped) {
        throw mapped;
      }
      throw error;
    }
  },

  async login(res: Response, input: LoginBody): Promise<AuthTokensResponseDto> {
    const user = await usersRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    return issueAuthSession(res, user.id);
  },

  async refresh(
    res: Response,
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', {
        statusCode: 401,
        code: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    const tokenHash = hashOpaqueToken(refreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AppError('Invalid refresh token', {
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      await authRepository.deleteRefreshTokenById(storedToken.id);
      clearRefreshTokenCookie(res);
      throw new AppError('Refresh token has expired', {
        statusCode: 401,
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    await authRepository.deleteRefreshTokenById(storedToken.id);

    const newRefreshToken = generateOpaqueToken();
    const newTokenHash = hashOpaqueToken(newRefreshToken);
    const expiresAt = expiresAtFromNow(env.JWT_REFRESH_EXPIRES_IN);

    await authRepository.createRefreshToken({
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      expiresAt,
    });

    setRefreshTokenCookie(res, newRefreshToken, expiresAt);

    return {
      accessToken: signAccessToken(storedToken.userId),
    };
  },

  async logout(
    res: Response,
    refreshToken: string | undefined,
  ): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashOpaqueToken(refreshToken);
      await authRepository.deleteRefreshTokenByHash(tokenHash);
    }

    clearRefreshTokenCookie(res);
  },
};
