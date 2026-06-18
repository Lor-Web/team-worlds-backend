import { gameSessionSettingsSchema } from '../openapi/schemas/game-session.schemas.js';
import type { GameSessionSettings } from '../openapi/schemas/game-session.schemas.js';

/** Дефолтные настройки игровой сессии. */
export const DEFAULT_GAME_SESSION_SETTINGS: GameSessionSettings = {
  minPlayers: 2,
  maxPlayers: 10,
  requireAllReady: true,
  allowLateJoin: false,
  isPrivate: false,
  autoStartWhenAllReady: false,
};

export function mergeGameSessionSettings(
  templateDefaults: unknown,
  input: Partial<GameSessionSettings> | undefined,
): GameSessionSettings {
  const fromTemplate =
    typeof templateDefaults === 'object' &&
    templateDefaults !== null &&
    !Array.isArray(templateDefaults)
      ? templateDefaults
      : {};

  return gameSessionSettingsSchema.parse({
    ...DEFAULT_GAME_SESSION_SETTINGS,
    ...fromTemplate,
    ...input,
  });
}
