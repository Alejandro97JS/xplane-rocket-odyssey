import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface AppOptions {
  /** Folder with the built client, or null to run without it. */
  webDistDir: string | null;
}

const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * The HTTP application. In the MVP it only serves the built client and the
 * health check that Railway polls. The API, the database and the WebSockets
 * of later versions belong here.
 */
export function createApp({ webDistDir }: AppOptions): Hono {
  const app = new Hono();
  app.use(secureHeaders());
  // Text answers (the page, scripts, styles) shrink to about a third with gzip.
  app.use(compress());

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Nothing lives under /api yet. Answer in JSON so a future client never
  // receives the HTML of the game by mistake.
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

  const indexFile = webDistDir ? path.join(webDistDir, 'index.html') : null;
  if (webDistDir && indexFile && existsSync(indexFile)) {
    // serveStatic resolves its root from the working directory.
    const root = path.relative(process.cwd(), webDistDir) || '.';

    // Built assets carry a hash in their name, so they can be cached for good.
    // The header is added once the file has been found and the response exists.
    app.use('/assets/*', async (c, next) => {
      await next();
      if (c.res.status === 200) {
        c.res.headers.set('Cache-Control', `public, immutable, max-age=${ONE_YEAR_S}`);
      }
    });
    // The page itself is checked again on every visit, whatever its address,
    // `/` included. A cached old page would ask for assets that a new
    // deployment no longer has.
    app.use('*', async (c, next) => {
      await next();
      if (c.res.headers.get('Content-Type')?.startsWith('text/html')) {
        c.res.headers.set('Cache-Control', 'no-cache');
      }
    });
    app.use('*', serveStatic({ root }));

    // Every screen of the game has its own address, handled by the client
    // router. Any address that is not a file gets the page of the game.
    app.get('*', async (c) => {
      if (path.extname(c.req.path) !== '') return c.notFound();
      return c.html(await readFile(indexFile, 'utf8'));
    });
  } else {
    app.get('/', (c) =>
      c.text(
        'The client has not been built yet. Run "npm run build" first, or use "npm run dev" and open http://localhost:5173.',
        503,
      ),
    );
  }

  return app;
}
