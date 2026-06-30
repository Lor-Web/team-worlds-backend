import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import { worldIdParamsSchema } from '../schemas/world.schemas.js';
import {
  listQuizTemplatesQuerySchema,
  quizTemplateIdParamsSchema,
  quizTemplateListResponseSchema,
  quizTemplateResponseSchema,
  upsertQuizTemplateBodySchema,
} from '../schemas/quiz-template.schemas.js';

const tag = 'Quiz Templates';

openApiRegistry.registerPath({
  method: 'get',
  path: '/worlds/{worldId}/quiz-templates',
  tags: [tag],
  summary: 'Шаблоны квиза мира',
  description:
    'Список контентных шаблонов с пагинацией и фильтром по названию (`q`). Доступно участникам мира.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    query: listQuizTemplatesQuerySchema,
  },
  responses: {
    200: {
      description: 'Список шаблонов',
      content: {
        'application/json': { schema: quizTemplateListResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
    403: {
      description: 'Вы не участник мира',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/{worldId}/quiz-templates',
  tags: [tag],
  summary: 'Создать шаблон квиза',
  description:
    'Полное создание шаблона с раундами, вопросами и ответами. Требуется право world.games.host.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: upsertQuizTemplateBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Шаблон создан',
      content: {
        'application/json': { schema: quizTemplateResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации',
      content: { 'application/json': { schema: validationErrorSchema } },
    },
    403: {
      description: 'Недостаточно прав',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/worlds/{worldId}/quiz-templates/{templateId}',
  tags: [tag],
  summary: 'Детали шаблона квиза',
  security: [{ bearerAuth: [] }],
  request: {
    params: quizTemplateIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Шаблон',
      content: {
        'application/json': { schema: quizTemplateResponseSchema },
      },
    },
    404: {
      description: 'Не найден',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'put',
  path: '/worlds/{worldId}/quiz-templates/{templateId}',
  tags: [tag],
  summary: 'Обновить шаблон квиза',
  description: 'Полная замена раундов и вопросов. Требуется право world.games.host.',
  security: [{ bearerAuth: [] }],
  request: {
    params: quizTemplateIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: upsertQuizTemplateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Шаблон обновлён',
      content: {
        'application/json': { schema: quizTemplateResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации',
      content: { 'application/json': { schema: validationErrorSchema } },
    },
    404: {
      description: 'Не найден',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/worlds/{worldId}/quiz-templates/{templateId}',
  tags: [tag],
  summary: 'Удалить шаблон квиза',
  security: [{ bearerAuth: [] }],
  request: {
    params: quizTemplateIdParamsSchema,
  },
  responses: {
    204: {
      description: 'Удалено',
    },
    404: {
      description: 'Не найден',
      content: { 'application/json': { schema: apiErrorSchema } },
    },
  },
});
