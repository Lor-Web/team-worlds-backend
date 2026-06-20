import { AppError } from '../../shared/errors/AppError.js';
import { QUIZ_GAME } from '../../config/quiz-game.js';
import { WorldXpActivity } from '../../config/world-xp-rewards.js';
import { worldProgressionService } from '../worlds/world-progression.service.js';
import { worldGamesBroadcast } from '../worlds/socket/world-games.broadcast.js';
import { gameSessionsRepository } from '../games/game-sessions.repository.js';
import { getActivePlayers } from '../games/game-sessions.dto.js';
import { parseQuizGameConfig } from './quiz-game.config.js';
import type { QuizRuntimeState } from './quiz-game.types.js';
import {
  applyQuizMemberRatingChanges,
  computeQuizMemberRatingChanges,
} from './quiz-member-rating.service.js';
import { computeQuizOutcomes } from './quiz-outcome.service.js';
import { buildPersonalRecap } from './quiz-recap.service.js';
import { scoreQuestionAnswers } from './quiz-scoring.service.js';
import { quizGameScheduler } from './quiz-game.scheduler.js';
import { quizGameBroadcast } from './socket/quiz-game.broadcast.js';
import {
  cloneRuntimeState,
  computeRoundScoreDeltas,
  createEmptyPlayerAnswer,
} from './quiz-runtime.utils.js';
import {
  findCorrectAnswerId,
  getQuestion,
  getRound,
  parseQuizSnapshot,
} from './quiz-snapshot.utils.js';

const sessionLocks = new Map<string, Promise<void>>();

async function withSessionLock<T>(
  sessionId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = sessionLocks.get(sessionId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  sessionLocks.set(
    sessionId,
    previous.then(() => gate),
  );

  await previous;

  try {
    return await fn();
  } finally {
    release();
    if (sessionLocks.get(sessionId) === gate) {
      sessionLocks.delete(sessionId);
    }
  }
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function isAnswerValidForQuestion(
  snapshot: ReturnType<typeof parseQuizSnapshot>,
  roundIndex: number,
  questionIndex: number,
  answerId: string,
): boolean {
  const question = getQuestion(snapshot, roundIndex, questionIndex);
  return question?.answers.some((answer) => answer.id === answerId) ?? false;
}

function isAnswerCorrect(
  snapshot: ReturnType<typeof parseQuizSnapshot>,
  roundIndex: number,
  questionIndex: number,
  answerId: string,
): boolean {
  const question = getQuestion(snapshot, roundIndex, questionIndex);
  return question?.answers.some((answer) => answer.id === answerId && answer.isCorrect) ?? false;
}

function getCaptainUserId(runtime: QuizRuntimeState, userId: string): string | null {
  const team = runtime.teams?.find((item) => item.memberIds.includes(userId));
  return team?.captainUserId ?? null;
}

function getScoringUserIds(
  runtime: QuizRuntimeState,
  playerIds: string[],
  mode: 'solo' | 'teams',
): string[] {
  if (mode === 'solo') {
    return playerIds;
  }

  const captainIds = new Set(
    runtime.teams?.map((team) => team.captainUserId).filter(Boolean) ?? [],
  );

  return playerIds.filter((userId) => captainIds.has(userId));
}

async function loadQuizSession(sessionId: string) {
  const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

  if (!session) {
    throw new AppError('Игровая сессия не найдена', {
      statusCode: 404,
      code: 'GAME_SESSION_NOT_FOUND',
    });
  }

  if (session.template.slug !== 'quiz') {
    throw new AppError('Сессия не является квизом', {
      statusCode: 409,
      code: 'GAME_NOT_QUIZ',
    });
  }

    if (session.status !== 'active' && session.status !== 'finished') {
      throw new AppError('Игра недоступна', {
        statusCode: 409,
        code: 'GAME_SESSION_NOT_ACTIVE',
      });
    }

  const config = parseQuizGameConfig(session.gameConfig);

  if (!config.quizLobby || !config.quizRuntime || !config.quizSnapshot) {
    throw new AppError('Квиз не инициализирован', {
      statusCode: 409,
      code: 'GAME_QUIZ_NOT_INITIALIZED',
    });
  }

  const snapshot = parseQuizSnapshot(config.quizSnapshot);
  const runtime = config.quizRuntime as QuizRuntimeState;
  const activePlayers = getActivePlayers(session.players);

  return {
    session,
    config,
    snapshot,
    runtime,
    lobby: config.quizLobby,
    activePlayerIds: activePlayers.map((player) => player.userId),
  };
}

async function persistRuntime(
  sessionId: string,
  gameConfig: Record<string, unknown>,
  runtime: QuizRuntimeState,
): Promise<void> {
  await gameSessionsRepository.updateGameConfig(sessionId, {
    ...gameConfig,
    quizRuntime: runtime,
  });
}

export const quizGameEngine = {
  async beginGame(sessionId: string): Promise<void> {
    await withSessionLock(sessionId, async () => {
      const { config, snapshot, runtime } = await loadQuizSession(sessionId);
      const round = getRound(snapshot, runtime.currentRoundIndex);

      if (!round) {
        throw new AppError('Раунд не найден', {
          statusCode: 409,
          code: 'GAME_QUIZ_INVALID_STATE',
        });
      }

      const nextRuntime = cloneRuntimeState(runtime);
      const phaseEndsAt = addSeconds(new Date(), round.preRoundDelaySec);
      nextRuntime.phase = 'round_intro';
      nextRuntime.phaseEndsAt = phaseEndsAt.toISOString();
      nextRuntime.currentAnswers = {};
      nextRuntime.roundStartScores = { ...nextRuntime.playerScores };

      await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
      await quizGameBroadcast.roundIntro(sessionId, {
        roundIndex: nextRuntime.currentRoundIndex,
        round,
        phaseEndsAt: nextRuntime.phaseEndsAt,
      });
      quizGameScheduler.schedule(sessionId, phaseEndsAt);
    });
  },

  async advancePhase(sessionId: string): Promise<void> {
    await withSessionLock(sessionId, async () => {
      const loaded = await loadQuizSession(sessionId);
      const { config, snapshot, runtime } = loaded;

      if (runtime.phase === 'finished') {
        return;
      }

      const nextRuntime = cloneRuntimeState(runtime);

      if (runtime.phase === 'round_intro') {
        const round = getRound(snapshot, runtime.currentRoundIndex)!;
        const phaseEndsAt = addSeconds(new Date(), round.questionTimeSec);

        nextRuntime.phase = 'question';
        nextRuntime.currentQuestionIndex = 0;
        nextRuntime.phaseEndsAt = phaseEndsAt.toISOString();
        nextRuntime.currentAnswers = {};

        await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
        await quizGameBroadcast.questionStarted(sessionId, {
          roundIndex: nextRuntime.currentRoundIndex,
          questionIndex: 0,
          question: round.questions[0]!,
          phaseEndsAt: nextRuntime.phaseEndsAt,
          isDoublePoints: round.isDoublePoints,
        });
        quizGameScheduler.schedule(sessionId, phaseEndsAt);
        return;
      }

      if (runtime.phase === 'question') {
        await this.endCurrentQuestion(sessionId, loaded, nextRuntime);
        return;
      }

      if (runtime.phase === 'round_recap') {
        const nextRoundIndex = runtime.currentRoundIndex + 1;
        const nextRound = getRound(snapshot, nextRoundIndex);

        if (!nextRound) {
          await this.finishGame(sessionId, loaded, nextRuntime);
          return;
        }

        const phaseEndsAt = addSeconds(new Date(), nextRound.preRoundDelaySec);
        nextRuntime.phase = 'round_intro';
        nextRuntime.currentRoundIndex = nextRoundIndex;
        nextRuntime.currentQuestionIndex = 0;
        nextRuntime.phaseEndsAt = phaseEndsAt.toISOString();
        nextRuntime.currentAnswers = {};
        nextRuntime.roundStartScores = { ...nextRuntime.playerScores };
        nextRuntime.roundScoreDeltas = undefined;

        await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
        await quizGameBroadcast.roundIntro(sessionId, {
          roundIndex: nextRuntime.currentRoundIndex,
          round: nextRound,
          phaseEndsAt: nextRuntime.phaseEndsAt,
        });
        quizGameScheduler.schedule(sessionId, phaseEndsAt);
      }
    });
  },

  async endCurrentQuestion(
    sessionId: string,
    loaded: Awaited<ReturnType<typeof loadQuizSession>>,
    nextRuntime: QuizRuntimeState,
  ): Promise<void> {
    const { config, snapshot, runtime, lobby, activePlayerIds } = loaded;
    const round = getRound(snapshot, runtime.currentRoundIndex)!;
    const question = round.questions[runtime.currentQuestionIndex]!;
    const correctAnswerId = findCorrectAnswerId(snapshot, question.id);

    if (!correctAnswerId) {
      throw new AppError('Правильный ответ не найден', {
        statusCode: 500,
        code: 'GAME_QUIZ_INVALID_SNAPSHOT',
      });
    }

    const scoringUserIds = getScoringUserIds(nextRuntime, activePlayerIds, lobby.mode);
    const scoreableAnswers = scoringUserIds
      .map((userId) => {
        const answer = nextRuntime.currentAnswers?.[userId];
        if (!answer?.isFinal || !answer.answerId || !answer.submittedAt) {
          return null;
        }

        return {
          userId,
          answerId: answer.answerId,
          useDouble: answer.useDouble,
          submittedAt: answer.submittedAt,
          isCorrect: isAnswerCorrect(
            snapshot,
            runtime.currentRoundIndex,
            runtime.currentQuestionIndex,
            answer.answerId,
          ),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const { pointsByUserId, firstCorrectUserId } = scoreQuestionAnswers({
      answers: scoreableAnswers,
      isDoublePoints: round.isDoublePoints,
    });

    for (const [userId, points] of Object.entries(pointsByUserId)) {
      nextRuntime.playerScores[userId] = (nextRuntime.playerScores[userId] ?? 0) + points;
    }

    const questionResult = {
      questionId: question.id,
      roundIndex: runtime.currentRoundIndex,
      questionIndex: runtime.currentQuestionIndex,
      correctAnswerId,
      pointsByUserId,
      answersByUserId: { ...(nextRuntime.currentAnswers ?? {}) },
    };

    nextRuntime.questionResults = [...(nextRuntime.questionResults ?? []), questionResult];

    await quizGameBroadcast.questionEnded(sessionId, {
      roundIndex: runtime.currentRoundIndex,
      questionIndex: runtime.currentQuestionIndex,
      questionId: question.id,
      correctAnswerId,
      pointsByUserId,
      firstCorrectUserId,
      playerScores: nextRuntime.playerScores,
    });

    const nextQuestionIndex = runtime.currentQuestionIndex + 1;
    const nextQuestion = round.questions[nextQuestionIndex];

    if (nextQuestion) {
      const phaseEndsAt = addSeconds(new Date(), round.questionTimeSec);
      nextRuntime.currentQuestionIndex = nextQuestionIndex;
      nextRuntime.phase = 'question';
      nextRuntime.phaseEndsAt = phaseEndsAt.toISOString();
      nextRuntime.currentAnswers = {};

      await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
      await quizGameBroadcast.questionStarted(sessionId, {
        roundIndex: nextRuntime.currentRoundIndex,
        questionIndex: nextQuestionIndex,
        question: nextQuestion,
        phaseEndsAt: nextRuntime.phaseEndsAt,
        isDoublePoints: round.isDoublePoints,
      });
      quizGameScheduler.schedule(sessionId, phaseEndsAt);
      return;
    }

    nextRuntime.roundScoreDeltas = computeRoundScoreDeltas(nextRuntime, activePlayerIds);
    nextRuntime.phase = 'round_recap';
    nextRuntime.phaseEndsAt = addSeconds(new Date(), QUIZ_GAME.roundRecapSec).toISOString();
    nextRuntime.currentAnswers = {};

    await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
    await quizGameBroadcast.roundEnded(sessionId, {
      roundIndex: runtime.currentRoundIndex,
      roundName: round.name,
      playerScores: nextRuntime.playerScores,
      roundScoreDeltas: nextRuntime.roundScoreDeltas,
      phaseEndsAt: nextRuntime.phaseEndsAt,
    });
    quizGameScheduler.schedule(sessionId, new Date(nextRuntime.phaseEndsAt));
  },

  async finishGame(
    sessionId: string,
    loaded: Awaited<ReturnType<typeof loadQuizSession>>,
    nextRuntime: QuizRuntimeState,
  ): Promise<void> {
    const { session, config, snapshot, lobby, activePlayerIds } = loaded;

    const outcomes = computeQuizOutcomes(
      lobby,
      nextRuntime.playerScores,
      activePlayerIds,
      nextRuntime.teams,
    );
    const ratingChangesList = computeQuizMemberRatingChanges(lobby, outcomes);
    const ratingChanges = Object.fromEntries(
      ratingChangesList.map((item) => [item.userId, item.delta]),
    );

    await applyQuizMemberRatingChanges(session.worldId, ratingChangesList);
    await worldProgressionService.awardXpForActivity(
      session.worldId,
      WorldXpActivity.GAME_FINISHED,
    );

    const personalRecap = Object.fromEntries(
      activePlayerIds.map((userId) => [
        userId,
        buildPersonalRecap(snapshot, nextRuntime.questionResults ?? [], userId),
      ]),
    );

    nextRuntime.phase = 'finished';
    nextRuntime.phaseEndsAt = null;
    nextRuntime.ratingChanges = ratingChanges;
    nextRuntime.outcomes = Object.fromEntries(outcomes);
    nextRuntime.personalRecap = personalRecap;
    nextRuntime.currentAnswers = {};

    await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
    await gameSessionsRepository.finishSession(sessionId);
    quizGameScheduler.cancel(sessionId);

    await quizGameBroadcast.gameFinished(sessionId, {
      playerScores: nextRuntime.playerScores,
      ratingChanges,
      outcomes: Object.fromEntries(outcomes),
    });
    await worldGamesBroadcast.gameUpdated(session.worldId, sessionId);
  },

  async submitAnswer(
    sessionId: string,
    userId: string,
    input: { answerId: string; useDouble?: boolean },
  ): Promise<void> {
    await withSessionLock(sessionId, async () => {
      const loaded = await loadQuizSession(sessionId);
      const { config, snapshot, runtime, lobby } = loaded;

      if (runtime.phase !== 'question') {
        throw new AppError('Сейчас нельзя отправить ответ', {
          statusCode: 409,
          code: 'GAME_QUIZ_WRONG_PHASE',
        });
      }

      if (
        !isAnswerValidForQuestion(
          snapshot,
          runtime.currentRoundIndex,
          runtime.currentQuestionIndex,
          input.answerId,
        )
      ) {
        throw new AppError('Некорректный вариант ответа', {
          statusCode: 400,
          code: 'GAME_QUIZ_INVALID_ANSWER',
        });
      }

      const round = getRound(snapshot, runtime.currentRoundIndex)!;
      const nextRuntime = cloneRuntimeState(runtime);
      const currentAnswers = { ...(nextRuntime.currentAnswers ?? {}) };
      const now = new Date().toISOString();
      const useDouble = round.isDoublePoints ? (input.useDouble ?? false) : false;

      if (lobby.mode === 'teams') {
        const captainUserId = getCaptainUserId(nextRuntime, userId);

        if (captainUserId === userId) {
          currentAnswers[userId] = {
            answerId: input.answerId,
            useDouble,
            submittedAt: now,
            isFinal: false,
          };
        } else {
          currentAnswers[userId] = {
            answerId: input.answerId,
            useDouble,
            submittedAt: now,
            isFinal: false,
          };
        }

        nextRuntime.currentAnswers = currentAnswers;
        await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
        await quizGameBroadcast.answerPreview(sessionId, {
          roundIndex: runtime.currentRoundIndex,
          questionIndex: runtime.currentQuestionIndex,
          userId,
          answerId: input.answerId,
          useDouble,
        });
        return;
      }

      currentAnswers[userId] = {
        answerId: input.answerId,
        useDouble,
        submittedAt: now,
        isFinal: true,
      };
      nextRuntime.currentAnswers = currentAnswers;
      await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
      await quizGameBroadcast.answerPreview(sessionId, {
        roundIndex: runtime.currentRoundIndex,
        questionIndex: runtime.currentQuestionIndex,
        userId,
        answerId: input.answerId,
        useDouble,
        isFinal: true,
      });
    });
  },

  async captainSubmit(
    sessionId: string,
    userId: string,
    input: { answerId: string; useDouble?: boolean },
  ): Promise<void> {
    await withSessionLock(sessionId, async () => {
      const loaded = await loadQuizSession(sessionId);
      const { config, snapshot, runtime, lobby } = loaded;

      if (lobby.mode !== 'teams') {
        throw new AppError('Финальный ответ капитана только в командном режиме', {
          statusCode: 409,
          code: 'GAME_QUIZ_NOT_TEAM_MODE',
        });
      }

      if (runtime.phase !== 'question') {
        throw new AppError('Сейчас нельзя отправить ответ', {
          statusCode: 409,
          code: 'GAME_QUIZ_WRONG_PHASE',
        });
      }

      const captainUserId = getCaptainUserId(runtime, userId);
      if (captainUserId !== userId) {
        throw new AppError('Только капитан может отправить финальный ответ', {
          statusCode: 403,
          code: 'GAME_QUIZ_CAPTAIN_REQUIRED',
        });
      }

      if (
        !isAnswerValidForQuestion(
          snapshot,
          runtime.currentRoundIndex,
          runtime.currentQuestionIndex,
          input.answerId,
        )
      ) {
        throw new AppError('Некорректный вариант ответа', {
          statusCode: 400,
          code: 'GAME_QUIZ_INVALID_ANSWER',
        });
      }

      const round = getRound(snapshot, runtime.currentRoundIndex)!;
      const nextRuntime = cloneRuntimeState(runtime);
      const currentAnswers = { ...(nextRuntime.currentAnswers ?? {}) };
      const useDouble = round.isDoublePoints ? (input.useDouble ?? false) : false;

      currentAnswers[userId] = {
        answerId: input.answerId,
        useDouble,
        submittedAt: new Date().toISOString(),
        isFinal: true,
      };
      nextRuntime.currentAnswers = currentAnswers;

      await persistRuntime(sessionId, config as Record<string, unknown>, nextRuntime);
      await quizGameBroadcast.answerPreview(sessionId, {
        roundIndex: runtime.currentRoundIndex,
        questionIndex: runtime.currentQuestionIndex,
        userId,
        answerId: input.answerId,
        useDouble,
        isFinal: true,
      });
    });
  },

  async getStateSnapshot(sessionId: string, userId: string) {
    const session = await gameSessionsRepository.findByIdWithDetails(sessionId);

    if (!session || session.template.slug !== 'quiz') {
      throw new AppError('Игра не найдена', {
        statusCode: 404,
        code: 'GAME_SESSION_NOT_FOUND',
      });
    }

    const config = parseQuizGameConfig(session.gameConfig);
    const runtime = config.quizRuntime as QuizRuntimeState | undefined;

    if (!runtime) {
      throw new AppError('Квиз не инициализирован', {
        statusCode: 409,
        code: 'GAME_QUIZ_NOT_INITIALIZED',
      });
    }

    const snapshot = config.quizSnapshot
      ? parseQuizSnapshot(config.quizSnapshot)
      : null;
    const round =
      snapshot && runtime.phase !== 'finished'
        ? getRound(snapshot, runtime.currentRoundIndex)
        : null;
    const question =
      snapshot && runtime.phase === 'question'
        ? getQuestion(snapshot, runtime.currentRoundIndex, runtime.currentQuestionIndex)
        : null;

    return {
      sessionId,
      phase: runtime.phase,
      currentRoundIndex: runtime.currentRoundIndex,
      currentQuestionIndex: runtime.currentQuestionIndex,
      phaseEndsAt: runtime.phaseEndsAt,
      playerScores: runtime.playerScores,
      teams: runtime.teams,
      roundScoreDeltas: runtime.roundScoreDeltas,
      roundIntro: round
        ? {
            roundIndex: runtime.currentRoundIndex,
            name: round.name,
            description: round.description,
            isDoublePoints: round.isDoublePoints,
          }
        : null,
      currentQuestion:
        question && runtime.phase === 'question'
          ? {
              roundIndex: runtime.currentRoundIndex,
              questionIndex: runtime.currentQuestionIndex,
              id: question.id,
              order: question.order,
              text: question.text,
              imageUrl: question.imageUrl,
              videoUrl: question.videoUrl,
              answers: question.answers.map((answer) => ({
                id: answer.id,
                order: answer.order,
                text: answer.text,
              })),
              isDoublePoints: round?.isDoublePoints ?? false,
            }
          : null,
      currentAnswers: runtime.currentAnswers ?? {},
      myTeamCaptainUserId:
        runtime.teams?.find((team) => team.memberIds.includes(userId))?.captainUserId ?? null,
      ratingChanges: session.status === 'finished' ? runtime.ratingChanges : undefined,
      outcomes: session.status === 'finished' ? runtime.outcomes : undefined,
      personalRecap:
        session.status === 'finished'
          ? (runtime.personalRecap?.[userId] as unknown[] | undefined)
          : undefined,
    };
  },

  async recoverTimers(): Promise<void> {
    const sessions = await gameSessionsRepository.findActiveQuizSessions();

    for (const session of sessions) {
      const config = parseQuizGameConfig(session.gameConfig);
      const runtime = config.quizRuntime as QuizRuntimeState | undefined;

      if (!runtime?.phaseEndsAt || runtime.phase === 'finished') {
        continue;
      }

      const endsAt = new Date(runtime.phaseEndsAt);

      if (endsAt.getTime() <= Date.now()) {
        await this.advancePhase(session.id);
      } else {
        quizGameScheduler.schedule(session.id, endsAt);
      }
    }
  },
};

export { createEmptyPlayerAnswer };
