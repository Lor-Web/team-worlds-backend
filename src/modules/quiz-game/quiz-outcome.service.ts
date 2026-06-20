import type { QuizLobby, QuizTeam } from '../../openapi/schemas/quiz-game.schemas.js';
import type { QuizRatingOutcome } from './quiz-member-rating.service.js';

function getTeamScores(
  teams: QuizTeam[],
  playerScores: Record<string, number>,
): Map<number, number> {
  const teamScores = new Map<number, number>();

  for (const team of teams) {
    const total = team.memberIds.reduce(
      (sum, userId) => sum + (playerScores[userId] ?? 0),
      0,
    );
    teamScores.set(team.index, total);
  }

  return teamScores;
}

export function computeQuizOutcomes(
  lobby: QuizLobby,
  playerScores: Record<string, number>,
  playerIds: string[],
  teams?: QuizTeam[],
): Map<string, QuizRatingOutcome> {
  const outcomes = new Map<string, QuizRatingOutcome>();

  if (lobby.mode === 'solo') {
    const maxScore = Math.max(...playerIds.map((userId) => playerScores[userId] ?? 0));
    const winners = playerIds.filter((userId) => (playerScores[userId] ?? 0) === maxScore);

    for (const userId of playerIds) {
      if (winners.length > 1 && winners.includes(userId)) {
        outcomes.set(userId, 'draw');
      } else if (winners.includes(userId)) {
        outcomes.set(userId, 'win');
      } else {
        outcomes.set(userId, 'loss');
      }
    }

    return outcomes;
  }

  if (!teams || teams.length === 0) {
    for (const userId of playerIds) {
      outcomes.set(userId, 'draw');
    }

    return outcomes;
  }

  const teamScores = getTeamScores(teams, playerScores);
  const maxTeamScore = Math.max(...teamScores.values());
  const winningTeamIndexes = [...teamScores.entries()]
    .filter(([, score]) => score === maxTeamScore)
    .map(([index]) => index);

  for (const team of teams) {
    const teamOutcome: QuizRatingOutcome =
      winningTeamIndexes.length > 1 && winningTeamIndexes.includes(team.index)
        ? 'draw'
        : winningTeamIndexes.includes(team.index)
          ? 'win'
          : 'loss';

    for (const userId of team.memberIds) {
      outcomes.set(userId, teamOutcome);
    }
  }

  for (const userId of playerIds) {
    if (!outcomes.has(userId)) {
      outcomes.set(userId, 'loss');
    }
  }

  return outcomes;
}
