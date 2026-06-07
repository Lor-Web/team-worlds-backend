import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from '../config/constants.js';

export const openApiRegistry = new OpenAPIRegistry();

openApiRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description:
    'Access token из ответа login/register. Передавать в заголовке: Authorization: Bearer <token>',
});

openApiRegistry.registerComponent('securitySchemes', 'refreshCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: REFRESH_TOKEN_COOKIE_NAME,
  description: `HttpOnly cookie с refresh-токеном. Path: ${REFRESH_TOKEN_COOKIE_PATH}. На фронте: credentials: 'include'`,
});
