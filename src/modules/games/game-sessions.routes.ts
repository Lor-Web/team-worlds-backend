import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { gameSessionsController } from './game-sessions.controller.js';
import {
  gameSessionIdParamsSchema,
  setReadyBodySchema,
} from './game-sessions.validators.js';

export const gameSessionsRoutes = Router();

gameSessionsRoutes.use(authenticate);

gameSessionsRoutes.get(
  '/:sessionId',
  validate({ params: gameSessionIdParamsSchema }),
  gameSessionsController.getSession,
);

gameSessionsRoutes.post(
  '/:sessionId/join',
  validate({ params: gameSessionIdParamsSchema }),
  gameSessionsController.joinSession,
);

gameSessionsRoutes.post(
  '/:sessionId/leave',
  validate({ params: gameSessionIdParamsSchema }),
  gameSessionsController.leaveSession,
);

gameSessionsRoutes.post(
  '/:sessionId/ready',
  validate({ params: gameSessionIdParamsSchema, body: setReadyBodySchema }),
  gameSessionsController.setReady,
);

gameSessionsRoutes.post(
  '/:sessionId/start',
  validate({ params: gameSessionIdParamsSchema }),
  gameSessionsController.startSession,
);
