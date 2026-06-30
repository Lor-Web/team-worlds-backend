# Шаблоны квиза

Контентные шаблоны **привязаны к миру**. Системный тип игры `quiz` (каталог `GameTemplate`) отделяется от пользовательского контента.

## Модель

```text
QuizTemplate (название, worldId)
  └── QuizRound (до 15)
        preRoundDelaySec   — пауза до начала раунда
        questionTimeSec    — время на каждый вопрос в раунде
        └── QuizQuestion (до 20)
              text? | imageUrl? | videoUrl?  — хотя бы одно
              └── QuizAnswer (2–6, ровно 1 isCorrect)
```

## Лимиты

| Параметр | Макс |
|----------|------|
| Раундов | 15 |
| Вопросов в раунде | 20 |
| Вариантов ответа | 6 |

## Медиа

- **videoUrl** — ссылка (URL)
- **imageUrl** — строка (URL или будущий ключ S3)
- TODO: загрузка картинок через S3 — см. `src/shared/media/media-storage.ts`

### Раунд

| Поле | Описание |
|------|----------|
| `name` | опционально, иначе «Раунд N» |
| `description` | текст до старта раунда (таймер preRoundDelaySec) |
| `isDoublePoints` | раунд с риском: удвоение при правильном, штраф при ошибке |

## API

| Method | Path | Кто / Query |
|--------|------|-------------|
| GET | `/worlds/:worldId/quiz-templates` | участник; `q`, `limit`, `cursor` |
| POST | `/worlds/:worldId/quiz-templates` | `world.games.host` |
| GET | `/worlds/:worldId/quiz-templates/:templateId` | участник |
| PUT | `/worlds/:worldId/quiz-templates/:templateId` | host |
| DELETE | `/worlds/:worldId/quiz-templates/:templateId` | host |

### Пример создания шаблона

```json
POST /worlds/{worldId}/quiz-templates
{
  "name": "Квиз про кино",
  "rounds": [
    {
      "name": "Музыкальный",
      "description": "Угадайте исполнителя по отрывку",
      "isDoublePoints": true,
      "preRoundDelaySec": 5,
      "questionTimeSec": 30,
      "questions": [
        {
          "text": "Кто режиссёр «Начала»?",
          "answers": [
            { "text": "Нолан", "isCorrect": true },
            { "text": "Спилberg", "isCorrect": false }
          ]
        }
      ]
    }
  ]
}
```

## Создание игры

```text
1. POST /worlds/:worldId/quiz-templates     — редактор шаблона
2. POST /worlds/:worldId/games
   {
     "templateSlug": "quiz",
     "quizTemplateId": "clxxx...",
     "quizLobby": { "mode": "solo" }
     // или { "mode": "teams", "teamCount": 3 }
   }
3. Лобби → старт (геймплей — отдельный этап)
```

При создании сессии контент **копируется** в `gameConfig.quizSnapshot` — правки шаблона не ломают уже созданные игры.

**Геймплей:** см. [quiz-gameplay-api.md](./quiz-gameplay-api.md).

## Права

Создание/редактирование шаблонов — то же право, что и создание игры: `world.games.host` (owner всегда может).
