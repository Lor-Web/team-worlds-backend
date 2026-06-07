import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getHealthStatus } from './health.service.js';

export const healthController = {
  getHealth: asyncHandler(async (_req: Request, res: Response) => {
    const health = await getHealthStatus();
    const statusCode = health.status === 'ok' ? 200 : 503;

    res.status(statusCode).json(health);
  }),
};
