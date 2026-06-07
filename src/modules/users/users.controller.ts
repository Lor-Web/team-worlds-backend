import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { usersService } from './users.service.js';

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const user = await usersService.getProfile(userId);
    res.json({ user });
  }),
};
