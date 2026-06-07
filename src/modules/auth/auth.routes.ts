import { Router } from 'express';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { authController } from './auth.controller.js';
import { loginBodySchema, registerBodySchema } from './auth.validators.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validate({ body: registerBodySchema }),
  authController.register,
);

authRoutes.post(
  '/login',
  validate({ body: loginBodySchema }),
  authController.login,
);

authRoutes.post('/refresh', authController.refresh);

authRoutes.post('/logout', authController.logout);
