import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { usersController } from './users.controller.js';
import { searchUsersQuerySchema } from './users.validators.js';

export const usersRoutes = Router();

usersRoutes.get('/me', authenticate, usersController.getMe);

usersRoutes.get(
  '/search',
  authenticate,
  validate({ query: searchUsersQuerySchema }),
  usersController.search,
);
