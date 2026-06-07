import ms, { type StringValue } from 'ms';

import { AppError } from '../errors/AppError.js';

export function parseDurationToMs(value: string): number {
  const durationMs = ms(value as StringValue);

  if (durationMs === undefined) {
    throw new AppError(`Invalid duration: ${value}`, {
      statusCode: 500,
      code: 'INVALID_DURATION_CONFIG',
      isOperational: false,
    });
  }

  return durationMs;
}

export function expiresAtFromNow(duration: string): Date {
  return new Date(Date.now() + parseDurationToMs(duration));
}
