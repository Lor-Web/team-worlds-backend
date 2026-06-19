import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { usersService } from './users.service.js';
import type { SearchUsersQuery } from './users.validators.js';

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const user = await usersService.getProfile(userId);
    res.json({ user });
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const query = req.query as unknown as SearchUsersQuery;
    const result = await usersService.searchUsers(userId, query);
    res.json(result);
  }),
};
