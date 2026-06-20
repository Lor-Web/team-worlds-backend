import { gameAccessService } from '../games/game-access.service.js';
import { parseQuizGameConfig } from './quiz-game.config.js';
import type { QuizRecapItem } from './quiz-recap.service.js';
import type { QuizRuntimeState } from './quiz-game.types.js';

export type QuizRecapDto = {
  sessionId: string;
  finalScore: number;
  ratingChange: number;
  outcome: 'win' | 'loss' | 'draw' | null;
  items: QuizRecapItem[];
};

export const quizGameApiService = {
  async getRecap(userId: string, sessionId: string): Promise<QuizRecapDto> {
    const session = await gameAccessService.requireFinishedQuizParticipant(
      sessionId,
      userId,
    );
    const config = parseQuizGameConfig(session.gameConfig);
    const runtime = config.quizRuntime as QuizRuntimeState | undefined;
    const items = (runtime?.personalRecap?.[userId] ?? []) as QuizRecapItem[];

    return {
      sessionId,
      finalScore: runtime?.playerScores[userId] ?? 0,
      ratingChange: runtime?.ratingChanges?.[userId] ?? 0,
      outcome: (runtime?.outcomes?.[userId] as QuizRecapDto['outcome']) ?? null,
      items,
    };
  },
};
