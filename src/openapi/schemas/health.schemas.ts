import { z } from 'zod';

import '../setup.js';

export const healthStatusSchema = z
  .object({
    status: z.enum(['ok', 'degraded']).openapi({ description: 'Состояние сервиса' }),
    timestamp: z.string().datetime().openapi({ description: 'Время проверки (ISO 8601)' }),
    database: z
      .enum(['connected', 'disconnected'])
      .openapi({ description: 'Подключение к базе данных' }),
  })
  .openapi('HealthStatus');
