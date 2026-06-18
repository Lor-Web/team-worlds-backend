import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './shared/db/prisma.js';
import { closeSocketServer, initSocketServer } from './socket/socket.server.js';
import { hostGraceService } from './modules/games/host-grace.service.js';

const app = createApp();
const httpServer = createServer(app);

initSocketServer(httpServer);

void hostGraceService.recoverPendingTimers();

httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);

  await closeSocketServer();

  httpServer.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
