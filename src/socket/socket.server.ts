import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

import { corsOrigins } from '../config/corsOrigins.js';
import { registerUserNotificationHandlers } from '../modules/notifications/socket/user-notifications.handlers.js';
import { registerGameLobbyHandlers } from '../modules/games/socket/game-lobby.handlers.js';
import { registerWorldGamesHandlers } from '../modules/worlds/socket/world-games.handlers.js';
import { registerPresenceHandlers } from './presence.handlers.js';
import { socketAuthMiddleware } from './socket.auth.js';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  registerWorldGamesHandlers(io);
  registerGameLobbyHandlers(io);
  registerPresenceHandlers(io);
  registerUserNotificationHandlers(io);

  return io;
}

export function getSocketServer(): Server {
  if (!io) {
    throw new Error('Socket.IO server is not initialized');
  }

  return io;
}

export async function closeSocketServer(): Promise<void> {
  if (!io) {
    return;
  }

  await io.close();
  io = null;
}
