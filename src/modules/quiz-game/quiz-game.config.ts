import type { GameSessionStatus, GameTemplateSlug } from '@prisma/client';

import {
  quizLobbySchema,
  type QuizLobby,
  type QuizRuntime,
} from '../../openapi/schemas/quiz-game.schemas.js';
import {
  parseQuizSnapshot,
  stripCorrectAnswersFromSnapshot,
} from './quiz-snapshot.utils.js';

export function parseQuizLobby(value: unknown): QuizLobby {
  return quizLobbySchema.parse(value);
}

export type QuizGameConfig = {
  quizSnapshot?: unknown;
  quizLobby?: QuizLobby;
  quizRuntime?: QuizRuntime;
};

export function parseQuizGameConfig(value: unknown): QuizGameConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const config: QuizGameConfig = {};

  if (raw.quizSnapshot !== undefined) {
    config.quizSnapshot = raw.quizSnapshot;
  }

  if (raw.quizLobby !== undefined) {
    config.quizLobby = parseQuizLobby(raw.quizLobby);
  }

  if (raw.quizRuntime !== undefined && typeof raw.quizRuntime === 'object') {
    config.quizRuntime = raw.quizRuntime as QuizRuntime;
  }

  return config;
}

export function mergeQuizGameConfig(
  base: Record<string, unknown>,
  patch: Partial<QuizGameConfig>,
): Record<string, unknown> {
  return {
    ...base,
    ...patch,
  };
}

export function sanitizeQuizGameConfigForClient(
  config: Record<string, unknown>,
  status: GameSessionStatus,
  templateSlug: GameTemplateSlug,
): Record<string, unknown> {
  if (templateSlug !== 'quiz') {
    return config;
  }

  const result: Record<string, unknown> = { ...config };

  if (result.quizSnapshot && status !== 'finished') {
    try {
      result.quizSnapshot = stripCorrectAnswersFromSnapshot(
        parseQuizSnapshot(result.quizSnapshot),
      );
    } catch {
      // keep as-is if malformed
    }
  }

  if (status === 'lobby') {
    delete result.quizRuntime;
  }

  if (status === 'active' && result.quizRuntime && typeof result.quizRuntime === 'object') {
    const runtime = { ...(result.quizRuntime as Record<string, unknown>) };
    delete runtime.questionResults;
    delete runtime.personalRecap;
    delete runtime.ratingChanges;
    result.quizRuntime = runtime;
  }

  return result;
}
