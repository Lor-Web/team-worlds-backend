import type { World, WorldTier } from '@prisma/client';

import { getMaxMembersForTier } from '../../config/world-tier.js';
import { AppError } from '../errors/AppError.js';

export function getWorldMemberLimit(tier: WorldTier): number {
  return getMaxMembersForTier(tier);
}

export function assertWorldHasMemberSlot(world: World, memberCount: number): void {
  const maxMembers = getMaxMembersForTier(world.tier);

  if (memberCount >= maxMembers) {
    throw new AppError('В мире достигнут лимит участников', {
      statusCode: 403,
      code: 'WORLD_MEMBER_LIMIT_REACHED',
    });
  }
}
