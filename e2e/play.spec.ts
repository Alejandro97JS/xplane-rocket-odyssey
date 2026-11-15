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

test.describe('use case 1: launch', () => {
  test('a design that fits the contract reaches orbit and is scored', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);

    // The summary shows the whole design and that it is ready.
    await expect(page.getByText('Ready for launch')).toBeVisible();
    await expect(page.getByText('Final checks: Complete')).toBeVisible();

    await launch(page);
    // The canvas is an image for assistive technology, with telemetry as text beside it.
    await expect(page.getByRole('img', { name: /Animation of the launch/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Telemetry' })).toBeVisible();
    await expect(page.getByRole('log', { name: 'Mission events' })).toContainText('Terminal count');

    await page.getByRole('link', { name: 'Skip to debrief' }).click();
    await expect(page.getByRole('heading', { name: 'Mission accomplished' })).toBeVisible();
    await expect(page.getByText('Score: 100 / 100')).toBeVisible();
    await expect(page.getByText('Best possible design for this contract')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Improve the score' })).toHaveCount(0);
    await expect(page.getByText('Budget: passed')).toBeVisible();
    await expect(page.getByText('Contract objective: passed')).toBeVisible();

    // The next mission starts from a clean design.
    await page.getByRole('button', { name: 'Next mission' }).click();
    await expect(page.getByRole('radio', { name: /^Mission 2:/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: /^Mission 1:/ })).not.toBeChecked();
    await expect(page.getByText('Completed · best 100')).toBeVisible();
    // Screen readers hear the record with the card.
    await expect(page.getByRole('radio', { name: /^Mission 1:/ })).toHaveAccessibleDescription(
      /Completed · best 100/,
    );
    await next(page);
    await expect(page.getByRole('checkbox', { name: /CubeSat/ })).not.toBeChecked();
  });

  test('a rocket short of delta-v fails and gets the hint of the use case', async ({ page }) => {
    await flyToDebrief(page, {
      mission: 3,
      payloads: ['Telecommunications'],
      orbit: 'Geostationary',
      rocket: 'Soyuz',
    });

    await expect(page.getByText('Mission failed')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Stranded short of the target orbit' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'The engine ran out of fuel before reaching the required orbital velocity. Try a lower orbit or a rocket with higher specific impulse (Isp) or more fuel.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Delta-v: failed')).toBeVisible();
    await expect(page.getByText('this ended the mission')).toBeVisible();

    // The way back to the choice that can fix it, with the design kept.
    await page.getByRole('link', { name: 'Fix the design' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket selection' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Soyuz/ })).toBeChecked();
  });

  test('an over-budget design is warned about at once and scrubbed at launch', async ({ page }) => {
    await startPlanning(page);
    await chooseRadio(page, /^Mission 1:/);
    await next(page);

    // The telecom satellite alone costs more than the budget of mission 1.
    await chooseCheckbox(page, /Telecommunications/);
    const alert = page.getByRole('alert').filter({ hasText: 'Over budget by $40M' });
    await expect(alert).toBeVisible();
    await expect(page.getByRole('meter', { name: /Over budget/ })).toBeVisible();

    // Moving forward shows the warning first. Reviewing keeps the player on the step.
    await next(page);
    const dialog = page.getByRole('alertdialog', { name: 'Over budget' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Review my choices' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Review my choices' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Equipment & payload' }),
    ).toBeVisible();

    // The player may go on anyway, and is not asked again for the same cost.
    await next(page);
    await dialog.getByRole('button', { name: 'Continue anyway' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Orbit selection' })).toBeVisible();
    await chooseRadio(page, /Low Earth Orbit/);
    await next(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket selection' })).toBeVisible();
    await chooseRadio(page, /Electron/);
    await next(page);
    // The rocket changed the cost, so the warning shows again.
    await dialog.getByRole('button', { name: 'Continue anyway' }).click();
    await expect(page.getByText('The launch will be scrubbed')).toBeVisible();

    // The launch plays to its end: the countdown is stopped and the rocket never leaves the pad.
    await launch(page);
    const log = page.getByRole('log', { name: 'Mission events' });
    await expect(log).toContainText('Launch scrubbed', { timeout: 20_000 });
    const debrief = page.getByRole('link', { name: 'View mission debrief' });
    await expect(debrief).toBeFocused({ timeout: 20_000 });
    await expect(
      page.getByRole('status').filter({ hasText: 'Launch scrubbed: over budget' }),
    ).toBeVisible();
    await debrief.click();
    await expect(
      page.getByText("You've exceeded the agency's budget!", { exact: false }),
    ).toBeVisible();
  });

  test('the animation can be paused and resumed', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);
    await launch(page);
    const clock = page.getByRole('region', { name: 'Telemetry' }).getByText(/^T[+-]\d\d:\d\d/);

    await page.getByRole('button', { name: 'Pause' }).click();
    const frozen = await clock.textContent();
    await page.waitForTimeout(1_500);
    await expect(clock).toHaveText(frozen ?? '');

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(clock).not.toHaveText(frozen ?? '', { timeout: 5_000 });
  });

  test('the player moves freely between the steps once a mission is chosen', async ({ page }) => {
    // Without a mission there is nothing to plan: the other steps lead back to the first.
    await page.goto('/plan/rocket');
    await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
    const steps = page.getByRole('navigation', { name: 'Planning steps' });
    await expect(steps.getByRole('link', { name: /Summary/ })).toBeDisabled();

    // Next without a mission explains what is missing instead of moving on.
    await next(page);
    await expect(page.getByText('Choose a mission to continue.')).toBeVisible();

    await chooseRadio(page, /^Mission 4:/);
    await steps.getByRole('link', { name: /Rocket/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket selection' })).toBeVisible();
    await steps.getByRole('link', { name: /Summary/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();

    // An incomplete design cannot be launched, and the summary says what is missing.
    await page.getByRole('button', { name: 'Launch!' }).click();
    await expect(page).toHaveURL(/\/plan\/summary$/);
    await expect(page.getByText('Not ready')).toBeVisible();
    await expect(page.getByText('Still to choose:')).toBeVisible();
    await page.getByRole('link', { name: 'orbit', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Orbit selection' })).toBeVisible();

    // The back button of the browser works, because every screen has its own address.
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();
  });

  test('an unshielded crew in a high orbit is a radiation failure', async ({ page }) => {
    await flyToDebrief(page, {
      mission: 4,
      payloads: ['Classic Orbital Capsule'],
      orbit: 'Geostationary',
      rocket: 'Falcon 9',
    });
    await expect(page.getByRole('heading', { name: 'Crew exposed to radiation' })).toBeVisible();
    await expect(page.getByText('Crew radiation: failed')).toBeVisible();
    await expect(page.getByText('Medical alert!', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Fix the design' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Orbit selection' })).toBeVisible();
  });
});

test.describe('errors', () => {
  test('a screen that cannot be loaded offers to reload the game', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);
    // As after a new deployment while the game is open: the old files of the
    // launch screen, which is loaded on demand, are gone.
    await page.route(/\/assets\/LaunchScreen-[^/]*\.js$/, (route) =>
      route.fulfill({ status: 404, body: '' }),
    );
    await page.getByRole('button', { name: 'Launch!' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Lost contact' })).toBeFocused();
    await expect(page).toHaveTitle('Lost contact · Rocket Odyssey');
    await expect(page.getByRole('button', { name: 'Reload the game' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('XPlane team');
    await expectNoAccessibilityViolations(page);

    await page.getByRole('link', { name: 'Back to the title screen', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket Odyssey' })).toBeVisible();
  });
});

test.describe('free exploration', () => {
  test('is chosen in the first step, not on the title screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Start mission' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Free exploration/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Free exploration/ })).toHaveCount(0);

    await startExploring(page);
    // Back on the title screen, the way in leaves the mode as the player chose it.
    await page.getByRole('link', { name: /Back to the title screen/ }).click();
    await page.getByRole('link', { name: 'Continue planning' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Free exploration/ })).toBeChecked();
  });

  test('any design can be chosen whatever it costs, and only physics judges it', async ({
    page,
  }) => {
    await startExploring(page);
    // The header shows the cost, with no budget to measure it against.
    const header = page.getByRole('banner');
    await expect(header.getByText('Free exploration')).toBeVisible();
    await expect(header.getByText('No budget limit')).toBeVisible();
    await expect(page.getByRole('meter')).toHaveCount(0);
    // Step 1 is done: free exploration is the mission.
    const steps = page.getByRole('navigation', { name: 'Planning steps' });
    await expect(steps.getByRole('link', { name: /^Mission.*done$/ })).toBeVisible();

    // A whole crewed station: $780M of payload, more than any contract can pay.
    for (const payload of [
      'Heavy Shielded',
      'Docking & Power',
      'Scientific Laboratory',
      'Habitat',
    ]) {
      await chooseCheckbox(page, new RegExp(payload));
    }
    await expect(header.getByText('$780M')).toBeVisible();
    await expect(page.getByText(/Over budget/)).toHaveCount(0);

    // No warning stops the player on the way.
    await next(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Orbit selection' })).toBeVisible();
    await chooseRadio(page, /Low Earth Orbit/);
    await next(page);
    await chooseRadio(page, /Saturn V/);
    await next(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Mission summary' })).toBeVisible();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(header.getByText('$1,980M')).toBeVisible();
    await expect(page.getByText('No budget limit in free exploration.')).toBeVisible();
    await expect(page.getByText('Ready for launch')).toBeVisible();

    await launch(page);
    await page.getByRole('link', { name: 'Skip to debrief' }).click();
    await expect(page.getByRole('heading', { name: 'Mission accomplished' })).toBeVisible();
    await expect(page.getByText('Flight successful')).toBeVisible();
    // No score, and the debrief says why.
    await expect(page.getByText('Free exploration flights are not scored.')).toBeVisible();
    await expect(page.getByText(/^Score:/)).toHaveCount(0);
    // Only the rules of physics are checked.
    await expect(page.getByText('Payload mass: passed')).toBeVisible();
    await expect(page.getByText('Delta-v: passed')).toBeVisible();
    await expect(page.getByText('Crew radiation: passed')).toBeVisible();
    await expect(page.getByText(/^Budget:/)).toHaveCount(0);
    await expect(page.getByText(/^Contract objective:/)).toHaveCount(0);
    await expect(page.getByText('(no budget limit)')).toBeVisible();

    // A contract is one press away, and the free flight counted for none of them.
    await page.getByRole('button', { name: 'Fly a contract' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission type' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Free exploration/ })).not.toBeChecked();
    await expect(page.getByText(/Completed ·/)).toHaveCount(0);
  });

  test('a design that physics does not allow still fails', async ({ page }) => {
    await startExploring(page);
    await chooseCheckbox(page, /Telecommunications/);
    await next(page);
    await chooseRadio(page, /Low Earth Orbit/);
    await next(page);
    await chooseRadio(page, /Electron/);
    await next(page);
    await launch(page);
    await page.getByRole('link', { name: 'Skip to debrief' }).click();

    await expect(page.getByText('Flight failed')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Vehicle lost at Max-Q: payload too heavy' }),
    ).toBeVisible();
    await expect(page.getByText('Payload mass: failed')).toBeVisible();
    await page.getByRole('link', { name: 'Fix the design' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Rocket selection' })).toBeVisible();
    await expect(page.getByRole('banner').getByText('No budget limit')).toBeVisible();
  });

  test('the same design moves between a contract and free exploration', async ({ page }) => {
    await startPlanning(page);
    await chooseRadio(page, /^Mission 1:/);
    await next(page);
    await chooseCheckbox(page, /Telecommunications/);
    const overBudget = page.getByRole('alert').filter({ hasText: 'Over budget by $40M' });
    await expect(overBudget).toBeVisible();

    // Free exploration is the last card of the first step.
    const steps = page.getByRole('navigation', { name: 'Planning steps' });
    await steps.getByRole('link', { name: /Mission/ }).click();
    await chooseRadio(page, /Free exploration/);
    await expect(page.getByText('Budget: no limit')).toBeVisible();
    await next(page);
    await expect(page.getByRole('checkbox', { name: /Telecommunications/ })).toBeChecked();
    await expect(overBudget).toHaveCount(0);

    // Back to the contract: the budget applies again.
    await steps.getByRole('link', { name: /Mission/ }).click();
    await chooseRadio(page, /^Mission 1:/);
    await expect(overBudget).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the flight is shown as a list of steps instead of an animation', async ({ page }) => {
    await planMission(page, LEVEL_1_WIN);
    await launch(page);

    await expect(page.getByRole('heading', { name: 'Flight, step by step' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Animation of the launch/ })).toHaveCount(0);
    await expect(page.getByText('Orbit insertion.')).toBeVisible();
    await expect(page.getByText('Mission accomplished.')).toBeVisible();

    // The animation is still one press away for players who want it.
    await page.getByRole('button', { name: 'Play the animation' }).click();
    await expect(page.getByRole('img', { name: /Animation of the launch/ })).toBeVisible();
  });
});

test.describe('credits banner', () => {
  test('every screen ends with who made the game and the challenge it takes part in', async ({
    page,
  }) => {
    const expectBanner = async () => {
      const banner = page.getByRole('contentinfo');
      await expect(banner).toHaveCount(1);
      await expect(banner).toContainText('Made by the XPlane team');
      await expect(banner).toContainText(
        'Taking part in the NASA Space Apps Challenge, Salamanca (Spain) local event',
      );
    };

    await page.goto('/');
    await expectBanner();

    await planMission(page, LEVEL_1_WIN);
    await expectBanner();

    await launch(page);
    await expectBanner();

    await page.getByRole('link', { name: 'Skip to debrief' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mission debrief' })).toBeVisible();
    await expectBanner();

    await page.goto('/nowhere');
    await expectBanner();
  });
});
