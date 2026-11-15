import { expect, test } from '@playwright/test';
import {
  chooseCheckbox,
  chooseRadio,
  expectNoAccessibilityViolations,
  flyToDebrief,
  launch,
  LEVEL_1_WIN,
  next,
  planMission,
  startExploring,
  startPlanning,
} from './helpers.ts';

/**
 * Automated WCAG 2.1 A and AA checks on every screen. Entrance animations are
 * switched off so that colours are measured at rest.
 */
test.describe('automated accessibility checks', () => {
  test.use({ reducedMotion: 'reduce' });

  test('title screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket Odyssey' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('how to play', async ({ page }) => {
    await page.goto('/how-to-play');
    await expect(page.getByRole('heading', { level: 1, name: 'How to play' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('every planning step, empty and filled in', async ({ page }) => {
    await startPlanning(page);
    await expectNoAccessibilityViolations(page);
    await chooseRadio(page, /^Mission 5:/);
    await expectNoAccessibilityViolations(page);

    await next(page);
    await expectNoAccessibilityViolations(page);
    await chooseCheckbox(page, /Docking & Power/);
    await chooseCheckbox(page, /Classic Orbital Capsule/);
    await expectNoAccessibilityViolations(page);

    await next(page);
    await expectNoAccessibilityViolations(page);
    await chooseRadio(page, /Medium Earth Orbit/);
    await page.getByText('What is delta-v?').click();
    await expectNoAccessibilityViolations(page);

    await next(page);
    await expectNoAccessibilityViolations(page);
    await chooseRadio(page, /Soyuz/);
    await page.getByText('How to read a rocket').click();
    // Soyuz cannot carry this payload: the load meter shows the warning state.
    await expect(page.getByText('Above the rated capacity of the rocket.')).toBeVisible();
    await expectNoAccessibilityViolations(page);

    await next(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('summary with nothing chosen yet', async ({ page }) => {
    await startPlanning(page);
    await chooseRadio(page, /^Mission 2:/);
    await page
      .getByRole('navigation', { name: 'Planning steps' })
      .getByRole('link', { name: /Summary/ })
      .click();
    await page.getByRole('button', { name: 'Launch!' }).click();
    await expect(page.getByText('Still to choose:')).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('over-budget alert and warning dialog', async ({ page }) => {
    await startPlanning(page);
    await chooseRadio(page, /^Mission 1:/);
    await next(page);
    await chooseCheckbox(page, /Telecommunications/);
    await expect(page.getByRole('alert').filter({ hasText: 'Over budget' })).toBeVisible();
    await expectNoAccessibilityViolations(page);

    await next(page);
    await expect(page.getByRole('alertdialog', { name: 'Over budget' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('launch as a list of steps', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);
    await launch(page);
    await expect(page.getByRole('heading', { name: 'Flight, step by step' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('debrief after a success', async ({ page }) => {
    await flyToDebrief(page, LEVEL_1_WIN);
    await expect(page.getByRole('heading', { name: 'Mission accomplished' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('debrief after a failure', async ({ page }) => {
    await flyToDebrief(page, {
      mission: 3,
      payloads: ['Scientific Micro-Satellite'],
      orbit: 'Low Earth Orbit',
      rocket: 'Falcon 9',
    });
    await expect(page.getByRole('heading', { name: 'Contract not fulfilled' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('free exploration, from the first step to the debrief', async ({ page }) => {
    await startExploring(page);
    await expectNoAccessibilityViolations(page);
    await chooseCheckbox(page, /Orbital Observatory/);
    await chooseCheckbox(page, /Modern Commercial Capsule/);

    const steps = page.getByRole('navigation', { name: 'Planning steps' });
    await steps.getByRole('link', { name: /Mission/ }).click();
    await expect(page.getByRole('radio', { name: /Free exploration/ })).toBeChecked();
    await expectNoAccessibilityViolations(page);

    await steps.getByRole('link', { name: /Orbit/ }).click();
    await chooseRadio(page, /Low Earth Orbit/);
    await next(page);
    await chooseRadio(page, /Falcon 9/);
    await next(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();
    await expectNoAccessibilityViolations(page);

    await launch(page);
    await page.getByRole('link', { name: /Skip to debrief|View mission debrief/ }).click();
    await expect(page.getByText('Flight successful')).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('page not found', async ({ page }) => {
    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { level: 1, name: 'Lost in space' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});

test.describe('launch animation', () => {
  test('animated launch, paused', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);
    await launch(page);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});

test.describe('small screens', () => {
  // WCAG 1.4.10 Reflow: content must fit a 320 CSS pixel wide screen without
  // scrolling sideways.
  test.use({ viewport: { width: 320, height: 720 }, reducedMotion: 'reduce' });

  const expectNoSidewaysScroll = async (page: import('@playwright/test').Page) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  };

  test('every screen fits a 320 pixel wide screen', async ({ page }) => {
    await page.goto('/');
    await expectNoSidewaysScroll(page);

    await page.getByRole('link', { name: 'Start mission' }).click();
    await chooseRadio(page, /^Mission 1:/);
    await expectNoSidewaysScroll(page);
    await next(page);
    await chooseCheckbox(page, /CubeSat/);
    await expectNoSidewaysScroll(page);
    await next(page);
    await chooseRadio(page, /Low Earth Orbit/);
    await expectNoSidewaysScroll(page);
    await next(page);
    await chooseRadio(page, /Electron/);
    await expectNoSidewaysScroll(page);
    await next(page);
    await expectNoSidewaysScroll(page);

    await launch(page);
    await expectNoSidewaysScroll(page);
    await page.getByRole('link', { name: 'View mission debrief' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission debrief' })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoAccessibilityViolations(page);
  });

  test('how to play fits a 320 pixel wide screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'How to play' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'How to play' })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoAccessibilityViolations(page);
  });

  test('free exploration fits a 320 pixel wide screen', async ({ page }) => {
    await startExploring(page);
    // Expensive choices make the cost in the header as wide as it gets.
    await chooseCheckbox(page, /Heavy Shielded/);
    await chooseCheckbox(page, /Habitat/);
    await expectNoSidewaysScroll(page);
    await page
      .getByRole('navigation', { name: 'Planning steps' })
      .getByRole('link', { name: /Mission/ })
      .click();
    await expect(page.getByRole('radio', { name: /Free exploration/ })).toBeChecked();
    await expectNoSidewaysScroll(page);
    await expectNoAccessibilityViolations(page);
  });
});
