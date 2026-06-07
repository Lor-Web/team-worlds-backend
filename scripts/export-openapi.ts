import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateOpenApiDocument } from '../src/openapi/document.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(rootDir, 'openapi');
const outFile = join(outDir, 'openapi.json');

mkdirSync(outDir, { recursive: true });

const document = generateOpenApiDocument();
writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`OpenAPI spec exported to ${outFile}`);
