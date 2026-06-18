import { getSocketServer } from '../../../socket/socket.server.js';
import { worldGamesRoom } from '../../../socket/socket.rooms.js';
import { worldPresenceService } from '../world-presence.service.js';
import { WorldGamesSocketEvent } from './world-games.events.js';

export const worldPresenceBroadcast = {
  async notifyUserPresenceChanged(userId: string): Promise<void> {
    const worldIds = await worldPresenceService.listWorldIdsForUser(userId);
    const io = getSocketServer();

    for (const worldId of worldIds) {
      const onlineMembers = await worldPresenceService.getOnlineMembersForWorld(worldId);

      io.to(worldGamesRoom(worldId)).emit(WorldGamesSocketEvent.presenceUpdated, {
        worldId,
        onlineMembers,
      });
    }
  },

  async emitPresenceSnapshotToSocket(socketId: string, worldId: string): Promise<void> {
    const onlineMembers = await worldPresenceService.getOnlineMembersForWorld(worldId);
    const io = getSocketServer();

    io.to(socketId).emit(WorldGamesSocketEvent.presenceUpdated, {
      worldId,
      onlineMembers,
    });
  },
};
