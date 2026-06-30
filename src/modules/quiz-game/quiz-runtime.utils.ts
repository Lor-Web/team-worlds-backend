import type { QuizPlayerAnswer, QuizQuestionResult, QuizRuntimeState } from './quiz-game.types.js';

export type { QuizPlayerAnswer, QuizQuestionResult, QuizRuntimeState };

export function createEmptyPlayerAnswer(): QuizPlayerAnswer {
  return {
    answerId: null,
    useDouble: false,
    submittedAt: null,
    isFinal: false,
  };
}

export function initRuntimeState(
  playerIds: string[],
  teams?: QuizRuntimeState['teams'],
): QuizRuntimeState {
  const playerScores = Object.fromEntries(playerIds.map((userId) => [userId, 0]));

  return {
    phase: 'round_intro',
    currentRoundIndex: 0,
    currentQuestionIndex: 0,
    phaseEndsAt: null,
    playerScores,
    roundStartScores: { ...playerScores },
    teams,
    currentAnswers: {},
    questionResults: [],
  };
}

export function cloneRuntimeState(runtime: QuizRuntimeState): QuizRuntimeState {
  return {
    ...runtime,
    playerScores: { ...runtime.playerScores },
    roundStartScores: runtime.roundStartScores
      ? { ...runtime.roundStartScores }
      : undefined,
    teams: runtime.teams?.map((team) => ({
      ...team,
      memberIds: [...team.memberIds],
    })),
    currentAnswers: runtime.currentAnswers ? { ...runtime.currentAnswers } : {},
    questionResults: runtime.questionResults ? [...runtime.questionResults] : [],
    roundScoreDeltas: runtime.roundScoreDeltas ? { ...runtime.roundScoreDeltas } : undefined,
    ratingChanges: runtime.ratingChanges ? { ...runtime.ratingChanges } : undefined,
    personalRecap: runtime.personalRecap ? { ...runtime.personalRecap } : undefined,
  };
}

export function computeRoundScoreDeltas(
  runtime: QuizRuntimeState,
  playerIds: string[],
): Record<string, number> {
  const start = runtime.roundStartScores ?? runtime.playerScores;

  return Object.fromEntries(
    playerIds.map((userId) => [
      userId,
      (runtime.playerScores[userId] ?? 0) - (start[userId] ?? 0),
    ]),
  );
}
