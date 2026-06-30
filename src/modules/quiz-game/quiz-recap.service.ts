import type { QuizGameSnapshot } from '../../openapi/schemas/quiz-template.schemas.js';
import type { QuizPlayerAnswer, QuizQuestionResult } from './quiz-game.types.js';
import { findAnswerText } from './quiz-snapshot.utils.js';

export type QuizRecapItem = {
  roundIndex: number;
  roundName: string;
  questionIndex: number;
  questionId: string;
  questionText: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  yourAnswerId: string | null;
  yourAnswerText: string | null;
  correctAnswerId: string;
  correctAnswerText: string;
  pointsEarned: number;
  useDouble: boolean;
};

export function buildPersonalRecap(
  snapshot: QuizGameSnapshot,
  questionResults: QuizQuestionResult[],
  userId: string,
): QuizRecapItem[] {
  return questionResults.map((result) => {
    const round = snapshot.rounds[result.roundIndex]!;
    const question = round.questions[result.questionIndex]!;
    const userAnswer: QuizPlayerAnswer | undefined = result.answersByUserId[userId];

    return {
      roundIndex: result.roundIndex,
      roundName: round.name,
      questionIndex: result.questionIndex,
      questionId: result.questionId,
      questionText: question.text,
      imageUrl: question.imageUrl,
      videoUrl: question.videoUrl,
      yourAnswerId: userAnswer?.answerId ?? null,
      yourAnswerText: findAnswerText(snapshot, result.questionId, userAnswer?.answerId ?? null),
      correctAnswerId: result.correctAnswerId,
      correctAnswerText:
        findAnswerText(snapshot, result.questionId, result.correctAnswerId) ?? '',
      pointsEarned: result.pointsByUserId[userId] ?? 0,
      useDouble: userAnswer?.useDouble ?? false,
    };
  });
}
