import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { generateOpenApiDocument } from './document.js';

const openApiDocument = generateOpenApiDocument();

export const openApiRoutes = Router();

openApiRoutes.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

openApiRoutes.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Team Worlds API',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  }),
);
