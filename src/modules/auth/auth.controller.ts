import type { Request, Response } from 'express';

import { REFRESH_TOKEN_COOKIE_NAME } from '../../config/constants.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { authService } from './auth.service.js';
import type { LoginBody, RegisterBody } from './auth.validators.js';

function getRefreshTokenFromCookie(req: Request): string | undefined {
  const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  return typeof token === 'string' ? token : undefined;
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterBody;
    const result = await authService.register(res, body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginBody;
    const result = await authService.login(res, body);
    res.json(result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(res, getRefreshTokenFromCookie(req));
    res.json(result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(res, getRefreshTokenFromCookie(req));
    res.status(204).send();
  }),
};
