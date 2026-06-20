/** События Socket.IO для геймплея квиза. */
export const QuizGameSocketEvent = {
  join: 'quiz:join',
  submitAnswer: 'quiz:submit-answer',
  captainSubmit: 'quiz:captain-submit',
  stateSnapshot: 'quiz:state-snapshot',
  gameStarted: 'quiz:game-started',
  roundIntro: 'quiz:round-intro',
  questionStarted: 'quiz:question-started',
  answerPreview: 'quiz:answer-preview',
  questionEnded: 'quiz:question-ended',
  roundEnded: 'quiz:round-ended',
  gameFinished: 'quiz:game-finished',
} as const;

export type QuizGameJoinAck =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type QuizSubmitAnswerAck =
  | { ok: true }
  | { ok: false; code: string; message: string };
