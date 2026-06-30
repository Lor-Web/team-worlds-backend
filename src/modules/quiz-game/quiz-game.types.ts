import type { QuizTeam } from '../../openapi/schemas/quiz-game.schemas.js';

export type QuizPlayerAnswer = {
  answerId: string | null;
  useDouble: boolean;
  submittedAt: string | null;
  isFinal: boolean;
};

export type QuizQuestionResult = {
  questionId: string;
  roundIndex: number;
  questionIndex: number;
  correctAnswerId: string;
  pointsByUserId: Record<string, number>;
  answersByUserId: Record<string, QuizPlayerAnswer>;
};

export type QuizRuntimePhase = 'round_intro' | 'question' | 'round_recap' | 'finished';

export type QuizRuntimeState = {
  phase: QuizRuntimePhase;
  currentRoundIndex: number;
  currentQuestionIndex: number;
  phaseEndsAt: string | null;
  playerScores: Record<string, number>;
  roundStartScores?: Record<string, number>;
  teams?: QuizTeam[];
  currentAnswers?: Record<string, QuizPlayerAnswer>;
  questionResults?: QuizQuestionResult[];
  roundScoreDeltas?: Record<string, number>;
  ratingChanges?: Record<string, number>;
  outcomes?: Record<string, string>;
  personalRecap?: Record<string, unknown[]>;
};
