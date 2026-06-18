import type { GameSessionStatus } from '@prisma/client';

import { parseSessionSettings } from './game-sessions.dto.js';
import type { ListWorldGamesQuery } from './game-sessions.validators.js';

export const OPEN_WORLD_GAME_STATUSES: GameSessionStatus[] = ['lobby', 'active'];

export function resolveListStatuses(filter: ListWorldGamesQuery['status']): GameSessionStatus[] {
  switch (filter) {
    case 'lobby':
      return ['lobby'];
    case 'active':
      return ['active'];
    case 'open':
      return OPEN_WORLD_GAME_STATUSES;
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function isSessionVisibleToUser(
  session: { settings: unknown; players: Array<{ userId: string; leftAt: Date | null }> },
  userId: string,
): boolean {
  const settings = parseSessionSettings(session.settings);

  if (!settings.isPrivate) {
    return true;
  }

  return session.players.some(
    (player) => player.userId === userId && player.leftAt === null,
  );
}

export function isOpenWorldGameStatus(status: GameSessionStatus): boolean {
  return OPEN_WORLD_GAME_STATUSES.includes(status);
}
