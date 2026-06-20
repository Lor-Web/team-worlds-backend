import { randomInt } from 'node:crypto';

import type { QuizTeam } from '../../openapi/schemas/quiz-game.schemas.js';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function assignQuizTeams(playerIds: string[], teamCount: number): QuizTeam[] {
  const shuffled = shuffle(playerIds);
  const buckets: string[][] = Array.from({ length: teamCount }, () => []);

  shuffled.forEach((playerId, index) => {
    buckets[index % teamCount].push(playerId);
  });

  return buckets.map((memberIds, index) => {
    const captainUserId = memberIds[randomInt(0, memberIds.length)]!;

    return {
      index,
      captainUserId,
      memberIds,
    };
  });
}
