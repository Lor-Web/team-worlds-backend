import type { Server } from 'socket.io';
import { z } from 'zod';

import { AppError } from '../../../shared/errors/AppError.js';
import {
  parseGameLobbyPayload,
  type AuthenticatedSocket,
} from '../../../socket/socket.auth.js';
import { gameLobbyRoom } from '../../../socket/socket.rooms.js';
import { gameAccessService } from '../../games/game-access.service.js';
import { quizGameEngine } from '../quiz-game.engine.js';
import { quizGameBroadcast } from './quiz-game.broadcast.js';
import {
  QuizGameSocketEvent,
  type QuizGameJoinAck,
  type QuizSubmitAnswerAck,
} from './quiz-game.events.js';

const submitAnswerPayloadSchema = z.object({
  sessionId: z.string().cuid(),
  answerId: z.string().cuid(),
  useDouble: z.boolean().optional(),
});

function toAckError(error: unknown): QuizGameJoinAck {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message };
  }

  return { ok: false, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

function toSubmitAckError(error: unknown): QuizSubmitAnswerAck {
  return toAckError(error);
}

export function registerQuizGameHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on(
      QuizGameSocketEvent.join,
      async (payload: unknown, ack?: (response: QuizGameJoinAck) => void) => {
        try {
          const { sessionId } = parseGameLobbyPayload(payload);
          await gameAccessService.requireQuizGameJoin(sessionId, socket.data.userId);
          await socket.join(gameLobbyRoom(sessionId));
          const snapshot = await quizGameEngine.getStateSnapshot(
            sessionId,
            socket.data.userId,
          );
          await quizGameBroadcast.emitStateSnapshot(socket.id, snapshot);
          ack?.({ ok: true });
        } catch (error) {
          ack?.(toAckError(error));
        }
      },
    );

    socket.on(
      QuizGameSocketEvent.submitAnswer,
      async (payload: unknown, ack?: (response: QuizSubmitAnswerAck) => void) => {
        try {
          const parsed = submitAnswerPayloadSchema.parse(payload);
          await gameAccessService.requireActiveQuizParticipant(
            parsed.sessionId,
            socket.data.userId,
          );
          await quizGameEngine.submitAnswer(parsed.sessionId, socket.data.userId, {
            answerId: parsed.answerId,
            useDouble: parsed.useDouble,
          });
          ack?.({ ok: true });
        } catch (error) {
          ack?.(toSubmitAckError(error));
        }
      },
    );

    socket.on(
      QuizGameSocketEvent.captainSubmit,
      async (payload: unknown, ack?: (response: QuizSubmitAnswerAck) => void) => {
        try {
          const parsed = submitAnswerPayloadSchema.parse(payload);
          await gameAccessService.requireActiveQuizParticipant(
            parsed.sessionId,
            socket.data.userId,
          );
          await quizGameEngine.captainSubmit(parsed.sessionId, socket.data.userId, {
            answerId: parsed.answerId,
            useDouble: parsed.useDouble,
          });
          ack?.({ ok: true });
        } catch (error) {
          ack?.(toSubmitAckError(error));
        }
      },
    );
  });
}
