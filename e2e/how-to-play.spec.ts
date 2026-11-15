import { expect, test } from '@playwright/test';
import { chooseRadio, startPlanning } from './helpers.ts';

const SECTIONS = [
  'Your goal',
  'A mission, step by step',
  'What decides the flight',
  'The score',
  'Free exploration',
  'Ideas worth knowing',
  'Controls and accessibility',
  'Tips for your first launch',
];

test.describe('how to play', () => {
  test('opens from the title screen and explains the game', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'How to play' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'How to play' })).toBeVisible();
    await expect(page).toHaveURL(/\/how-to-play$/);
    await expect(page).toHaveTitle('How to play · Rocket Odyssey');

    for (const section of SECTIONS) {
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible();
    }
    // The five planning steps carry the names of the stepper.
    for (const step of ['Mission', 'Equipment & Payload', 'Orbit', 'Rocket', 'Summary']) {
      await expect(page.getByText(step, { exact: true })).toBeVisible();
    }

    // The contents list every section, and each entry leads to its section.
    const contents = page.getByRole('navigation', { name: 'On this page' });
    await expect(contents.getByRole('link')).toHaveCount(SECTIONS.length);
    await contents.getByRole('link', { name: 'Score', exact: true }).click();
    await expect(page).toHaveURL(/#score$/);
    const score = page.getByRole('heading', { level: 2, name: 'The score' });
    await expect(score).toBeInViewport();
    await expect(score).toBeFocused();
  });

  test('leads to the first step without choosing anything for the player', async ({ page }) => {
    await page.goto('/how-to-play');
    await page.getByRole('link', { name: 'Start mission', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);

    await page.goto('/how-to-play');
    await page.getByRole('link', { name: 'Back to the title screen', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket Odyssey' })).toBeVisible();
  });

  test('leaves a mission already chosen as it was', async ({ page }) => {
    await startPlanning(page);
    await chooseRadio(page, /Free exploration/);
    await page.getByRole('link', { name: /Back to the title screen/ }).click();

    await page.getByRole('link', { name: 'How to play' }).click();
    await page.getByRole('link', { name: 'Continue planning' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Free exploration/ })).toBeChecked();
  });
});
