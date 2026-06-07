import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(
      new AppError('Authorization header required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      }),
    );
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    next(
      new AppError('Authorization header required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      }),
    );
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(
      new AppError('Unauthorized', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      }),
    );
    return;
  }
  next();
}
