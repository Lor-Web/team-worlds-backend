-- CreateTable
CREATE TABLE "QuizTemplate" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizRound" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "preRoundDelaySec" INTEGER NOT NULL,
    "questionTimeSec" INTEGER NOT NULL,

    CONSTRAINT "QuizRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizTemplate_worldId_updatedAt_idx" ON "QuizTemplate"("worldId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizRound_templateId_order_key" ON "QuizRound"("templateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_roundId_order_key" ON "QuizQuestion"("roundId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_questionId_order_key" ON "QuizAnswer"("questionId", "order");

-- AddForeignKey
ALTER TABLE "QuizTemplate" ADD CONSTRAINT "QuizTemplate_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizTemplate" ADD CONSTRAINT "QuizTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizRound" ADD CONSTRAINT "QuizRound_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuizTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
