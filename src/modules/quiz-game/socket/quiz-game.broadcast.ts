import { getSocketServer } from '../../../socket/socket.server.js';
import { gameLobbyRoom } from '../../../socket/socket.rooms.js';
import type { QuizRoundDto } from '../../quiz-templates/quiz-templates.dto.js';
import type { QuizQuestionDto } from '../../quiz-templates/quiz-templates.dto.js';
import { parseQuizGameConfig } from '../quiz-game.config.js';
import type { QuizRuntimeState } from '../quiz-game.types.js';
import { QuizGameSocketEvent } from './quiz-game.events.js';

function stripQuestionForClient(question: QuizQuestionDto) {
  return {
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
  };
}

export const quizGameBroadcast = {
  async gameStarted(sessionId: string, gameConfig: unknown): Promise<void> {
    const config = parseQuizGameConfig(gameConfig);
    const runtime = config.quizRuntime as QuizRuntimeState | undefined;

    if (!runtime) {
      return;
    }

    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.gameStarted, {
      sessionId,
      quizRuntime: {
        phase: runtime.phase,
        currentRoundIndex: runtime.currentRoundIndex,
        currentQuestionIndex: runtime.currentQuestionIndex,
        phaseEndsAt: runtime.phaseEndsAt,
        playerScores: runtime.playerScores,
        teams: runtime.teams,
      },
    });
  },

  async roundIntro(
    sessionId: string,
    payload: {
      roundIndex: number;
      round: QuizRoundDto;
      phaseEndsAt: string;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.roundIntro, {
      sessionId,
      roundIndex: payload.roundIndex,
      name: payload.round.name,
      description: payload.round.description,
      isDoublePoints: payload.round.isDoublePoints,
      preRoundDelaySec: payload.round.preRoundDelaySec,
      phaseEndsAt: payload.phaseEndsAt,
    });
  },

  async questionStarted(
    sessionId: string,
    payload: {
      roundIndex: number;
      questionIndex: number;
      question: QuizQuestionDto;
      phaseEndsAt: string;
      isDoublePoints: boolean;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.questionStarted, {
      sessionId,
      roundIndex: payload.roundIndex,
      questionIndex: payload.questionIndex,
      question: stripQuestionForClient(payload.question),
      phaseEndsAt: payload.phaseEndsAt,
      isDoublePoints: payload.isDoublePoints,
    });
  },

  async answerPreview(
    sessionId: string,
    payload: {
      roundIndex: number;
      questionIndex: number;
      userId: string;
      answerId: string;
      useDouble: boolean;
      isFinal?: boolean;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.answerPreview, {
      sessionId,
      ...payload,
    });
  },

  async questionEnded(
    sessionId: string,
    payload: {
      roundIndex: number;
      questionIndex: number;
      questionId: string;
      correctAnswerId: string;
      pointsByUserId: Record<string, number>;
      firstCorrectUserId: string | null;
      playerScores: Record<string, number>;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.questionEnded, {
      sessionId,
      ...payload,
    });
  },

  async roundEnded(
    sessionId: string,
    payload: {
      roundIndex: number;
      roundName: string;
      playerScores: Record<string, number>;
      roundScoreDeltas: Record<string, number>;
      phaseEndsAt: string;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.roundEnded, {
      sessionId,
      ...payload,
    });
  },

  async gameFinished(
    sessionId: string,
    payload: {
      playerScores: Record<string, number>;
      ratingChanges: Record<string, number>;
      outcomes: Record<string, string>;
    },
  ): Promise<void> {
    const io = getSocketServer();
    io.to(gameLobbyRoom(sessionId)).emit(QuizGameSocketEvent.gameFinished, {
      sessionId,
      ...payload,
    });
  },

  async emitStateSnapshot(
    socketId: string,
    snapshot: Awaited<ReturnType<typeof import('../quiz-game.engine.js').quizGameEngine.getStateSnapshot>>,
  ): Promise<void> {
    const io = getSocketServer();
    io.to(socketId).emit(QuizGameSocketEvent.stateSnapshot, snapshot);
  },
};
