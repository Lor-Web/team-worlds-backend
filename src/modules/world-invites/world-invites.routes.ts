import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { worldIdParamsSchema } from '../worlds/worlds.validators.js';
import { worldInvitesController } from './world-invites.controller.js';
import {
  createWorldInviteBodySchema,
  listWorldInvitesQuerySchema,
  worldInviteIdParamsSchema,
} from './world-invites.validators.js';

export const worldInvitesRoutes = Router();

worldInvitesRoutes.use(authenticate);

worldInvitesRoutes.get(
  '/incoming',
  validate({ query: listWorldInvitesQuerySchema }),
  worldInvitesController.listIncoming,
);

worldInvitesRoutes.post(
  '/:inviteId/accept',
  validate({ params: worldInviteIdParamsSchema }),
  worldInvitesController.accept,
);

worldInvitesRoutes.post(
  '/:inviteId/decline',
  validate({ params: worldInviteIdParamsSchema }),
  worldInvitesController.decline,
);

export const worldInviteCreationRoutes = Router({ mergeParams: true });

worldInviteCreationRoutes.post(
  '/',
  validate({ params: worldIdParamsSchema, body: createWorldInviteBodySchema }),
  worldInvitesController.createInvite,
);
