import type { QuizGameSnapshot } from '../../openapi/schemas/quiz-template.schemas.js';
import type { QuizRoundDto } from '../quiz-templates/quiz-templates.dto.js';

export function parseQuizSnapshot(value: unknown): QuizGameSnapshot {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid quiz snapshot');
  }

  return value as QuizGameSnapshot;
}

export function getRound(
  snapshot: QuizGameSnapshot,
  roundIndex: number,
): QuizRoundDto | undefined {
  return snapshot.rounds[roundIndex];
}

export function getQuestion(
  snapshot: QuizGameSnapshot,
  roundIndex: number,
  questionIndex: number,
) {
  return snapshot.rounds[roundIndex]?.questions[questionIndex];
}

export function stripCorrectAnswersFromSnapshot(
  snapshot: QuizGameSnapshot,
): Record<string, unknown> {
  return {
    ...snapshot,
    rounds: snapshot.rounds.map((round) => ({
      ...round,
      questions: round.questions.map((question) => ({
        ...question,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          order: answer.order,
          text: answer.text,
        })),
      })),
    })),
  };
}

export function findAnswerText(
  snapshot: QuizGameSnapshot,
  questionId: string,
  answerId: string | null,
): string | null {
  if (!answerId) {
    return null;
  }

  for (const round of snapshot.rounds) {
    for (const question of round.questions) {
      if (question.id !== questionId) {
        continue;
      }

      const answer = question.answers.find((item) => item.id === answerId);
      return answer?.text ?? null;
    }
  }

  return null;
}

export function findCorrectAnswerId(
  snapshot: QuizGameSnapshot,
  questionId: string,
): string | null {
  for (const round of snapshot.rounds) {
    for (const question of round.questions) {
      if (question.id !== questionId) {
        continue;
      }

      return question.answers.find((answer) => answer.isCorrect)?.id ?? null;
    }
  }

  return null;
}
