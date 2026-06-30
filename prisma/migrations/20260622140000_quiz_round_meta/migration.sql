-- AlterTable
ALTER TABLE "QuizRound" ADD COLUMN "customName" TEXT,
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "isDoublePoints" BOOLEAN NOT NULL DEFAULT false;
