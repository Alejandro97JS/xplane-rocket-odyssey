import { serve } from '@hono/node-server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
// This file runs from src/ in development and from dist/ in production. The
// built client is two folders up from either.
const webDistDir = process.env.WEB_DIST_DIR ?? path.resolve(here, '../../web/dist');
const port = Number(process.env.PORT ?? 3000);

const app = createApp({ webDistDir });
const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`Rocket Odyssey is listening on http://localhost:${info.port}`);
});

// Railway and Docker stop a container with SIGTERM. Close the listener so
// requests in flight can finish.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
