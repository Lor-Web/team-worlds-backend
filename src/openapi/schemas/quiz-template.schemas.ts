import { z } from 'zod';

import { QUIZ_TEMPLATE_LIMITS } from '../../config/quiz-template.js';
import '../setup.js';

const { maxAnswersPerQuestion, minAnswersPerQuestion } = QUIZ_TEMPLATE_LIMITS;

function hasQuestionContent(data: {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
}): boolean {
  return Boolean(
    data.text?.trim() || data.imageUrl?.trim() || data.videoUrl?.trim(),
  );
}

function countCorrectAnswers(answers: Array<{ isCorrect: boolean }>): number {
  return answers.filter((answer) => answer.isCorrect).length;
}

export const quizAnswerInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, 'Текст ответа обязателен')
      .max(QUIZ_TEMPLATE_LIMITS.maxAnswerTextLength),
    isCorrect: z.boolean(),
  })
  .openapi('QuizAnswerInput');

export const quizQuestionInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .max(QUIZ_TEMPLATE_LIMITS.maxQuestionTextLength)
      .optional()
      .openapi({ description: 'Текст вопроса' }),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .openapi({
        description:
          'URL или ключ изображения. TODO: загрузка через S3.',
      }),
    videoUrl: z
      .string()
      .trim()
      .url('Некорректный URL видео')
      .max(2048)
      .optional()
      .openapi({ description: 'Ссылка на видео (YouTube, CDN и т.д.)' }),
    answers: z
      .array(quizAnswerInputSchema)
      .min(minAnswersPerQuestion)
      .max(maxAnswersPerQuestion),
  })
  .refine(hasQuestionContent, {
    message: 'Укажите текст, картинку или видео для вопроса',
  })
  .refine((question) => countCorrectAnswers(question.answers) === 1, {
    message: 'Ровно один вариант ответа должен быть правильным',
  })
  .openapi('QuizQuestionInput');

export const quizRoundInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(QUIZ_TEMPLATE_LIMITS.maxRoundNameLength)
      .optional()
      .openapi({
        description: 'Название раунда. По умолчанию — «Раунд N»',
        example: 'Музыкальный',
      }),
    description: z
      .string()
      .trim()
      .max(QUIZ_TEMPLATE_LIMITS.maxRoundDescriptionLength)
      .optional()
      .default('')
      .openapi({
        description: 'Показывается игрокам во время таймера до старта раунда',
      }),
    isDoublePoints: z
      .boolean()
      .optional()
      .default(false)
      .openapi({
        description:
          'Раунд с удвоением: игрок может рискнуть удвоить очки; ошибка — штраф',
      }),
    preRoundDelaySec: z
      .number()
      .int()
      .min(0)
      .max(QUIZ_TEMPLATE_LIMITS.maxPreRoundDelaySec)
      .openapi({ description: 'Пауза до начала раунда (сек)' }),
    questionTimeSec: z
      .number()
      .int()
      .min(QUIZ_TEMPLATE_LIMITS.minQuestionTimeSec)
      .max(QUIZ_TEMPLATE_LIMITS.maxQuestionTimeSec)
      .openapi({ description: 'Время на каждый вопрос в раунде (сек)' }),
    questions: z
      .array(quizQuestionInputSchema)
      .min(1)
      .max(QUIZ_TEMPLATE_LIMITS.maxQuestionsPerRound),
  })
  .openapi('QuizRoundInput');

export const upsertQuizTemplateBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Название: минимум 2 символа')
      .max(QUIZ_TEMPLATE_LIMITS.maxNameLength),
    rounds: z
      .array(quizRoundInputSchema)
      .min(1, 'Добавьте хотя бы один раунд')
      .max(QUIZ_TEMPLATE_LIMITS.maxRounds),
  })
  .openapi('UpsertQuizTemplateBody');

export const quizAnswerSchema = quizAnswerInputSchema
  .extend({
    id: z.string(),
    order: z.number().int(),
  })
  .openapi('QuizAnswer');

export const quizQuestionSchema = z
  .object({
    id: z.string(),
    order: z.number().int(),
    text: z.string().nullable(),
    imageUrl: z.string().nullable(),
    videoUrl: z.string().nullable(),
    answers: z.array(quizAnswerSchema),
  })
  .openapi('QuizQuestion');

export const quizRoundSchema = z
  .object({
    id: z.string(),
    order: z.number().int(),
    name: z.string().openapi({ description: 'Отображаемое название (кастом или «Раунд N»)' }),
    description: z.string().openapi({ description: 'Текст до старта раунда' }),
    isDoublePoints: z.boolean().openapi({ description: 'Раунд с риском удвоения очков' }),
    preRoundDelaySec: z.number().int(),
    questionTimeSec: z.number().int(),
    questions: z.array(quizQuestionSchema),
  })
  .openapi('QuizRound');

export const quizTemplateSchema = z
  .object({
    id: z.string(),
    worldId: z.string(),
    name: z.string(),
    createdById: z.string(),
    roundCount: z.number().int(),
    questionCount: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('QuizTemplateSummary');

export const quizTemplateDetailSchema = quizTemplateSchema
  .omit({ roundCount: true, questionCount: true })
  .extend({
    rounds: z.array(quizRoundSchema),
  })
  .openapi('QuizTemplateDetail');

export const quizTemplateListResponseSchema = z
  .object({
    templates: z.array(quizTemplateSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('QuizTemplateListResponse');

export const listQuizTemplatesQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(1)
      .max(QUIZ_TEMPLATE_LIMITS.maxNameLength)
      .optional()
      .openapi({ description: 'Фильтр по названию шаблона (подстрока)' }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .openapi({ description: 'Размер страницы' }),
    cursor: z
      .string()
      .optional()
      .openapi({ description: 'Курсор пагинации из nextCursor' }),
  })
  .openapi('ListQuizTemplatesQuery');

export const quizTemplateResponseSchema = z
  .object({
    template: quizTemplateDetailSchema,
  })
  .openapi('QuizTemplateResponse');

export const quizTemplateIdParamsSchema = z
  .object({
    worldId: z.string().cuid('Некорректный ID мира'),
    templateId: z.string().cuid('Некорректный ID шаблона'),
  })
  .openapi('QuizTemplateIdParams');

export const quizGameSnapshotSchema = z
  .object({
    quizTemplateId: z.string(),
    name: z.string(),
    rounds: z.array(quizRoundSchema),
  })
  .openapi('QuizGameSnapshot');

export type UpsertQuizTemplateBody = z.infer<typeof upsertQuizTemplateBodySchema>;
export type ListQuizTemplatesQuery = z.infer<typeof listQuizTemplatesQuerySchema>;
export type QuizGameSnapshot = z.infer<typeof quizGameSnapshotSchema>;
