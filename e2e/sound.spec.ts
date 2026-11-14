import { expect, test, type Page } from '@playwright/test';
import { launch, LEVEL_1_WIN, planMission } from './helpers.ts';

interface HeardTune {
  /** The screen where the tune started. */
  path: string;
  /** The wave shapes of its instruments. */
  waves: string[];
}

/**
 * Records every tune of the result music without listening to it. Only the
 * result music has the echo of a hall, so the creation of a convolver marks
 * the start of a tune; the oscillators started on the same audio context tell
 * which tune it is. Square waves are only in the failure jingle and sawtooth
 * waves, the brass, only in the success fanfare.
 */
async function recordTunes(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Marked = { __tune?: { path: string; waves: string[] } };
    const tunes: { path: string; waves: string[] }[] = [];
    (window as unknown as { __tunes: typeof tunes }).__tunes = tunes;
    const createConvolver = AudioContext.prototype.createConvolver;
    AudioContext.prototype.createConvolver = function (this: AudioContext & Marked) {
      const tune = { path: location.pathname, waves: [] };
      tunes.push(tune);
      this.__tune = tune;
      return createConvolver.call(this);
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (this: OscillatorNode, when?: number) {
      const tune = (this.context as BaseAudioContext & Marked).__tune;
      if (tune && !tune.waves.includes(this.type)) tune.waves.push(this.type);
      start.call(this, when);
    };
  });
}

function heardTunes(page: Page): Promise<HeardTune[]> {
  return page.evaluate(() => (window as unknown as { __tunes: HeardTune[] }).__tunes);
}

test.describe('sound', () => {
  test('the end of the animation announces a failure with the losing jingle, once', async ({
    page,
  }) => {
    await recordTunes(page);
    // Over budget, so the launch is scrubbed and its animation is short.
    await planMission(page, { ...LEVEL_1_WIN, payloads: ['Telecommunications'] });
    await launch(page);
    expect(await heardTunes(page)).toEqual([]);

    const debrief = page.getByRole('link', { name: 'View mission debrief' });
    await expect(debrief).toBeFocused({ timeout: 20_000 });
    await expect.poll(() => heardTunes(page)).toHaveLength(1);
    const [tune] = await heardTunes(page);
    expect(tune?.path).toBe('/launch');
    expect(tune?.waves).toContain('square');
    expect(tune?.waves).not.toContain('sawtooth');

    // The debrief does not play it again.
    await debrief.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission debrief' })).toBeVisible();
    await page.waitForTimeout(500);
    expect(await heardTunes(page)).toHaveLength(1);
  });

  test('a player who skips the animation hears the fanfare on the debrief', async ({ page }) => {
    await recordTunes(page);
    await planMission(page, LEVEL_1_WIN);
    await launch(page);
    await page.getByRole('link', { name: 'Skip to debrief' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission debrief' })).toBeVisible();

    await expect.poll(() => heardTunes(page)).toHaveLength(1);
    const [tune] = await heardTunes(page);
    expect(tune?.path).toBe('/debrief');
    expect(tune?.waves).toContain('sawtooth');
    expect(tune?.waves).not.toContain('square');
  });

  test('one sound button for the launch and the debrief, and it is remembered', async ({
    page,
  }) => {
    await planMission(page, LEVEL_1_WIN);
    await launch(page);
    await page.getByRole('link', { name: 'Skip to debrief' }).click();

    // The music plays by itself, so the debrief has its own button, near the top.
    await page.getByRole('banner').getByRole('button', { name: 'Mute sound' }).click();
    await expect(page.getByRole('button', { name: 'Turn sound on' })).toBeVisible();

    await page.getByRole('link', { name: 'Watch the launch again' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Launch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Turn sound on' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('rocket-odyssey:sound-muted'))).toBe(
      'true',
    );
  });
});
