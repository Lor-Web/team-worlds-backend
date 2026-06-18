import type { Server } from 'socket.io';

import { worldPresenceBroadcast } from '../modules/worlds/socket/world-presence.broadcast.js';
import type { AuthenticatedSocket } from './socket.auth.js';
import { presenceRegistry } from './presence.registry.js';

export function registerPresenceHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.userId;
    const becameOnline = presenceRegistry.markConnected(userId);

    if (becameOnline) {
      void worldPresenceBroadcast.notifyUserPresenceChanged(userId);
    }

    socket.on('disconnect', () => {
      const becameOffline = presenceRegistry.markDisconnected(userId);

      if (becameOffline) {
        void worldPresenceBroadcast.notifyUserPresenceChanged(userId);
      }
    });
  });
}
