-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorldMemberRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "WorldTier" AS ENUM ('STANDARD', 'EXTENDED', 'VIP');

-- CreateEnum
CREATE TYPE "WorldStage" AS ENUM ('OUTPOST', 'SETTLEMENT', 'CITY', 'METROPOLIS', 'CELESTIAL_CITADEL');

-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('lobby', 'active', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "GamePlayerRole" AS ENUM ('host', 'player');

-- CreateEnum
CREATE TYPE "GameTemplateSlug" AS ENUM ('quiz', 'mafia', 'alias', 'custom');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORLD_GAME_CREATED', 'WORLD_MEMBER_JOINED', 'WORLD_PROGRESSION', 'WORLD_INVITE', 'GAME_INVITE', 'WORLD_ARCHIVED');

-- CreateEnum
CREATE TYPE "WorldInviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "siteRole" "SiteRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "backgroundUrl" TEXT NOT NULL DEFAULT '',
    "inviteCode" TEXT NOT NULL,
    "tier" "WorldTier" NOT NULL DEFAULT 'STANDARD',
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "stage" "WorldStage" NOT NULL DEFAULT 'OUTPOST',
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldMember" (
    "userId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "role" "WorldMemberRole" NOT NULL DEFAULT 'member',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldMember_pkey" PRIMARY KEY ("userId","worldId")
);

-- CreateTable
CREATE TABLE "GameTemplate" (
    "id" TEXT NOT NULL,
    "slug" "GameTemplateSlug" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minPlayers" INTEGER NOT NULL DEFAULT 2,
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "defaultSettings" JSONB NOT NULL DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'lobby',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "gameConfig" JSONB NOT NULL DEFAULT '{}',
    "hostGraceExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSessionPlayer" (
    "gameSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GamePlayerRole" NOT NULL DEFAULT 'player',
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "rewards" JSONB NOT NULL DEFAULT '{}',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "GameSessionPlayer_pkey" PRIMARY KEY ("gameSessionId","userId")
);

-- CreateTable
CREATE TABLE "WorldInvite" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" "WorldInviteStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "WorldInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "World_inviteCode_key" ON "World"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "GameTemplate_slug_key" ON "GameTemplate"("slug");

-- CreateIndex
CREATE INDEX "GameSession_worldId_status_idx" ON "GameSession"("worldId", "status");

-- CreateIndex
CREATE INDEX "GameSession_worldId_createdAt_idx" ON "GameSession"("worldId", "createdAt");

-- CreateIndex
CREATE INDEX "GameSessionPlayer_userId_idx" ON "GameSessionPlayer"("userId");

-- CreateIndex
CREATE INDEX "WorldInvite_inviteeId_status_idx" ON "WorldInvite"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "WorldInvite_worldId_status_idx" ON "WorldInvite"("worldId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorldInvite_worldId_inviteeId_key" ON "WorldInvite"("worldId", "inviteeId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldMember" ADD CONSTRAINT "WorldMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldMember" ADD CONSTRAINT "WorldMember_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GameTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionPlayer" ADD CONSTRAINT "GameSessionPlayer_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionPlayer" ADD CONSTRAINT "GameSessionPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldInvite" ADD CONSTRAINT "WorldInvite_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldInvite" ADD CONSTRAINT "WorldInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldInvite" ADD CONSTRAINT "WorldInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

