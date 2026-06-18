import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createGameSessionBodySchema, listWorldGamesQuerySchema } from '../games/game-sessions.validators.js';
import { gameSessionsController } from '../games/game-sessions.controller.js';
import { worldsController } from './worlds.controller.js';
import {
  createWorldBodySchema,
  joinWorldBodySchema,
  listWorldLeaderboardQuerySchema,
  listWorldsQuerySchema,
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

worldsRoutes.get('/', validate({ query: listWorldsQuerySchema }), worldsController.listWorlds);

worldsRoutes.get(
  '/leaderboard',
  validate({ query: listWorldLeaderboardQuerySchema }),
  worldsController.listLeaderboard,
);

worldsRoutes.get(
  '/:worldId/games',
  validate({ params: worldIdParamsSchema, query: listWorldGamesQuerySchema }),
  gameSessionsController.listWorldSessions,
);

worldsRoutes.post(
  '/:worldId/games',
  validate({ params: worldIdParamsSchema, body: createGameSessionBodySchema }),
  gameSessionsController.createSession,
);

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

worldsRoutes.delete(
  '/:worldId',
  validate({ params: worldIdParamsSchema }),
  worldsController.archiveWorld,
);

worldsRoutes.post(
  '/:worldId/restore',
  validate({ params: worldIdParamsSchema }),
  worldsController.restoreWorld,
);
