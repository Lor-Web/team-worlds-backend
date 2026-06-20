import { quizGameEngine } from './quiz-game.engine.js';

const phaseTimers = new Map<string, NodeJS.Timeout>();

export const quizGameScheduler = {
  schedule(sessionId: string, endsAt: Date): void {
    this.cancel(sessionId);

    const delayMs = Math.max(0, endsAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      void quizGameEngine.advancePhase(sessionId).catch((error) => {
        console.error(`Quiz phase advance failed for ${sessionId}:`, error);
      });
    }, delayMs);

    phaseTimers.set(sessionId, timer);
  },

  cancel(sessionId: string): void {
    const timer = phaseTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      phaseTimers.delete(sessionId);
    }
  },
};
