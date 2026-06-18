import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { gameSessionsService } from './game-sessions.service.js';
import type { CreateGameSessionBody, ListWorldGamesQuery, SetReadyBody } from './game-sessions.validators.js';

export const gameSessionsController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const body = req.body as CreateGameSessionBody;
    const session = await gameSessionsService.createSession(userId, worldId, body);

    res.status(201).json({ session });
  }),

  listWorldSessions: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const query = req.query as ListWorldGamesQuery;
    const sessions = await gameSessionsService.listWorldSessions(userId, worldId, query);

    res.json({ sessions });
  }),

  getSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const session = await gameSessionsService.getSession(userId, sessionId);

    res.json({ session });
  }),

  joinSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const session = await gameSessionsService.joinSession(userId, sessionId);

    res.json({ session });
  }),

  leaveSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const session = await gameSessionsService.leaveSession(userId, sessionId);

    res.json({ session });
  }),

  setReady: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const body = req.body as SetReadyBody;
    const session = await gameSessionsService.setReady(userId, sessionId, body);

    res.json({ session });
  }),

  startSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params as { sessionId: string };
    const session = await gameSessionsService.startSession(userId, sessionId);

    res.json({ session });
  }),
};
