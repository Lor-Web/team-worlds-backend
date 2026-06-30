export type QuizAnswerDto = {
  id: string;
  order: number;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestionDto = {
  id: string;
  order: number;
  text: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  answers: QuizAnswerDto[];
};

export type QuizRoundDto = {
  id: string;
  order: number;
  name: string;
  description: string;
  isDoublePoints: boolean;
  preRoundDelaySec: number;
  questionTimeSec: number;
  questions: QuizQuestionDto[];
};

export type QuizTemplateSummaryDto = {
  id: string;
  worldId: string;
  name: string;
  createdById: string;
  roundCount: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuizTemplateListDto = {
  templates: QuizTemplateSummaryDto[];
  nextCursor: string | null;
};

export type QuizTemplateDetailDto = {
  id: string;
  worldId: string;
  name: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  rounds: QuizRoundDto[];
};
