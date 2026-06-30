# Квиз — API для фронтенда

Полное описание REST и Socket.IO для интеграции геймплея квиза.

**Связанные документы:**
- [quiz-templates.md](./quiz-templates.md) — шаблоны контента, CRUD
- [quiz-gameplay.md](./quiz-gameplay.md) — бизнес-правила (очки, рейтинг, команды)

---

## Общий flow

```text
1. GET  /worlds/:worldId/quiz-templates          — выбор шаблона
2. POST /worlds/:worldId/games                   — создание с quizTemplateId + quizLobby
3. Socket game:join + REST join/ready            — лобби
4. POST /games/:sessionId/start                  — host стартует
5. Socket quiz:join                              — подписка на геймплей (комната та же game:{sessionId})
6. Сервер ведёт фазы: round_intro → question → … → finished
7. Socket quiz:* события + GET /games/:id       — синхронизация UI
8. GET  /games/:sessionId/quiz/recap             — персональная сводка после finished
```

---

## Аутентификация

- **REST:** `Authorization: Bearer <accessToken>`
- **Socket.IO:** при подключении передать JWT в `auth.token`:

```typescript
const socket = io(API_URL, {
  auth: { token: accessToken },
  withCredentials: true,
});
```

---

## REST

### Создание игры

`POST /worlds/{worldId}/games`

```json
{
  "templateSlug": "quiz",
  "quizTemplateId": "clxxx...",
  "quizLobby": { "mode": "solo" }
}
```

Командный режим:

```json
{
  "templateSlug": "quiz",
  "quizTemplateId": "clxxx...",
  "quizLobby": { "mode": "teams", "teamCount": 3 }
}
```

`quizLobby` **обязателен** для quiz, задаётся один раз при создании.

**Ответ:** `{ session }` — см. `GameSession` в OpenAPI.

В `session.gameConfig`:
- `quizSnapshot` — контент (раунды, вопросы, ответы)
- `quizLobby` — `{ mode, teamCount? }`

> **Важно:** пока игра `active`, из `quizSnapshot` **убирается** `isCorrect` у ответов (античит). Правильный ответ приходит только в socket `quiz:question-ended`.

---

### Текущее состояние сессии

`GET /games/{sessionId}`

Используйте для:
- первичной загрузки после refresh
- проверки `status` (`lobby` | `active` | `finished`)
- чтения `gameConfig.quizRuntime` (фаза, счёт, команды)

При `status=active` в `gameConfig.quizRuntime`:

| Поле | Описание |
|------|----------|
| `phase` | `round_intro` \| `question` \| `round_recap` \| `finished` |
| `currentRoundIndex` | 0-based |
| `currentQuestionIndex` | 0-based |
| `phaseEndsAt` | ISO datetime дедлайна фазы или `null` |
| `playerScores` | `{ [userId]: number }` |
| `teams` | массив команд (если `mode=teams`) |
| `roundScoreDeltas` | дельта очков за раунд (на фазе `round_recap`) |

---

### Персональная сводка

`GET /games/{sessionId}/quiz/recap`

Доступен **участнику** после `status=finished`.

**Ответ:**

```json
{
  "recap": {
    "sessionId": "clxxx",
    "finalScore": 450,
    "ratingChange": 8,
    "outcome": "win",
    "items": [
      {
        "roundIndex": 0,
        "roundName": "Раунд 1",
        "questionIndex": 0,
        "questionId": "clq...",
        "questionText": "Столица Франции?",
        "imageUrl": null,
        "videoUrl": null,
        "yourAnswerId": "cla...",
        "yourAnswerText": "Париж",
        "correctAnswerId": "cla...",
        "correctAnswerText": "Париж",
        "pointsEarned": 100,
        "useDouble": false
      }
    ]
  }
}
```

`outcome`: `win` | `loss` | `draw` | `null`

---

## Socket.IO — комнаты

| Комната | Как войти | Назначение |
|---------|-----------|------------|
| `game:{sessionId}` | `game:join` (лобби) или `quiz:join` (active/finished) | лобби + геймплей |

После `game:join` в лобби клиент **остаётся** в комнате — события геймплея приходят в ту же комнату.

---

## Socket — Client → Server

### Лобби (уже было)

| Событие | Payload | Ack |
|---------|---------|-----|
| `game:join` | `{ sessionId }` | `{ ok: true }` \| `{ ok: false, code, message }` |
| `game:leave` | `{ sessionId }` | — |

### Геймплей квиза

| Событие | Payload | Ack | Когда |
|---------|---------|-----|-------|
| `quiz:join` | `{ sessionId }` | `{ ok: true }` \| error | `status=active` или `finished`; после join приходит `quiz:state-snapshot` |
| `quiz:submit-answer` | `{ sessionId, answerId, useDouble? }` | `{ ok: true }` \| error | фаза `question` |
| `quiz:captain-submit` | `{ sessionId, answerId, useDouble? }` | `{ ok: true }` \| error | teams: только капитан, финальный ответ |

#### `quiz:submit-answer`

- **Solo:** ответ сразу **финальный** (`isFinal: true` в preview-событии).
- **Teams:** черновик для всех участников команды; **не влияет** на очки до `quiz:captain-submit`.
- `useDouble` — только если текущий раунд `isDoublePoints: true`; иначе игнорируется.

#### `quiz:captain-submit`

- Только в `mode=teams`.
- Только пользователь с `captainUserId` своей команды.
- Финальный ответ команды; если капитан не отправил до `phaseEndsAt` → **0** очков за вопрос.

---

## Socket — Server → Client

### `quiz:game-started`

Сразу после старта игры host'ом.

```typescript
{
  sessionId: string;
  quizRuntime: {
    phase: 'round_intro';
    currentRoundIndex: 0;
    currentQuestionIndex: 0;
    phaseEndsAt: string | null;
    playerScores: Record<string, number>;
    teams?: Array<{
      index: number;
      captainUserId: string;
      memberIds: string[];
    }>;
  };
}
```

Далее следует `quiz:round-intro` для первого раунда.

---

### `quiz:state-snapshot`

Персональный снимок при `quiz:join` (reconnect / поздний вход в комнату).

```typescript
{
  sessionId: string;
  phase: 'round_intro' | 'question' | 'round_recap' | 'finished';
  currentRoundIndex: number;
  currentQuestionIndex: number;
  phaseEndsAt: string | null;
  playerScores: Record<string, number>;
  teams?: QuizTeam[];
  roundScoreDeltas?: Record<string, number>;
  roundIntro: {
    roundIndex: number;
    name: string;
    description: string;
    isDoublePoints: boolean;
  } | null;
  currentQuestion: {
    roundIndex: number;
    questionIndex: number;
    id: string;
    order: number;
    text: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    answers: Array<{ id: string; order: number; text: string }>; // без isCorrect
    isDoublePoints: boolean;
  } | null;
  currentAnswers: Record<string, {
    answerId: string | null;
    useDouble: boolean;
    submittedAt: string | null;
    isFinal: boolean;
  }>;
  myTeamCaptainUserId: string | null;
  // только при finished:
  ratingChanges?: Record<string, number>;
  outcomes?: Record<string, 'win' | 'loss' | 'draw'>;
  personalRecap?: QuizRecapItem[];
}
```

**UI:** синхронизируйте таймер по `phaseEndsAt` (`Date.now()` vs deadline).

---

### `quiz:round-intro`

Перед началом раунда (экран описания).

```typescript
{
  sessionId: string;
  roundIndex: number;
  name: string;           // «Раунд N» или кастом
  description: string;
  isDoublePoints: boolean;
  preRoundDelaySec: number;
  phaseEndsAt: string;    // когда начнётся первый вопрос
}
```

---

### `quiz:question-started`

```typescript
{
  sessionId: string;
  roundIndex: number;
  questionIndex: number;
  question: {
    id: string;
    order: number;
    text: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    answers: Array<{ id: string; order: number; text: string }>;
  };
  phaseEndsAt: string;
  isDoublePoints: boolean;
}
```

---

### `quiz:answer-preview`

Черновик / финальный ответ (teams: видят все в команде).

```typescript
{
  sessionId: string;
  roundIndex: number;
  questionIndex: number;
  userId: string;
  answerId: string;
  useDouble: boolean;
  isFinal?: boolean;  // true — финальный (solo или captain-submit)
}
```

---

### `quiz:question-ended`

```typescript
{
  sessionId: string;
  roundIndex: number;
  questionIndex: number;
  questionId: string;
  correctAnswerId: string;
  pointsByUserId: Record<string, number>;  // очки за этот вопрос
  firstCorrectUserId: string | null;
  playerScores: Record<string, number>;    // накопительный счёт
}
```

Показать правильный ответ и начисленные очки.

---

### `quiz:round-ended`

```typescript
{
  sessionId: string;
  roundIndex: number;
  roundName: string;
  playerScores: Record<string, number>;
  roundScoreDeltas: Record<string, number>;  // изменение за раунд
  phaseEndsAt: string;  // через ~8 сек начнётся следующий раунд или финал
}
```

---

### `quiz:game-finished`

```typescript
{
  sessionId: string;
  playerScores: Record<string, number>;
  ratingChanges: Record<string, number>;   // delta WorldMember.rating
  outcomes: Record<string, 'win' | 'loss' | 'draw'>;
}
```

После этого:
- `GET /games/{sessionId}` → `status=finished`
- `GET /games/{sessionId}/quiz/recap` — детальная сводка

---

## Фазы и UI

```text
round_intro ──(preRoundDelaySec)──► question ──(questionTimeSec)──► …
                                      │
                    последний вопрос раунда
                                      ▼
                               round_recap ──(8 сек)──► round_intro (след. раунд)
                                      │
                              последний раунд
                                      ▼
                                  finished
```

| Фаза | Экран |
|------|-------|
| `round_intro` | название раунда, description, таймер до старта |
| `question` | вопрос, варианты, таймер, кнопка «удвоить» (если `isDoublePoints`) |
| `round_recap` | таблица очков, `roundScoreDeltas` |
| `finished` | итог, рейтинг, переход к recap |

---

## Режим solo vs teams

| | Solo | Teams |
|---|------|-------|
| Настройка | `quizLobby.mode: "solo"` | `mode: "teams", teamCount: N` |
| Команды | — | в `quiz:game-started` / `quizRuntime.teams` |
| Ответ | `quiz:submit-answer` = финал | черновики: `quiz:submit-answer`; финал: `quiz:captain-submit` |
| Очки | индивидуально | только капитан |
| Победа (рейтинг) | max личных очков | max суммы очков команды |

---

## Очки (кратко)

**Обычный раунд:** первый правильный +100, остальные правильные +50, ошибка 0.

**Раунд с удвоением (`isDoublePoints`):** на вопрос опционально `useDouble: true`:
- правильно + double → база + 100
- правильно без double → база
- неправильно + double → −200
- неправильно без double → 0

Подробнее: [quiz-gameplay.md](./quiz-gameplay.md).

---

## Рейтинг мира (`WorldMember.rating`)

Меняется **только** по итогам игры (`quiz:game-finished` / recap).

| | Solo | Teams |
|---|------|-------|
| Победа | +7..10 | +4..7 каждому в команде |
| Поражение | −7..10 | −4..7 |
| Ничья | +5..8 (один random на всех) | +2..5 каждому |

Поле `rating` в `WorldMember` API (список участников мира).

---

## XP мира

- **+10 XP** при старте (`GAME_STARTED`) — уже было
- **+20 XP** при завершении (`GAME_FINISHED`) — начисляется автоматически

---

## Reconnect

1. `GET /games/{sessionId}` — статус + `gameConfig.quizRuntime`
2. Socket `quiz:join` → `quiz:state-snapshot`
3. UI по `phase` + `phaseEndsAt`

Таймеры серверные; при рестарте бэкенда фазы восстанавливаются по `phaseEndsAt` в БД.

---

## Коды ошибок (quiz)

| code | HTTP | Ситуация |
|------|------|----------|
| `GAME_NOT_QUIZ` | 409 | не quiz-сессия |
| `GAME_QUIZ_LOBBY_MISSING` | 409 | нет quizLobby при старте |
| `GAME_QUIZ_NOT_ENOUGH_PLAYERS_FOR_TEAMS` | 409 | игроков < teamCount |
| `GAME_SESSION_NOT_ACTIVE` | 409 | ответ не в active-игре |
| `GAME_QUIZ_WRONG_PHASE` | 409 | не фаза question |
| `GAME_QUIZ_INVALID_ANSWER` | 400 | answerId не из текущего вопроса |
| `GAME_QUIZ_CAPTAIN_REQUIRED` | 403 | captain-submit не капитаном |
| `GAME_QUIZ_NOT_TEAM_MODE` | 409 | captain-submit в solo |
| `GAME_SESSION_NOT_FINISHED` | 409 | recap до finished |

---

## Orval / OpenAPI

Схемы: `QuizLobby`, `QuizRecap`, `QuizRecapItem`, `CreateGameSessionBody` (с `quizLobby`).

Экспорт: `npm run openapi:export` → `openapi/openapi.json`.

---

## Чеклист интеграции фронта

- [ ] Форма создания игры: шаблон + solo/teams + teamCount
- [ ] Лобби: `game:join`, join/ready REST
- [ ] Экран игры: `quiz:join`, обработка всех `quiz:*` событий
- [ ] Таймер от `phaseEndsAt`
- [ ] Solo: отправка `quiz:submit-answer`
- [ ] Teams: preview + `quiz:captain-submit` для капитана
- [ ] Toggle «удвоить» при `isDoublePoints`
- [ ] Экран итогов раунда (`quiz:round-ended`)
- [ ] Экран финала + `GET /quiz/recap`
- [ ] Отображение `WorldMember.rating` в профиле мира
