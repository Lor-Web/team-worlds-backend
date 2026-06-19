import { prisma } from '../../shared/db/prisma.js';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  timestamp: string;
  database: 'connected' | 'disconnected';
  deployTest: 'v2',  // убрать после теста

};

export async function getHealthStatus(): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp,
      database: 'connected',
      deployTest: 'v2',  // убрать после теста

    };
  } catch {
    return {
      status: 'degraded',
      timestamp,
      database: 'disconnected',
      deployTest: 'v2',  // убрать после теста
    };
  }
}
