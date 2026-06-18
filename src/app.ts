import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { worldsRoutes } from './modules/worlds/worlds.routes.js';
import { openApiRoutes } from './openapi/openapi.routes.js';
import { errorHandler } from './shared/errors/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
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

  app.use(errorHandler);

  return app;
}
