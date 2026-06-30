import { PrismaClient } from '@prisma/client';

const DEFAULT_GAME_SESSION_SETTINGS = {
  minPlayers: 2,
  maxPlayers: 10,
  requireAllReady: true,
  allowLateJoin: false,
  isPrivate: false,
  autoStartWhenAllReady: false,
};

const GAME_TEMPLATES = [
  {
    slug: 'quiz',
    name: 'Quiz',
    description: 'Викторина с раундами и вопросами',
    minPlayers: 2,
    maxPlayers: 20,
  },
  {
    slug: 'mafia',
    name: 'Mafia',
    description: 'Игра «Мафия»',
    minPlayers: 4,
    maxPlayers: 16,
  },
  {
    slug: 'alias',
    name: 'Alias',
    description: 'Игра «Alias» — объясни слова',
    minPlayers: 2,
    maxPlayers: 12,
  },
  {
    slug: 'custom',
    name: 'Custom Game',
    description: 'Своя игра с гибкими правилами',
    minPlayers: 2,
    maxPlayers: 30,
  },
];

const prisma = new PrismaClient();

async function main() {
  for (const template of GAME_TEMPLATES) {
    await prisma.gameTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        minPlayers: template.minPlayers,
        maxPlayers: template.maxPlayers,
        defaultSettings: DEFAULT_GAME_SESSION_SETTINGS,
        isEnabled: true,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        minPlayers: template.minPlayers,
        maxPlayers: template.maxPlayers,
        defaultSettings: DEFAULT_GAME_SESSION_SETTINGS,
        isEnabled: true,
      },
    });
  }

  console.log('Game templates ready:', GAME_TEMPLATES.map((t) => t.slug).join(', '));
}

main()
  .catch((error) => {
    console.error('Seed game templates failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
