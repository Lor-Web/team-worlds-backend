import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  type: z.literal('access'),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    type: 'access',
  };

  const signOptions: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, signOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Invalid or expired access token', {
      statusCode: 401,
      code: 'INVALID_ACCESS_TOKEN',
    });
  }

  const result = accessTokenPayloadSchema.safeParse(decoded);

  if (!result.success) {
    throw new AppError('Invalid access token payload', {
      statusCode: 401,
      code: 'INVALID_ACCESS_TOKEN',
    });
  }

  return result.data;
}
