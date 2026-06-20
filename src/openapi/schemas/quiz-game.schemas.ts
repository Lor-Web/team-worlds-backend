import { z } from 'zod';

import '../setup.js';

export const quizLobbyModeSchema = z
  .enum(['solo', 'teams'])
  .openapi({ description: 'Режим квиза: solo — каждый сам за себя, teams — команды' });

export const quizLobbySchema = z
  .object({
    mode: quizLobbyModeSchema,
    teamCount: z
      .number()
      .int()
      .min(2)
      .max(20)
      .optional()
      .openapi({ description: 'Число команд (обязательно для mode=teams)' }),
  })
  .openapi('QuizLobby');

export const quizLobbyInputSchema = quizLobbySchema.superRefine((data, ctx) => {
  if (data.mode === 'teams' && data.teamCount === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['teamCount'],
      message: 'Укажите teamCount для командного режима',
    });
  }

  if (data.mode === 'solo' && data.teamCount !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['teamCount'],
      message: 'teamCount допустим только для mode=teams',
    });
  }
});

export const quizTeamSchema = z
  .object({
    index: z.number().int().min(0).openapi({ description: 'Индекс команды (0-based)' }),
    captainUserId: z.string().openapi({ description: 'ID капитана команды' }),
    memberIds: z
      .array(z.string())
      .openapi({ description: 'ID участников команды (включая капитана)' }),
  })
  .openapi('QuizTeam');

export const quizRuntimePhaseSchema = z
  .enum(['round_intro', 'question', 'round_recap', 'finished'])
  .openapi({ description: 'Текущая фаза игры квиза' });

export const quizRuntimeSchema = z
  .object({
    phase: quizRuntimePhaseSchema,
    currentRoundIndex: z.number().int().min(0),
    currentQuestionIndex: z.number().int().min(0),
    phaseEndsAt: z.string().datetime().nullable(),
    playerScores: z.record(z.number().int()),
    teams: z.array(quizTeamSchema).optional(),
  })
  .openapi('QuizRuntime');

export type QuizLobby = z.infer<typeof quizLobbySchema>;
export type QuizTeam = z.infer<typeof quizTeamSchema>;
export type QuizRuntime = z.infer<typeof quizRuntimeSchema>;

export const quizRecapItemSchema = z
  .object({
    roundIndex: z.number().int(),
    roundName: z.string(),
    questionIndex: z.number().int(),
    questionId: z.string(),
    questionText: z.string().nullable(),
    imageUrl: z.string().nullable(),
    videoUrl: z.string().nullable(),
    yourAnswerId: z.string().nullable(),
    yourAnswerText: z.string().nullable(),
    correctAnswerId: z.string(),
    correctAnswerText: z.string(),
    pointsEarned: z.number().int(),
    useDouble: z.boolean(),
  })
  .openapi('QuizRecapItem');

export const quizRecapSchema = z
  .object({
    sessionId: z.string(),
    finalScore: z.number().int(),
    ratingChange: z.number().int(),
    outcome: z.enum(['win', 'loss', 'draw']).nullable(),
    items: z.array(quizRecapItemSchema),
  })
  .openapi('QuizRecap');

export const quizRecapResponseSchema = z
  .object({
    recap: quizRecapSchema,
  })
  .openapi('QuizRecapResponse');
