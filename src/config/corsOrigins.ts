import { env } from './env.js';

function parseCorsOrigins(raw: string): string[] {
  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one URL');
  }

  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  }

  return origins;
}

export const corsOrigins = parseCorsOrigins(env.CORS_ORIGIN);
