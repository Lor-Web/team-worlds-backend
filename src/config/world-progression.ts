import type { WorldStage } from '@prisma/client';

/** Пороги стадий эволюции по уровню мира. */
export const WORLD_STAGE_THRESHOLDS: ReadonlyArray<{
  minLevel: number;
  stage: WorldStage;
  label: string;
}> = [
  { minLevel: 51, stage: 'CELESTIAL_CITADEL', label: 'Небесная цитадель' },
  { minLevel: 31, stage: 'METROPOLIS', label: 'Мегаполис' },
  { minLevel: 16, stage: 'CITY', label: 'Город' },
  { minLevel: 6, stage: 'SETTLEMENT', label: 'Поселение' },
  { minLevel: 1, stage: 'OUTPOST', label: 'Аванпост' },
];

const STAGE_LABELS = Object.fromEntries(
  WORLD_STAGE_THRESHOLDS.map((entry) => [entry.stage, entry.label]),
) as Record<WorldStage, string>;

/** Суммарный XP для достижения уровня L (L >= 1). */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }

  return 50 * level * (level - 1);
}

export function computeLevelFromXp(xp: number): number {
  let level = 1;

  while (xp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

export function computeStageFromLevel(level: number): WorldStage {
  for (const entry of WORLD_STAGE_THRESHOLDS) {
    if (level >= entry.minLevel) {
      return entry.stage;
    }
  }

  return 'OUTPOST';
}

export function getWorldStageLabel(stage: WorldStage): string {
  return STAGE_LABELS[stage];
}

export type WorldProgressionDto = {
  level: number;
  xp: number;
  stage: WorldStage;
  stageName: string;
  xpInLevel: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
};

export function computeWorldProgression(xp: number): WorldProgressionDto {
  const level = computeLevelFromXp(xp);
  const stage = computeStageFromLevel(level);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const xpInLevel = xp - currentLevelXp;
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);
  const levelSpan = nextLevelXp - currentLevelXp;
  const progressToNextLevel =
    levelSpan > 0 ? Math.min(1, Math.max(0, xpInLevel / levelSpan)) : 1;

  return {
    level,
    xp,
    stage,
    stageName: getWorldStageLabel(stage),
    xpInLevel,
    xpToNextLevel,
    progressToNextLevel,
  };
}

/** После начисления XP пересчитать level и stage для сохранения в БД. */
export function resolveWorldProgressionFields(xp: number): {
  level: number;
  stage: WorldStage;
} {
  const level = computeLevelFromXp(xp);
  return {
    level,
    stage: computeStageFromLevel(level),
  };
}
