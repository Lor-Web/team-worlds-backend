import type { Server } from 'socket.io';

import type { AuthenticatedSocket } from '../../../socket/socket.auth.js';
import { userRoom } from '../../../socket/socket.rooms.js';
import { userNotificationsBroadcast } from './user-notifications.broadcast.js';

export function registerUserNotificationHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    void socket.join(userRoom(socket.data.userId));
    void userNotificationsBroadcast.emitUnreadCountToSocket(socket.id, socket.data.userId);
  });
}
