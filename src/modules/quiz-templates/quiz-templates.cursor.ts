import type { QuizRoundDto } from './quiz-templates.dto.js';
import { resolveQuizRoundName } from './quiz-round-name.js';

export function encodeQuizTemplateCursor(input: {
  updatedAt: Date;
  id: string;
}): string {
  return Buffer.from(
    JSON.stringify({ updatedAt: input.updatedAt.toISOString(), id: input.id }),
    'utf8',
  ).toString('base64url');
}

export function decodeQuizTemplateCursor(
  cursor: string,
): { updatedAt: Date; id: string } {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { updatedAt?: string; id?: string };

    if (!parsed.updatedAt || !parsed.id) {
      throw new Error('Invalid cursor');
    }

    return { updatedAt: new Date(parsed.updatedAt), id: parsed.id };
  } catch {
    throw new Error('Invalid cursor');
  }
}

export function toQuizRoundDto(
  round: {
    id: string;
    order: number;
    customName: string | null;
    description: string;
    isDoublePoints: boolean;
    preRoundDelaySec: number;
    questionTimeSec: number;
    questions: Array<{
      id: string;
      order: number;
      text: string | null;
      imageUrl: string | null;
      videoUrl: string | null;
      answers: Array<{
        id: string;
        order: number;
        text: string;
        isCorrect: boolean;
      }>;
    }>;
  },
): QuizRoundDto {
  return {
    id: round.id,
    order: round.order,
    name: resolveQuizRoundName(round.customName, round.order),
    description: round.description,
    isDoublePoints: round.isDoublePoints,
    preRoundDelaySec: round.preRoundDelaySec,
    questionTimeSec: round.questionTimeSec,
    questions: round.questions.map((question) => ({
      id: question.id,
      order: question.order,
      text: question.text,
      imageUrl: question.imageUrl,
      videoUrl: question.videoUrl,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        order: answer.order,
        text: answer.text,
        isCorrect: answer.isCorrect,
      })),
    })),
  };
}
