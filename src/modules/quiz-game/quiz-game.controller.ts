import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { quizGameApiService } from './quiz-game.api.service.js';

export const quizGameController = {
  getRecap: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const recap = await quizGameApiService.getRecap(userId, sessionId);

    res.json({ recap });
  }),
};
