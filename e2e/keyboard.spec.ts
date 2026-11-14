import { expect, test, type Page } from '@playwright/test';

/**
 * Presses Tab until the control with the given accessible name has focus.
 * Fails if the control is never reached, which would mean it cannot be used
 * with the keyboard.
 */
async function tabTo(page: Page, role: Parameters<Page['getByRole']>[0], name: string | RegExp) {
  const target = page.getByRole(role, { name });
  for (let presses = 0; presses < 80; presses++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) {
      return;
    }
  }
  throw new Error(`Could not reach the ${role} "${String(name)}" with the Tab key.`);
}

async function expectHeadingFocused(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name })).toBeFocused();
}

test('the whole level can be played with the keyboard alone', async ({ page }) => {
  await page.goto('/');

  // The first Tab stop is the link that skips to the content.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

  await tabTo(page, 'link', 'Start mission');
  await page.keyboard.press('Enter');
  // Every new screen moves focus to its heading, so it is announced.
  await expectHeadingFocused(page, 'Mission type');

  // Mission: a radio group. Tab enters it, Space selects.
  await tabTo(page, 'radio', /^Mission 1:/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: /^Mission 1:/ })).toBeChecked();
  // Arrow keys move the selection inside the group.
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /^Mission 2:/ })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: /^Mission 1:/ })).toBeChecked();
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Equipment & payload');

  // Payload: checkboxes.
  await tabTo(page, 'checkbox', /CubeSat/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: /CubeSat/ })).toBeChecked();
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Orbit selection');

  await tabTo(page, 'radio', /Low Earth Orbit/);
  await page.keyboard.press('Space');
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Rocket selection');

  await tabTo(page, 'radio', /Electron/);
  await page.keyboard.press('Space');
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Mission summary');

  await tabTo(page, 'button', 'Launch!');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Launch');

  // The animation can be paused and skipped from the keyboard.
  await tabTo(page, 'button', 'Pause');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await tabTo(page, 'link', 'Skip to debrief');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Mission debrief');
  await expect(page.getByRole('heading', { name: 'Mission accomplished' })).toBeVisible();

  await tabTo(page, 'button', 'Next mission');
  await page.keyboard.press('Enter');
  await expectHeadingFocused(page, 'Mission type');
});

test('the over-budget dialog traps focus and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await tabTo(page, 'link', 'Start mission');
  await page.keyboard.press('Enter');
  await tabTo(page, 'radio', /^Mission 1:/);
  await page.keyboard.press('Space');
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');
  await tabTo(page, 'checkbox', /Telecommunications/);
  await page.keyboard.press('Space');
  await tabTo(page, 'button', 'Next');
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('alertdialog', { name: 'Over budget' });
  await expect(dialog.getByRole('button', { name: 'Review my choices' })).toBeFocused();
  // Focus stays inside the dialog.
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Continue anyway' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Review my choices' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  // Focus returns to the button that opened the dialog.
  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
});
