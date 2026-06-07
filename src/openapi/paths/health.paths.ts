import { openApiRegistry } from '../registry.js';
import { healthStatusSchema } from '../schemas/health.schemas.js';

openApiRegistry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Проверка состояния',
  description: 'Health check API и подключения к базе данных.',
  responses: {
    200: {
      description: 'Сервис работает',
      content: {
        'application/json': { schema: healthStatusSchema },
      },
    },
    503: {
      description: 'Сервис недоступен (проблема с БД)',
      content: {
        'application/json': { schema: healthStatusSchema },
      },
    },
  },
});
