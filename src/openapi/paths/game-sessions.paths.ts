import { openApiRegistry } from '../registry.js';
import { apiErrorSchema, validationErrorSchema } from '../schemas/common.schemas.js';
import {
  createGameSessionBodySchema,
  gameSessionIdParamsSchema,
  gameSessionListResponseSchema,
  gameSessionResponseSchema,
  listWorldGamesQuerySchema,
  setReadyBodySchema,
} from '../schemas/game-session.schemas.js';
import { quizRecapResponseSchema } from '../schemas/quiz-game.schemas.js';
import { worldIdParamsSchema } from '../schemas/world.schemas.js';

const tag = 'Games';

openApiRegistry.registerPath({
  method: 'post',
  path: '/worlds/{worldId}/games',
  tags: [tag],
  summary: 'Создать игровую сессию',
  description:
    'Создаёт сессию в статусе lobby. Требуется право world.games.host. Для quiz укажите quizTemplateId и quizLobby — контент копируется в gameConfig.quizSnapshot.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: createGameSessionBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Сессия создана',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    400: {
      description: 'Ошибка валидации или настроек',
      content: {
        'application/json': { schema: validationErrorSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Нет права вести игры в мире',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Мир или шаблон не найден',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/worlds/{worldId}/games',
  tags: [tag],
  summary: 'Игры в мире',
  description:
    'Список открытых игр в мире (по умолчанию lobby + active). Для входа в лобби используйте canJoin и POST /games/{sessionId}/join.',
  security: [{ bearerAuth: [] }],
  request: {
    params: worldIdParamsSchema,
    query: listWorldGamesQuerySchema,
  },
  responses: {
    200: {
      description: 'Список игровых сессий',
      content: {
        'application/json': { schema: gameSessionListResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Вы не участник мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/games/{sessionId}',
  tags: [tag],
  summary: 'Получить сессию',
  description: 'Детали сессии и список активных игроков. Доступно участникам мира.',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Данные сессии',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Вы не участник мира',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    404: {
      description: 'Сессия не найдена',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/games/{sessionId}/join',
  tags: [tag],
  summary: 'Вступить в сессию',
  description: 'Присоединиться к лобби. Идемпотентно для уже активных участников.',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Вы в сессии',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    403: {
      description: 'Сессия заполнена или нет доступа к миру',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Сессия не в лобби',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/games/{sessionId}/leave',
  tags: [tag],
  summary: 'Покинуть сессию',
  description:
    'Выход из лобби. Если выходит ведущий — сессия отменяется (cancelled).',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Вы вышли из сессии',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    403: {
      description: 'Вы не участник сессии',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Сессия не в лобби',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/games/{sessionId}/ready',
  tags: [tag],
  summary: 'Готовность игрока',
  description: 'Установить isReady. Ведущий всегда готов и не может снять готовность.',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
    body: {
      content: {
        'application/json': { schema: setReadyBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Готовность обновлена',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    409: {
      description: 'Сессия не в лобби или ведущий снимает готовность',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/games/{sessionId}/start',
  tags: [tag],
  summary: 'Старт игры',
  description:
    'Переводит сессию lobby → active. Только ведущий. Проверяет minPlayers и requireAllReady.',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Игра началась',
      content: {
        'application/json': { schema: gameSessionResponseSchema },
      },
    },
    403: {
      description: 'Только ведущий',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Не все готовы / мало игроков / не в лобби',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/games/{sessionId}/quiz/recap',
  tags: [tag],
  summary: 'Персональная сводка квиза',
  description:
    'Доступно участнику после завершения игры (status=finished). Вопросы, ваши ответы, правильные ответы, очки и изменение рейтинга в мире.',
  security: [{ bearerAuth: [] }],
  request: {
    params: gameSessionIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Сводка',
      content: {
        'application/json': { schema: quizRecapResponseSchema },
      },
    },
    401: {
      description: 'Не авторизован',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    403: {
      description: 'Не участник сессии',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
    409: {
      description: 'Игра ещё не завершена',
      content: {
        'application/json': { schema: apiErrorSchema },
      },
    },
  },
});
