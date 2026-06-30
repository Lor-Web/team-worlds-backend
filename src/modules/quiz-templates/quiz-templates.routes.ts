import { Router } from 'express';

import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { worldIdParamsSchema } from '../worlds/worlds.validators.js';
import { quizTemplatesController } from './quiz-templates.controller.js';
import {
  listQuizTemplatesQuerySchema,
  quizTemplateIdParamsSchema,
  upsertQuizTemplateBodySchema,
} from './quiz-templates.validators.js';

export const quizTemplateRoutes = Router({ mergeParams: true });

quizTemplateRoutes.use(authenticate);

quizTemplateRoutes.get(
  '/',
  validate({ params: worldIdParamsSchema, query: listQuizTemplatesQuerySchema }),
  quizTemplatesController.list,
);

quizTemplateRoutes.post(
  '/',
  validate({ params: worldIdParamsSchema, body: upsertQuizTemplateBodySchema }),
  quizTemplatesController.create,
);

quizTemplateRoutes.get(
  '/:templateId',
  validate({ params: quizTemplateIdParamsSchema }),
  quizTemplatesController.get,
);

quizTemplateRoutes.put(
  '/:templateId',
  validate({ params: quizTemplateIdParamsSchema, body: upsertQuizTemplateBodySchema }),
  quizTemplatesController.update,
);

quizTemplateRoutes.delete(
  '/:templateId',
  validate({ params: quizTemplateIdParamsSchema }),
  quizTemplatesController.delete,
);
