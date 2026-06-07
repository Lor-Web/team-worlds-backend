import { z } from 'zod';

import '../setup.js';

export const apiErrorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ description: 'Код ошибки', example: 'INVALID_CREDENTIALS' }),
      message: z.string().openapi({ description: 'Текст ошибки' }),
    }),
  })
  .openapi('ApiError');

export const validationErrorSchema = z
  .object({
    error: z.object({
      code: z.literal('VALIDATION_ERROR').openapi({ description: 'Код ошибки валидации' }),
      message: z.string().openapi({ description: 'Сообщение', example: 'Validation failed' }),
      details: z
        .record(z.array(z.string()))
        .optional()
        .openapi({ description: 'Ошибки по полям' }),
    }),
  })
  .openapi('ValidationError');
