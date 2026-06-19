import type { NotificationType, WorldStage } from '@prisma/client';

import { getWorldStageLabel } from '../../config/world-progression.js';

export type NotificationPayloadDto = {
  worldId?: string;
  worldName?: string;
  sessionId?: string;
  templateSlug?: string;
  actorUserId?: string;
  actorUsername?: string;
  level?: number;
  stage?: WorldStage;
  stageName?: string;
  inviteId?: string;
};

export function buildWorldGameCreatedText(input: {
  worldName: string;
  templateName: string;
  hostUsername: string;
}): { title: string; body: string } {
  return {
    title: `Новая игра в «${input.worldName}»`,
    body: `${input.templateName} · ведущий ${input.hostUsername}`,
  };
}

export function buildWorldMemberJoinedText(input: {
  worldName: string;
  joinerUsername: string;
}): { title: string; body: string } {
  return {
    title: `Новый участник в «${input.worldName}»`,
    body: `${input.joinerUsername} вступил в мир`,
  };
}

export function buildWorldProgressionText(input: {
  worldName: string;
  level: number;
  stage: WorldStage;
  levelChanged: boolean;
  stageChanged: boolean;
}): { title: string; body: string } {
  const stageName = getWorldStageLabel(input.stage);

  if (input.stageChanged) {
    return {
      title: `Мир «${input.worldName}» эволюционировал`,
      body: `Стадия: ${stageName} · уровень ${input.level}`,
    };
  }

  return {
    title: `Мир «${input.worldName}» повысил уровень`,
    body: `Уровень ${input.level}`,
  };
}

export function buildWorldArchivedText(input: {
  worldName: string;
}): { title: string; body: string } {
  return {
    title: `Мир «${input.worldName}» архивирован`,
    body: 'Владелец перенёс мир в архив. Игры и вступление недоступны.',
  };
}

export function buildWorldInviteText(input: {
  worldName: string;
  inviterUsername: string;
}): { title: string; body: string } {
  return {
    title: `Приглашение в «${input.worldName}»`,
    body: `${input.inviterUsername} приглашает вас в мир`,
  };
}

export function buildGameInviteText(input: {
  worldName: string;
  templateName: string;
  inviterUsername: string;
}): { title: string; body: string } {
  return {
    title: `Приглашение в игру`,
    body: `${input.inviterUsername} зовёт в ${input.templateName} («${input.worldName}»)`,
  };
}

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: NotificationPayloadDto;
};
