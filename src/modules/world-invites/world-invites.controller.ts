import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { worldInvitesService } from './world-invites.service.js';
import type { CreateWorldInviteBody, ListWorldInvitesQuery } from './world-invites.validators.js';

export const worldInvitesController = {
  createInvite: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const body = req.body as CreateWorldInviteBody;
    const invite = await worldInvitesService.createInvite(userId, worldId, body);

    res.status(201).json({ invite });
  }),

  listIncoming: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const query = req.query as unknown as ListWorldInvitesQuery;
    const result = await worldInvitesService.listIncoming(userId, query);

    res.json(result);
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { inviteId } = req.params as { inviteId: string };
    const result = await worldInvitesService.acceptInvite(userId, inviteId);

    res.json(result);
  }),

  decline: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { inviteId } = req.params as { inviteId: string };
    const invite = await worldInvitesService.declineInvite(userId, inviteId);

    res.json({ invite });
  }),
};
