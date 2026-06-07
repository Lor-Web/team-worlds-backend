import { PrismaClient, SiteRole } from '@prisma/client';
import { config } from 'dotenv';

import { hashPassword } from '../src/shared/utils/password.js';

config();

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@teamworlds.local',
  password: 'Admin123!',
} as const;

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME ?? DEFAULT_ADMIN.username;
  const email = process.env.ADMIN_SEED_EMAIL ?? DEFAULT_ADMIN.email;
  const password = process.env.ADMIN_SEED_PASSWORD ?? DEFAULT_ADMIN.password;

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      siteRole: SiteRole.ADMIN,
    },
    create: {
      username,
      email,
      passwordHash,
      siteRole: SiteRole.ADMIN,
    },
  });

  console.log('Admin user ready:', {
    id: user.id,
    username: user.username,
    email: user.email,
    siteRole: user.siteRole,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
