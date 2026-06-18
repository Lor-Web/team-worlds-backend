import type {
  GameSession,
  GameSessionPlayer,
  GameTemplate,
  User,
} from '@prisma/client';

import { gameSessionSettingsSchema } from '../../openapi/schemas/game-session.schemas.js';
import { DEFAULT_GAME_SESSION_SETTINGS } from '../../config/game-session.js';

export type GameSessionPlayerDto = {
  userId: string;
  role: GameSessionPlayer['role'];
  isReady: boolean;
  joinedAt: string;
  leftAt: string | null;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

export type GameSessionListItemDto = {
  id: string;
  templateSlug: GameTemplate['slug'];
  templateName: string;
  hostId: string;
  hostUsername: string;
  status: GameSession['status'];
  playerCount: number;
  maxPlayers: number;
  readyCount: number;
  createdAt: string;
  hostGraceExpiresAt: string | null;
  hostAbsent: boolean;
  myRole: GameSessionPlayer['role'] | null;
  myIsReady: boolean | null;
  canJoin: boolean;
  isParticipant: boolean;
};

export type GameSessionDto = {
  id: string;
  worldId: string;
  templateSlug: GameTemplate['slug'];
  templateName: string;
  hostId: string;
  status: GameSession['status'];
  settings: ReturnType<typeof parseSessionSettings>;
  gameConfig: Record<string, unknown>;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  hostGraceExpiresAt: string | null;
  hostAbsent: boolean;
  players: GameSessionPlayerDto[];
  myRole: GameSessionPlayer['role'] | null;
  myIsReady: boolean | null;
};

type SessionPlayerUser = Pick<User, 'id' | 'username' | 'avatar'>;

type SessionWithRelations = GameSession & {
  template: GameTemplate;
  players: Array<GameSessionPlayer & { user: SessionPlayerUser }>;
};

export function parseSessionSettings(value: unknown) {
  const partial =
    typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};

  return gameSessionSettingsSchema.parse({
    ...DEFAULT_GAME_SESSION_SETTINGS,
    ...partial,
  });
}

export function parseGameConfig(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toGameSessionPlayerDto(
  player: GameSessionPlayer & { user: SessionPlayerUser },
): GameSessionPlayerDto {
  return {
    userId: player.userId,
    role: player.role,
    isReady: player.isReady,
    joinedAt: player.joinedAt.toISOString(),
    leftAt: player.leftAt?.toISOString() ?? null,
    user: {
      id: player.user.id,
      username: player.user.username,
      avatar: player.user.avatar,
    },
  };
}

export function toGameSessionDto(
  session: SessionWithRelations,
  viewerUserId?: string,
): GameSessionDto {
  const activePlayers = session.players.filter(
    (player: GameSessionPlayer & { user: SessionPlayerUser }) => player.leftAt === null,
  );
  const myPlayer = viewerUserId
    ? session.players.find(
        (player: GameSessionPlayer & { user: SessionPlayerUser }) =>
          player.userId === viewerUserId,
      )
    : undefined;

  return {
    id: session.id,
    worldId: session.worldId,
    templateSlug: session.template.slug,
    templateName: session.template.name,
    hostId: session.hostId,
    status: session.status,
    settings: parseSessionSettings(session.settings),
    gameConfig: parseGameConfig(session.gameConfig),
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    finishedAt: session.finishedAt?.toISOString() ?? null,
    hostGraceExpiresAt: session.hostGraceExpiresAt?.toISOString() ?? null,
    hostAbsent: isHostAbsent(session),
    players: activePlayers.map(toGameSessionPlayerDto),
    myRole: myPlayer && myPlayer.leftAt === null ? myPlayer.role : null,
    myIsReady: myPlayer && myPlayer.leftAt === null ? myPlayer.isReady : null,
  };
}

export function getActivePlayers<T extends { leftAt: Date | null }>(
  players: T[],
): T[] {
  return players.filter((player) => player.leftAt === null);
}

function isHostAbsent(
  session: Pick<GameSession, 'hostId' | 'hostGraceExpiresAt'> & {
    players: Array<Pick<GameSessionPlayer, 'userId' | 'leftAt'>>;
  },
): boolean {
  if (!session.hostGraceExpiresAt) {
    return false;
  }

  const hostPlayer = session.players.find((player) => player.userId === session.hostId);
  return hostPlayer?.leftAt !== null;
}

type SessionListRow = GameSession & {
  template: Pick<GameTemplate, 'slug' | 'name'>;
  host: Pick<User, 'id' | 'username'>;
  players: Array<Pick<GameSessionPlayer, 'userId' | 'role' | 'isReady' | 'leftAt'>>;
};

export function toGameSessionListItemDto(
  session: SessionListRow,
  viewerUserId: string,
): GameSessionListItemDto {
  const settings = parseSessionSettings(session.settings);
  const activePlayers = getActivePlayers(session.players);
  const myPlayer = session.players.find((player) => player.userId === viewerUserId);
  const isParticipant = myPlayer?.leftAt === null;
  const readyCount = activePlayers.filter((player) => player.isReady).length;

  const canJoin =
    session.status === 'lobby' &&
    activePlayers.length < settings.maxPlayers &&
    !isParticipant;

  return {
    id: session.id,
    templateSlug: session.template.slug,
    templateName: session.template.name,
    hostId: session.hostId,
    hostUsername: session.host.username,
    status: session.status,
    playerCount: activePlayers.length,
    maxPlayers: settings.maxPlayers,
    readyCount,
    createdAt: session.createdAt.toISOString(),
    hostGraceExpiresAt: session.hostGraceExpiresAt?.toISOString() ?? null,
    hostAbsent: isHostAbsent(session),
    myRole: isParticipant && myPlayer ? myPlayer.role : null,
    myIsReady: isParticipant && myPlayer ? myPlayer.isReady : null,
    canJoin,
    isParticipant,
  };
}
