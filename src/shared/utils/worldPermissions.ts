import { z } from 'zod';

import {
  WORLD_PERMISSION_CODES,
  type WorldPermissionCode,
} from '../permissions/world.permissions.js';

const worldPermissionsSchema = z.array(
  z.enum(WORLD_PERMISSION_CODES as [WorldPermissionCode, ...WorldPermissionCode[]]),
);

export function parseWorldPermissions(value: unknown): WorldPermissionCode[] {
  const result = worldPermissionsSchema.safeParse(value);
  return result.success ? result.data : [];
}
