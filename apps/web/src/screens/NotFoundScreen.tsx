import { ActionButton } from '../components/ActionButton.tsx';
import { AppHeader } from '../components/AppHeader.tsx';
import { ArrowLeftIcon } from '../components/icons.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

/** Shown for an address that is not a screen of the game. */
export function NotFoundScreen() {
  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <StepPanel badge="?" title="Lost in space" subtitle="This page is not on any of our star charts.">
          <p className="mb-6 text-lg text-ink-soft">
            The address may be wrong, or the page may have moved. Mission control can take you back.
          </p>
          <ActionButton variant="primary" href="/">
            <ArrowLeftIcon />
            Back to the title screen
          </ActionButton>
        </StepPanel>
      </main>
    </>
  );
}
