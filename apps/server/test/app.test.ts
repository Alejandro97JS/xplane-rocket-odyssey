import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';

describe('server without a client build', () => {
  const app = createApp({ webDistDir: null });

  it('answers the health check', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('says that the client is not built', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(503);
    expect(await response.text()).toContain('npm run build');
  });

  it('answers unknown API paths in JSON', async () => {
    const response = await app.request('/api/anything');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });
});

describe('server with a client build', () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    // serveStatic resolves files from the working directory, so the fake
    // build lives inside it.
    dir = await mkdtemp(path.join(process.cwd(), '.tmp-web-dist-'));
    await mkdir(path.join(dir, 'assets'));
    await writeFile(path.join(dir, 'index.html'), '<!doctype html><title>Rocket Odyssey</title>');
    await writeFile(path.join(dir, 'assets', 'app-abc123.js'), 'console.log("game")');
    app = createApp({ webDistDir: dir });
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('serves the page of the game', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('Rocket Odyssey');
  });

  it('serves built assets with a long cache', async () => {
    const response = await app.request('/assets/app-abc123.js');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('immutable');
    expect(await response.text()).toContain('game');
  });

  it('serves the page of the game for the address of any screen', async () => {
    for (const address of ['/plan/orbit', '/launch', '/debrief']) {
      const response = await app.request(address);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(await response.text()).toContain('Rocket Odyssey');
    }
  });

  it('does not answer a missing file with the page of the game', async () => {
    const response = await app.request('/assets/missing.js');
    expect(response.status).toBe(404);
  });

  it('still answers the health check', async () => {
    const response = await app.request('/health');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('sets security headers', async () => {
    const response = await app.request('/');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
