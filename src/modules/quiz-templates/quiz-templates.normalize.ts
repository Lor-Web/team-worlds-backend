import type { UpsertQuizTemplateBody } from '../../openapi/schemas/quiz-template.schemas.js';
import { mediaStorage } from '../../shared/media/media-storage.js';

function normalizeOptionalText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeQuizTemplateInput(input: UpsertQuizTemplateBody) {
  return {
    name: input.name.trim(),
    rounds: input.rounds.map((round, roundIndex) => ({
      order: roundIndex + 1,
      customName: normalizeOptionalText(round.name),
      description: round.description?.trim() ?? '',
      isDoublePoints: round.isDoublePoints ?? false,
      preRoundDelaySec: round.preRoundDelaySec,
      questionTimeSec: round.questionTimeSec,
      questions: round.questions.map((question, questionIndex) => {
        const imageUrl = normalizeOptionalText(question.imageUrl);
        mediaStorage.assertImageUrlReady(imageUrl);

        return {
          order: questionIndex + 1,
          text: normalizeOptionalText(question.text),
          imageUrl,
          videoUrl: normalizeOptionalText(question.videoUrl),
          answers: question.answers.map((answer, answerIndex) => ({
            order: answerIndex + 1,
            text: answer.text.trim(),
            isCorrect: answer.isCorrect,
          })),
        };
      }),
    })),
  };
}
