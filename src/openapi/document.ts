import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { env } from '../config/env.js';
import { openApiRegistry } from './registry.js';

import './paths/auth.paths.js';
import './paths/users.paths.js';
import './paths/health.paths.js';
import './paths/worlds.paths.js';
import './paths/world-invites.paths.js';
import './paths/quiz-templates.paths.js';
import './paths/game-sessions.paths.js';
import './paths/notifications.paths.js';

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Team Worlds API',
      version: '0.1.0',
      description: [
        'REST API платформы Team Worlds — совместные игры с друзьями в «Мирах».',
        '',
        '**Authentication**',
        '- Access token (JWT) — в ответе login/register, передавать в `Authorization: Bearer ...`',
        '- Refresh token — httpOnly cookie, только на `/auth/*`; на фронте: `credentials: include`',
        '',
        '**Автовход на фронте**: `POST /auth/refresh` при старте приложения → `GET /users/me`',
      ].join('\n'),
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Локальная разработка',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Регистрация, вход, refresh, выход' },
      { name: 'Users', description: 'Профиль и настройки' },
      { name: 'Worlds', description: 'Создание, вступление, список и участники' },
      { name: 'World Invites', description: 'Приглашения пользователей в мир' },
      { name: 'Quiz Templates', description: 'Контентные шаблоны квиза в мире' },
      { name: 'Games', description: 'Игровые сессии и lifecycle лобби' },
      { name: 'Notifications', description: 'In-app уведомления пользователя' },
      { name: 'System', description: 'Служебные эндпоинты' },
    ],
  });
}
