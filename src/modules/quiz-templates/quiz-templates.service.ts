import { AppError } from '../../shared/errors/AppError.js';
import { WorldPermission } from '../../shared/permissions/world.permissions.js';
import { worldAccessService } from '../worlds/world-access.service.js';
import {
  decodeQuizTemplateCursor,
  encodeQuizTemplateCursor,
} from './quiz-templates.cursor.js';
import {
  toQuizGameSnapshot,
  toQuizTemplateDetailDto,
} from './quiz-templates.mapper.js';
import type {
  QuizTemplateDetailDto,
  QuizTemplateListDto,
} from './quiz-templates.dto.js';
import { quizTemplatesRepository } from './quiz-templates.repository.js';
import type {
  ListQuizTemplatesQuery,
  UpsertQuizTemplateBody,
} from './quiz-templates.validators.js';
import type { QuizGameSnapshot } from '../../openapi/schemas/quiz-template.schemas.js';

async function requireHostPermission(userId: string, worldId: string): Promise<void> {
  await worldAccessService.requireActiveMembership(userId, worldId);
  await worldAccessService.requirePermission(userId, worldId, WorldPermission.HOST_GAME);
}

async function requireTemplateInWorld(
  worldId: string,
  templateId: string,
): Promise<NonNullable<Awaited<ReturnType<typeof quizTemplatesRepository.findByIdInWorld>>>> {
  const template = await quizTemplatesRepository.findByIdInWorld(templateId, worldId);

  if (!template) {
    throw new AppError('Шаблон квиза не найден', {
      statusCode: 404,
      code: 'QUIZ_TEMPLATE_NOT_FOUND',
    });
  }

  return template;
}

export const quizTemplatesService = {
  async listTemplates(
    userId: string,
    worldId: string,
    query: ListQuizTemplatesQuery,
  ): Promise<QuizTemplateListDto> {
    await worldAccessService.requireActiveMembership(userId, worldId);

    const cursor = query.cursor
      ? (() => {
          try {
            return decodeQuizTemplateCursor(query.cursor);
          } catch {
            throw new AppError('Некорректный cursor', {
              statusCode: 400,
              code: 'INVALID_CURSOR',
            });
          }
        })()
      : undefined;
    const rows = await quizTemplatesRepository.listByWorldPaginated({
      worldId,
      q: query.q,
      limit: query.limit,
      cursor,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page.at(-1);

    return {
      templates: page.map((row) => ({
        id: row.id,
        worldId: row.worldId,
        name: row.name,
        createdById: row.createdById,
        roundCount: row.rounds.length,
        questionCount: row.rounds.reduce(
          (sum, round) => sum + round._count.questions,
          0,
        ),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextCursor:
        hasMore && last
          ? encodeQuizTemplateCursor({ updatedAt: last.updatedAt, id: last.id })
          : null,
    };
  },

  async getTemplate(
    userId: string,
    worldId: string,
    templateId: string,
  ): Promise<QuizTemplateDetailDto> {
    await worldAccessService.requireActiveMembership(userId, worldId);
    const template = await requireTemplateInWorld(worldId, templateId);
    return toQuizTemplateDetailDto(template);
  },

  async createTemplate(
    userId: string,
    worldId: string,
    input: UpsertQuizTemplateBody,
  ): Promise<QuizTemplateDetailDto> {
    await requireHostPermission(userId, worldId);

    const template = await quizTemplatesRepository.create(worldId, userId, input);
    return toQuizTemplateDetailDto(template);
  },

  async updateTemplate(
    userId: string,
    worldId: string,
    templateId: string,
    input: UpsertQuizTemplateBody,
  ): Promise<QuizTemplateDetailDto> {
    await requireHostPermission(userId, worldId);
    await requireTemplateInWorld(worldId, templateId);

    const template = await quizTemplatesRepository.replace(templateId, input);
    return toQuizTemplateDetailDto(template);
  },

  async deleteTemplate(userId: string, worldId: string, templateId: string): Promise<void> {
    await requireHostPermission(userId, worldId);
    await requireTemplateInWorld(worldId, templateId);
    await quizTemplatesRepository.delete(templateId);
  },

  async buildSnapshotForSession(
    worldId: string,
    quizTemplateId: string,
  ): Promise<QuizGameSnapshot> {
    const template = await requireTemplateInWorld(worldId, quizTemplateId);

    if (template.rounds.length === 0) {
      throw new AppError('Шаблон квиза пуст', {
        statusCode: 409,
        code: 'QUIZ_TEMPLATE_EMPTY',
      });
    }

    return toQuizGameSnapshot(template);
  },
};
