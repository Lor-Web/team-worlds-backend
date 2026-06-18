/**
 * Глобальный рейтинг миров по XP / level / дате создания.
 */
import { worldsRepository } from './worlds.repository.js';

export type WorldRankInfo = {
  rank: number | null;
  totalWorlds: number;
};

export const worldRankingService = {
  async getRankForWorld(worldId: string): Promise<WorldRankInfo> {
    const world = await worldsRepository.findById(worldId);

    if (!world) {
      return { rank: null, totalWorlds: 0 };
    }

    if (world.deletedAt) {
      const totalWorlds = await worldsRepository.countActiveWorlds();
      return { rank: null, totalWorlds };
    }

    const [rank, totalWorlds] = await Promise.all([
      worldsRepository.getWorldRank(world),
      worldsRepository.countActiveWorlds(),
    ]);

    return { rank, totalWorlds };
  },

  async getRankMap(): Promise<Map<string, number>> {
    const worlds = await worldsRepository.listActiveWorldsForRanking();
    const rankMap = new Map<string, number>();

    worlds.forEach((world, index) => {
      rankMap.set(world.id, index + 1);
    });

    return rankMap;
  },

  async listLeaderboard(limit: number) {
    return worldsRepository.listLeaderboard(limit);
  },
};
