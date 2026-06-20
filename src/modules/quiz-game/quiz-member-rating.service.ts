import { randomInt } from 'node:crypto';

import type { QuizLobby } from '../../openapi/schemas/quiz-game.schemas.js';
import { worldsRepository } from '../worlds/worlds.repository.js';

export type QuizRatingOutcome = 'win' | 'loss' | 'draw';

export type QuizRatingChange = {
  userId: string;
  delta: number;
};

function roll(min: number, max: number): number {
  return randomInt(min, max + 1);
}

function soloWinLossDelta(outcome: Exclude<QuizRatingOutcome, 'draw'>): number {
  const magnitude = roll(7, 10);
  return outcome === 'win' ? magnitude : -magnitude;
}

function teamsWinLossDelta(outcome: Exclude<QuizRatingOutcome, 'draw'>): number {
  const magnitude = roll(4, 7);
  return outcome === 'win' ? magnitude : -magnitude;
}

function soloDrawDelta(): number {
  return roll(5, 8);
}

function teamsDrawDelta(): number {
  return roll(2, 5);
}

export function computeQuizMemberRatingChanges(
  lobby: QuizLobby,
  outcomeByUserId: Map<string, QuizRatingOutcome>,
): QuizRatingChange[] {
  const changes: QuizRatingChange[] = [];

  if (lobby.mode === 'solo') {
    const hasDraw = [...outcomeByUserId.values()].some((outcome) => outcome === 'draw');
    const sharedDrawDelta = hasDraw ? soloDrawDelta() : null;

    for (const [userId, outcome] of outcomeByUserId) {
      if (outcome === 'draw') {
        changes.push({ userId, delta: sharedDrawDelta! });
        continue;
      }

      changes.push({ userId, delta: soloWinLossDelta(outcome) });
    }

    return changes;
  }

  for (const [userId, outcome] of outcomeByUserId) {
    if (outcome === 'draw') {
      changes.push({ userId, delta: teamsDrawDelta() });
      continue;
    }

    changes.push({ userId, delta: teamsWinLossDelta(outcome) });
  }

  return changes;
}

export async function applyQuizMemberRatingChanges(
  worldId: string,
  changes: QuizRatingChange[],
): Promise<void> {
  await worldsRepository.adjustMemberRatings(worldId, changes);
}
