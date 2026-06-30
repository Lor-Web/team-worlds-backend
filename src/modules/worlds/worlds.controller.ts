import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { worldsService } from './worlds.service.js';
import type {
  CreateWorldBody,
  JoinWorldBody,
  ListWorldLeaderboardQuery,
  ListWorldsQuery,
  UpdateWorldBody,
} from './worlds.validators.js';

export const worldsController = {
  createWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const body = req.body as CreateWorldBody;
    const world = await worldsService.createWorld(userId, body);

    res.status(201).json({ world });
  }),

  joinWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const body = req.body as JoinWorldBody;
    const world = await worldsService.joinWorld(userId, body);

    res.json({ world });
  }),

  listWorlds: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const query = req.query as unknown as ListWorldsQuery;
    const worlds = await worldsService.listMyWorlds(userId, query);

    res.json({ worlds });
  }),

  getWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const world = await worldsService.getWorldDetails(userId, worldId);

    res.json({ world });
  }),

  listLeaderboard: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListWorldLeaderboardQuery;
    const leaderboard = await worldsService.listLeaderboard(query);

    res.json(leaderboard);
  }),

  updateWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const body = req.body as UpdateWorldBody;
    const world = await worldsService.updateWorld(userId, worldId, body);

    res.json({ world });
  }),

  archiveWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const world = await worldsService.archiveWorld(userId, worldId);

    res.json({ world });
  }),

  restoreWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const world = await worldsService.restoreWorld(userId, worldId);

    res.json({ world });
  }),

  leaveWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    await worldsService.leaveWorld(userId, worldId);

    res.status(204).send();
  }),

  kickMember: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId, userId: targetUserId } = req.params as {
      worldId: string;
      userId: string;
    };
    const world = await worldsService.kickMember(userId, worldId, targetUserId);

    res.json({ world });
  }),
};
