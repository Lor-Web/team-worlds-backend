/** Лимиты контента шаблона квиза. */
export const QUIZ_TEMPLATE_LIMITS = {
  maxRounds: 15,
  maxQuestionsPerRound: 20,
  maxAnswersPerQuestion: 6,
  minAnswersPerQuestion: 2,
  maxNameLength: 128,
  maxRoundNameLength: 64,
  maxRoundDescriptionLength: 1000,
  maxQuestionTextLength: 2000,
  maxAnswerTextLength: 500,
  maxPreRoundDelaySec: 600,
  maxQuestionTimeSec: 600,
  minQuestionTimeSec: 1,
} as const;
