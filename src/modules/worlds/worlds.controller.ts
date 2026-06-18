import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { worldsService } from './worlds.service.js';
import type { CreateWorldBody, JoinWorldBody, UpdateWorldBody } from './worlds.validators.js';

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
    const worlds = await worldsService.listMyWorlds(userId);

    res.json({ worlds });
  }),

  getWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const world = await worldsService.getWorldDetails(userId, worldId);

    res.json({ world });
  }),

  updateWorld: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const body = req.body as UpdateWorldBody;
    const world = await worldsService.updateWorld(userId, worldId, body);

    res.json({ world });
  }),
};
