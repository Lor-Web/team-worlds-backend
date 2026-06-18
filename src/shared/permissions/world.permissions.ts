/** Коды дополнительных прав участника мира (owner имеет все права автоматически). */
export const WorldPermission = {
  MANAGE_MEMBERS: 'world.members.manage',
  MANAGE_SETTINGS: 'world.settings.manage',
  HOST_GAME: 'world.games.host',
} as const;

export type WorldPermissionCode =
  (typeof WorldPermission)[keyof typeof WorldPermission];

export const WORLD_PERMISSION_CODES = Object.values(
  WorldPermission,
) as WorldPermissionCode[];
