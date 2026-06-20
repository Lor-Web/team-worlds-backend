import { AppError } from '../../shared/errors/AppError.js';
import type { QuizRuntime } from '../../openapi/schemas/quiz-game.schemas.js';
import { mergeQuizGameConfig, parseQuizGameConfig } from './quiz-game.config.js';
import { assignQuizTeams } from './quiz-teams.service.js';
import { initRuntimeState } from './quiz-runtime.utils.js';

export const quizGameService = {
  assertCanStart(activePlayerIds: string[], gameConfig: unknown): void {
    const config = parseQuizGameConfig(gameConfig);

    if (!config.quizLobby) {
      throw new AppError('Не заданы настройки лобби квиза', {
        statusCode: 409,
        code: 'GAME_QUIZ_LOBBY_MISSING',
      });
    }

    if (config.quizLobby.mode === 'teams') {
      const { teamCount } = config.quizLobby;

      if (teamCount === undefined) {
        throw new AppError('Не указано число команд', {
          statusCode: 409,
          code: 'GAME_QUIZ_LOBBY_INVALID',
        });
      }

      if (activePlayerIds.length < teamCount) {
        throw new AppError(
          `Для ${teamCount} команд нужно минимум ${teamCount} игроков`,
          {
            statusCode: 409,
            code: 'GAME_QUIZ_NOT_ENOUGH_PLAYERS_FOR_TEAMS',
          },
        );
      }
    }
  },

  initRuntimeOnStart(
    gameConfig: Record<string, unknown>,
    activePlayerIds: string[],
  ): Record<string, unknown> {
    const config = parseQuizGameConfig(gameConfig);
    const lobby = config.quizLobby!;

    const quizRuntime = initRuntimeState(
      activePlayerIds,
      lobby.mode === 'teams' && lobby.teamCount !== undefined
        ? assignQuizTeams(activePlayerIds, lobby.teamCount)
        : undefined,
    ) as QuizRuntime;

    return mergeQuizGameConfig(gameConfig, { quizRuntime });
  },
};
