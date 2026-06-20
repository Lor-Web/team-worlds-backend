import { prisma } from '../../shared/db/prisma.js';
import { normalizeQuizTemplateInput } from './quiz-templates.normalize.js';
import type { UpsertQuizTemplateBody } from './quiz-templates.validators.js';

const templateInclude = {
  rounds: {
    orderBy: { order: 'asc' as const },
    include: {
      questions: {
        orderBy: { order: 'asc' as const },
        include: {
          answers: {
            orderBy: { order: 'asc' as const },
          },
        },
      },
    },
  },
} as const;

export const quizTemplatesRepository = {
  listByWorldPaginated(input: {
    worldId: string;
    q?: string;
    limit: number;
    cursor?: { updatedAt: Date; id: string };
  }) {
    return prisma.quizTemplate.findMany({
      where: {
        worldId: input.worldId,
        ...(input.q
          ? { name: { contains: input.q, mode: 'insensitive' } }
          : {}),
        ...(input.cursor
          ? {
              OR: [
                { updatedAt: { lt: input.cursor.updatedAt } },
                {
                  updatedAt: input.cursor.updatedAt,
                  id: { lt: input.cursor.id },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        worldId: true,
        name: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        rounds: {
          select: {
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });
  },

  listByWorld(worldId: string) {
    return prisma.quizTemplate.findMany({
      where: { worldId },
      include: templateInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  findByIdInWorld(templateId: string, worldId: string) {
    return prisma.quizTemplate.findFirst({
      where: { id: templateId, worldId },
      include: templateInclude,
    });
  },

  create(worldId: string, createdById: string, input: UpsertQuizTemplateBody) {
    const data = normalizeQuizTemplateInput(input);

    return prisma.quizTemplate.create({
      data: {
        worldId,
        name: data.name,
        createdById,
        rounds: {
          create: data.rounds.map((round) => ({
            order: round.order,
            customName: round.customName,
            description: round.description,
            isDoublePoints: round.isDoublePoints,
            preRoundDelaySec: round.preRoundDelaySec,
            questionTimeSec: round.questionTimeSec,
            questions: {
              create: round.questions.map((question) => ({
                order: question.order,
                text: question.text,
                imageUrl: question.imageUrl,
                videoUrl: question.videoUrl,
                answers: {
                  create: question.answers.map((answer) => ({
                    order: answer.order,
                    text: answer.text,
                    isCorrect: answer.isCorrect,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: templateInclude,
    });
  },

  async replace(templateId: string, input: UpsertQuizTemplateBody) {
    const data = normalizeQuizTemplateInput(input);

    return prisma.$transaction(async (tx) => {
      await tx.quizTemplate.update({
        where: { id: templateId },
        data: { name: data.name },
      });

      await tx.quizRound.deleteMany({ where: { templateId } });

      for (const round of data.rounds) {
        await tx.quizRound.create({
          data: {
            templateId,
            order: round.order,
            customName: round.customName,
            description: round.description,
            isDoublePoints: round.isDoublePoints,
            preRoundDelaySec: round.preRoundDelaySec,
            questionTimeSec: round.questionTimeSec,
            questions: {
              create: round.questions.map((question) => ({
                order: question.order,
                text: question.text,
                imageUrl: question.imageUrl,
                videoUrl: question.videoUrl,
                answers: {
                  create: question.answers.map((answer) => ({
                    order: answer.order,
                    text: answer.text,
                    isCorrect: answer.isCorrect,
                  })),
                },
              })),
            },
          },
        });
      }

      return tx.quizTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: templateInclude,
      });
    });
  },

  delete(templateId: string) {
    return prisma.quizTemplate.delete({ where: { id: templateId } });
  },
};
