import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export interface DesignChoice {
  /** Number of the mission, 1 to 5. */
  mission: number;
  /** Part of the name of each payload to select. */
  payloads: string[];
  /** Part of the name of the orbit. */
  orbit: string;
  /** Part of the name of the rocket. */
  rocket: string;
}

export const LEVEL_1_WIN: DesignChoice = {
  mission: 1,
  payloads: ['CubeSat'],
  orbit: 'Low Earth Orbit',
  rocket: 'Electron',
};

/**
 * The option cards are real radio buttons and checkboxes inside a label that
 * carries the drawing. A player clicks the card, so the tests do the same.
 */
export async function chooseRadio(page: Page, name: string | RegExp): Promise<void> {
  const input = page.getByRole('radio', { name });
  await page.locator('label', { has: input }).click();
  await expect(input).toBeChecked();
}

export async function chooseCheckbox(page: Page, name: string | RegExp): Promise<void> {
  const input = page.getByRole('checkbox', { name });
  await page.locator('label', { has: input }).click();
  await expect(input).toBeChecked();
}

export async function next(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Next' }).click();
}

/** Opens the game and goes to the first planning step. */
export async function startPlanning(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start mission' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
}

/** Makes every choice of a design and stops on the summary. */
export async function planMission(page: Page, design: DesignChoice): Promise<void> {
  await startPlanning(page);
  await chooseRadio(page, new RegExp(`^Mission ${design.mission}:`));
  await next(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Equipment & payload' })).toBeVisible();
  for (const payload of design.payloads) await chooseCheckbox(page, new RegExp(payload));
  await next(page);
  await dismissBudgetWarning(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Orbit selection' })).toBeVisible();
  await chooseRadio(page, new RegExp(design.orbit));
  await next(page);
  await dismissBudgetWarning(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Rocket selection' })).toBeVisible();
  await chooseRadio(page, new RegExp(design.rocket));
  await next(page);
  await dismissBudgetWarning(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();
}

/** Goes on when the over-budget warning is in the way. */
async function dismissBudgetWarning(page: Page): Promise<void> {
  const proceed = page.getByRole('button', { name: 'Continue anyway' });
  if (await proceed.isVisible().catch(() => false)) await proceed.click();
}

export async function launch(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Launch!' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Launch' })).toBeVisible();
}

/** Plans, launches and skips the animation. */
export async function flyToDebrief(page: Page, design: DesignChoice): Promise<void> {
  await planMission(page, design);
  await launch(page);
  await page.getByRole('link', { name: /Skip to debrief|View mission debrief/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mission debrief' })).toBeVisible();
}

/**
 * Runs the automated WCAG 2.1 A and AA checks of axe on the current screen.
 * They find only part of the problems; the keyboard test covers another part.
 */
export async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    help: violation.help,
    elements: violation.nodes.map((node) => node.target.join(' ')),
  }));
  expect(violations).toEqual([]);
}
