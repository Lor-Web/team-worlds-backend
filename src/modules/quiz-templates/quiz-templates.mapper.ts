import type {
  QuizAnswer,
  QuizQuestion,
  QuizRound,
  QuizTemplate,
} from '@prisma/client';

import type { QuizGameSnapshot } from '../../openapi/schemas/quiz-template.schemas.js';
import type {
  QuizTemplateDetailDto,
  QuizTemplateSummaryDto,
} from './quiz-templates.dto.js';
import { toQuizRoundDto } from './quiz-templates.cursor.js';

type QuizTemplateWithTree = QuizTemplate & {
  rounds: Array<
    QuizRound & {
      questions: Array<
        QuizQuestion & {
          answers: QuizAnswer[];
        }
      >;
    }
  >;
};

function countQuestions(template: QuizTemplateWithTree): number {
  return template.rounds.reduce((sum, round) => sum + round.questions.length, 0);
}

export function toQuizTemplateSummaryDto(
  template: QuizTemplateWithTree,
): QuizTemplateSummaryDto {
  return {
    id: template.id,
    worldId: template.worldId,
    name: template.name,
    createdById: template.createdById,
    roundCount: template.rounds.length,
    questionCount: countQuestions(template),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toQuizTemplateDetailDto(
  template: QuizTemplateWithTree,
): QuizTemplateDetailDto {
  return {
    id: template.id,
    worldId: template.worldId,
    name: template.name,
    createdById: template.createdById,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    rounds: template.rounds.map(toQuizRoundDto),
  };
}

export function toQuizGameSnapshot(template: QuizTemplateWithTree): QuizGameSnapshot {
  return {
    quizTemplateId: template.id,
    name: template.name,
    rounds: template.rounds.map(toQuizRoundDto),
  };
}
