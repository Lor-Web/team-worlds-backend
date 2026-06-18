/**
 * Начисление XP и пересчёт level/stage мира.
 */
import {
  WORLD_XP_REWARDS,
  type WorldXpActivityCode,
} from '../../config/world-xp-rewards.js';
import { resolveWorldProgressionFields } from '../../config/world-progression.js';
import { worldsRepository } from './worlds.repository.js';

export const worldProgressionService = {
  async awardXpForActivity(
    worldId: string,
    activity: WorldXpActivityCode,
  ): Promise<void> {
    const amount = WORLD_XP_REWARDS[activity];
    await this.awardXp(worldId, amount);
  },

  async awardXp(worldId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }

    const world = await worldsRepository.findById(worldId);

    if (!world || world.deletedAt) {
      return;
    }

    const xp = world.xp + amount;
    const progression = resolveWorldProgressionFields(xp);

    await worldsRepository.updateProgression(worldId, {
      xp,
      level: progression.level,
      stage: progression.stage,
    });
  },
};
