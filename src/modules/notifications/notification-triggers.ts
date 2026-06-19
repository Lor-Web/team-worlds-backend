/**
 * Триггеры доменных событий → уведомления.
 */
import type { WorldStage } from '@prisma/client';

import { getWorldStageLabel } from '../../config/world-progression.js';
import { parseSessionSettings } from '../games/game-sessions.dto.js';
import { gameSessionsRepository } from '../games/game-sessions.repository.js';
import { usersRepository } from '../users/users.repository.js';
import { worldsRepository } from '../worlds/worlds.repository.js';
import {
  buildGameInviteText,
  buildWorldArchivedText,
  buildWorldGameCreatedText,
  buildWorldInviteText,
  buildWorldMemberJoinedText,
  buildWorldProgressionText,
} from './notification-texts.js';
import { notificationsService } from './notifications.service.js';

export const notificationTriggers = {
  async onWorldGameCreated(input: {
    worldId: string;
    sessionId: string;
    hostId: string;
  }): Promise<void> {
    const session = await gameSessionsRepository.findByIdWithDetails(input.sessionId);

    if (!session) {
      return;
    }

    const settings = parseSessionSettings(session.settings);

    if (settings.isPrivate) {
      return;
    }

    const world = await worldsRepository.findById(input.worldId);

    if (!world) {
      return;
    }

    const host = await usersRepository.findById(input.hostId);
    const memberIds = await worldsRepository.listMemberUserIds(input.worldId, [input.hostId]);

    const { title, body } = buildWorldGameCreatedText({
      worldName: world.name,
      templateName: session.template.name,
      hostUsername: host?.username ?? 'Ведущий',
    });

    await notificationsService.deliverToUsers(memberIds, (userId) => ({
      userId,
      type: 'WORLD_GAME_CREATED',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
        sessionId: session.id,
        templateSlug: session.template.slug,
        actorUserId: input.hostId,
        actorUsername: host?.username,
      },
    }));
  },

  async onWorldMemberJoined(input: {
    worldId: string;
    joinerId: string;
  }): Promise<void> {
    const world = await worldsRepository.findById(input.worldId);

    if (!world) {
      return;
    }

    const joiner = await usersRepository.findById(input.joinerId);

    if (!joiner) {
      return;
    }

    const { title, body } = buildWorldMemberJoinedText({
      worldName: world.name,
      joinerUsername: joiner.username,
    });

    await notificationsService.deliverNotification({
      userId: world.ownerId,
      type: 'WORLD_MEMBER_JOINED',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
        actorUserId: joiner.id,
        actorUsername: joiner.username,
      },
    });
  },

  async onWorldProgression(input: {
    worldId: string;
    previousLevel: number;
    previousStage: WorldStage;
    newLevel: number;
    newStage: WorldStage;
  }): Promise<void> {
    const levelChanged = input.newLevel > input.previousLevel;
    const stageChanged = input.newStage !== input.previousStage;

    if (!levelChanged && !stageChanged) {
      return;
    }

    const world = await worldsRepository.findById(input.worldId);

    if (!world) {
      return;
    }

    const { title, body } = buildWorldProgressionText({
      worldName: world.name,
      level: input.newLevel,
      stage: input.newStage,
      levelChanged,
      stageChanged,
    });

    const memberIds = await worldsRepository.listMemberUserIds(input.worldId);

    await notificationsService.deliverToUsers(memberIds, (userId) => ({
      userId,
      type: 'WORLD_PROGRESSION',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
        level: input.newLevel,
        stage: input.newStage,
        stageName: getWorldStageLabel(input.newStage),
      },
    }));
  },

  async onWorldArchived(input: {
    worldId: string;
  }): Promise<void> {
    const world = await worldsRepository.findById(input.worldId);

    if (!world) {
      return;
    }

    const { title, body } = buildWorldArchivedText({ worldName: world.name });
    const memberIds = await worldsRepository.listMemberUserIds(input.worldId);

    await notificationsService.deliverToUsers(memberIds, (userId) => ({
      userId,
      type: 'WORLD_ARCHIVED',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
      },
    }));
  },

  /** Приглашение в мир (создание invite → уведомление WORLD_INVITE). */
  async onWorldInvite(input: {
    worldId: string;
    inviteeUserId: string;
    inviterUserId: string;
    inviteId?: string;
  }): Promise<void> {
    const [world, inviter] = await Promise.all([
      worldsRepository.findById(input.worldId),
      usersRepository.findById(input.inviterUserId),
    ]);

    if (!world || !inviter) {
      return;
    }

    const { title, body } = buildWorldInviteText({
      worldName: world.name,
      inviterUsername: inviter.username,
    });

    await notificationsService.deliverNotification({
      userId: input.inviteeUserId,
      type: 'WORLD_INVITE',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
        actorUserId: inviter.id,
        actorUsername: inviter.username,
        inviteId: input.inviteId,
      },
    });
  },

  /** Заглушка: вызов когда появится flow приглашений в игру. */
  async onGameInvite(input: {
    worldId: string;
    sessionId: string;
    inviteeUserId: string;
    inviterUserId: string;
    inviteId?: string;
  }): Promise<void> {
    const [world, inviter, session] = await Promise.all([
      worldsRepository.findById(input.worldId),
      usersRepository.findById(input.inviterUserId),
      gameSessionsRepository.findByIdWithDetails(input.sessionId),
    ]);

    if (!world || !inviter || !session) {
      return;
    }

    const { title, body } = buildGameInviteText({
      worldName: world.name,
      templateName: session.template.name,
      inviterUsername: inviter.username,
    });

    await notificationsService.deliverNotification({
      userId: input.inviteeUserId,
      type: 'GAME_INVITE',
      title,
      body,
      payload: {
        worldId: world.id,
        worldName: world.name,
        sessionId: session.id,
        templateSlug: session.template.slug,
        actorUserId: inviter.id,
        actorUsername: inviter.username,
        inviteId: input.inviteId,
      },
    });
  },
};
