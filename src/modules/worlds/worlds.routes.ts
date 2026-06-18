import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { worldsController } from './worlds.controller.js';
import {
  createWorldBodySchema,
  joinWorldBodySchema,
  updateWorldBodySchema,
  worldIdParamsSchema,
} from './worlds.validators.js';

export const worldsRoutes = Router();

worldsRoutes.use(authenticate);

worldsRoutes.post(
  '/',
  validate({ body: createWorldBodySchema }),
  worldsController.createWorld,
);

worldsRoutes.post(
  '/join',
  validate({ body: joinWorldBodySchema }),
  worldsController.joinWorld,
);

worldsRoutes.get('/', worldsController.listWorlds);

worldsRoutes.get(
  '/:worldId',
  validate({ params: worldIdParamsSchema }),
  worldsController.getWorld,
);

worldsRoutes.patch(
  '/:worldId',
  validate({ params: worldIdParamsSchema, body: updateWorldBodySchema }),
  worldsController.updateWorld,
);
