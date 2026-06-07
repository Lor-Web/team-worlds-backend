# OpenAPI — Team Worlds

Спецификация API для фронтенда и документации.

## Где смотреть

| URL | Описание |
|-----|----------|
| http://localhost:3000/api-docs | Swagger UI (можно вызывать API из браузера) |
| http://localhost:3000/openapi.json | JSON-спецификация |
| `openapi/openapi.json` | Экспорт для CI и генерации клиента (`npm run openapi:export`) |

## Генерация клиента на фронте (orval)

1. Убедись, что бэкенд запущен или spec экспортирован: `npm run openapi:export`
2. В проекте фронта установи orval: `npm i -D orval`
3. Пример `orval.config.ts`:

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  teamWorlds: {
    input: 'http://localhost:3000/openapi.json', // или путь к openapi/openapi.json
    output: {
      target: './src/api/generated.ts',
      client: 'fetch',
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: './src/api/customFetch.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
```

4. `customFetch` должен передавать `credentials: 'include'` и при необходимости `Authorization: Bearer ...`

```typescript
export async function customFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw await res.json();
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

5. `npx orval` — перегенерация после изменений API.

## Обновление spec на бэкенде

Описания эндпоинтов — в `src/openapi/paths/`.  
Схемы запросов/ответов — в `src/openapi/schemas/` (те же Zod, что и для валидации в `auth.validators.ts`).

После изменений: `npm run openapi:export` и коммит `openapi/openapi.json` (если фронт читает файл из репозитория).
