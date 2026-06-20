export type ScoreableAnswer = {
  userId: string;
  answerId: string;
  useDouble: boolean;
  submittedAt: string;
  isCorrect: boolean;
};

export type QuestionScoreResult = {
  pointsByUserId: Record<string, number>;
  firstCorrectUserId: string | null;
};

export function scoreQuestionAnswers(input: {
  answers: ScoreableAnswer[];
  isDoublePoints: boolean;
}): QuestionScoreResult {
  const pointsByUserId: Record<string, number> = {};
  const sorted = [...input.answers].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );

  let firstCorrectUserId: string | null = null;

  for (const answer of sorted) {
    if (answer.isCorrect && firstCorrectUserId === null) {
      firstCorrectUserId = answer.userId;
    }
  }

  for (const answer of sorted) {
    pointsByUserId[answer.userId] = computePointsForAnswer({
      answer,
      isDoublePoints: input.isDoublePoints,
      isFirstCorrect: answer.userId === firstCorrectUserId && answer.isCorrect,
    });
  }

  return { pointsByUserId, firstCorrectUserId };
}

function computePointsForAnswer(input: {
  answer: ScoreableAnswer;
  isDoublePoints: boolean;
  isFirstCorrect: boolean;
}): number {
  const { answer, isDoublePoints, isFirstCorrect } = input;

  if (!answer.isCorrect) {
    if (isDoublePoints && answer.useDouble) {
      return -200;
    }

    return 0;
  }

  const base = isFirstCorrect ? 100 : 50;

  if (isDoublePoints && answer.useDouble) {
    return base + 100;
  }

  return base;
}
