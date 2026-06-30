-- Системные шаблоны игр (quiz, mafia, alias, custom).
-- Без них POST /worlds/:worldId/games с templateSlug=quiz возвращает 404.

INSERT INTO "GameTemplate" (
  "id",
  "slug",
  "name",
  "description",
  "minPlayers",
  "maxPlayers",
  "defaultSettings",
  "isEnabled",
  "createdAt"
)
VALUES
  (
    'clseedgame00000000000000001',
    'quiz',
    'Quiz',
    'Викторина с раундами и вопросами',
    2,
    20,
    '{"minPlayers":2,"maxPlayers":10,"requireAllReady":true,"allowLateJoin":false,"isPrivate":false,"autoStartWhenAllReady":false}',
    true,
    NOW()
  ),
  (
    'clseedgame00000000000000002',
    'mafia',
    'Mafia',
    'Игра «Мафия»',
    4,
    16,
    '{"minPlayers":2,"maxPlayers":10,"requireAllReady":true,"allowLateJoin":false,"isPrivate":false,"autoStartWhenAllReady":false}',
    true,
    NOW()
  ),
  (
    'clseedgame00000000000000003',
    'alias',
    'Alias',
    'Игра «Alias» — объясни слова',
    2,
    12,
    '{"minPlayers":2,"maxPlayers":10,"requireAllReady":true,"allowLateJoin":false,"isPrivate":false,"autoStartWhenAllReady":false}',
    true,
    NOW()
  ),
  (
    'clseedgame00000000000000004',
    'custom',
    'Custom Game',
    'Своя игра с гибкими правилами',
    2,
    30,
    '{"minPlayers":2,"maxPlayers":10,"requireAllReady":true,"allowLateJoin":false,"isPrivate":false,"autoStartWhenAllReady":false}',
    true,
    NOW()
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "minPlayers" = EXCLUDED."minPlayers",
  "maxPlayers" = EXCLUDED."maxPlayers",
  "defaultSettings" = EXCLUDED."defaultSettings",
  "isEnabled" = true;
