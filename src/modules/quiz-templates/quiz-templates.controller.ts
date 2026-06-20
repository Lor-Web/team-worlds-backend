import type { Request, Response } from 'express';

import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { getAuthenticatedUserId } from '../../shared/utils/requestUser.js';
import { quizTemplatesService } from './quiz-templates.service.js';
import type { UpsertQuizTemplateBody, ListQuizTemplatesQuery } from './quiz-templates.validators.js';

export const quizTemplatesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const query = req.query as unknown as ListQuizTemplatesQuery;
    const result = await quizTemplatesService.listTemplates(userId, worldId, query);

    res.json(result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId, templateId } = req.params as { worldId: string; templateId: string };
    const template = await quizTemplatesService.getTemplate(userId, worldId, templateId);

    res.json({ template });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId } = req.params as { worldId: string };
    const body = req.body as UpsertQuizTemplateBody;
    const template = await quizTemplatesService.createTemplate(userId, worldId, body);

    res.status(201).json({ template });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId, templateId } = req.params as { worldId: string; templateId: string };
    const body = req.body as UpsertQuizTemplateBody;
    const template = await quizTemplatesService.updateTemplate(
      userId,
      worldId,
      templateId,
      body,
    );

    res.json({ template });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { worldId, templateId } = req.params as { worldId: string; templateId: string };
    await quizTemplatesService.deleteTemplate(userId, worldId, templateId);

    res.status(204).send();
  }),
};
