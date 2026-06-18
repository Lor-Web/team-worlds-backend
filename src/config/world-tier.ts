import type { WorldTier } from '@prisma/client';

/**
 * Настройки статуса мира. Сейчас влияет только на maxMembers;
 * позже сюда же добавятся лимиты игр, кастомизация и т.д.
 */
export const WORLD_TIER_CONFIG = {
  STANDARD: {
    label: 'Обычный',
    maxMembers: 10,
  },
  EXTENDED: {
    label: 'Расширенный',
    maxMembers: 25,
  },
  VIP: {
    label: 'VIP',
    maxMembers: 100,
  },
} as const satisfies Record<
  WorldTier,
  { label: string; maxMembers: number }
>;

export function getMaxMembersForTier(tier: WorldTier): number {
  return WORLD_TIER_CONFIG[tier].maxMembers;
}

export function getWorldTierLabel(tier: WorldTier): string {
  return WORLD_TIER_CONFIG[tier].label;
}
