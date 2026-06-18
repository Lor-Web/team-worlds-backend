/**
 * Онлайн-участники мира: пересечение members и глобального presence.
 */
import { presenceRegistry } from '../../socket/presence.registry.js';
import type { WorldOnlineMemberDto } from './worlds.dto.js';
import { worldsRepository } from './worlds.repository.js';

export const worldPresenceService = {
  async getOnlineMembersForWorld(worldId: string): Promise<WorldOnlineMemberDto[]> {
    const members = await worldsRepository.listMemberUsers(worldId);

    return members
      .filter((member) => presenceRegistry.isOnline(member.id))
      .map((member) => ({
        id: member.id,
        username: member.username,
        avatar: member.avatar,
      }));
  },

  async listWorldIdsForUser(userId: string): Promise<string[]> {
    return worldsRepository.listWorldIdsForUser(userId);
  },
};
