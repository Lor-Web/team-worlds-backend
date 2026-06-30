/** XP за активности мира. Значения можно менять без миграций. */
export const WorldXpActivity = {
  MEMBER_JOINED: 'MEMBER_JOINED',
  GAME_STARTED: 'GAME_STARTED',
  GAME_FINISHED: 'GAME_FINISHED',
} as const;

export type WorldXpActivityCode = (typeof WorldXpActivity)[keyof typeof WorldXpActivity];

export const WORLD_XP_REWARDS: Record<WorldXpActivityCode, number> = {
  MEMBER_JOINED: 5,
  GAME_STARTED: 10,
  GAME_FINISHED: 20,
};
