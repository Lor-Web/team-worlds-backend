import type { Socket } from 'socket.io';
import { z } from 'zod';

import { verifyAccessToken } from '../shared/utils/jwt.js';

export type AuthenticatedSocket = Socket & {
  data: {
    userId: string;
  };
};

const worldJoinPayloadSchema = z.object({
  worldId: z.string().cuid(),
});

const worldLeavePayloadSchema = worldJoinPayloadSchema;

const gameLobbyPayloadSchema = z.object({
  sessionId: z.string().cuid(),
});

export function parseWorldJoinPayload(payload: unknown): { worldId: string } {
  return worldJoinPayloadSchema.parse(payload);
}

export function parseWorldLeavePayload(payload: unknown): { worldId: string } {
  return worldLeavePayloadSchema.parse(payload);
}

export function parseGameLobbyPayload(payload: unknown): { sessionId: string } {
  return gameLobbyPayloadSchema.parse(payload);
}

export function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth.token;

  if (typeof token !== 'string' || !token.trim()) {
    next(new Error('UNAUTHORIZED'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}
