import type { Request } from 'express';

import { AppError } from '../errors/AppError.js';

export function getAuthenticatedUserId(req: Request): string {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Unauthorized', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return userId;
}
