import { env } from '../config/env.js';

export const HOST_GRACE_PERIOD_MS = env.HOST_GRACE_PERIOD_SECONDS * 1000;

export function computeHostGraceExpiresAt(from = Date.now()): Date {
  return new Date(from + HOST_GRACE_PERIOD_MS);
}
