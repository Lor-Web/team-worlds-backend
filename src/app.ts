import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { corsOrigins } from './config/corsOrigins.js';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { worldsRoutes } from './modules/worlds/worlds.routes.js';
import { gameSessionsRoutes } from './modules/games/game-sessions.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { worldInvitesRoutes } from './modules/world-invites/world-invites.routes.js';
import { openApiRoutes } from './openapi/openapi.routes.js';
import { errorHandler } from './shared/errors/errorHandler.js';

export function createApp() {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use(openApiRoutes);
  app.use(healthRoutes);
  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/worlds', worldsRoutes);
  app.use('/world-invites', worldInvitesRoutes);
  app.use('/games', gameSessionsRoutes);
  app.use('/notifications', notificationsRoutes);

  app.use(errorHandler);

  return app;
}
