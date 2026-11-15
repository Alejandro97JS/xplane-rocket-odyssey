import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { ActionButton } from '../components/ActionButton.tsx';
import { AppHeader } from '../components/AppHeader.tsx';
import { AlertIcon, ArrowLeftIcon, ReplayIcon } from '../components/icons.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

/**
 * Shown in place of a screen that could not be shown. The usual cause is a
 * new deployment while the game was open: the launch and the debrief are
 * loaded on demand, and the files of the old version are gone. Reloading the
 * page fetches the new version.
 */
export function ErrorScreen() {
  const error = useRouteError();
  useEffect(() => {
    console.error('A screen of the game could not be shown.', error);
  }, [error]);

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <StepPanel
          badge={<AlertIcon />}
          title="Lost contact"
          subtitle="Mission control could not load this screen."
        >
          <p className="max-w-3xl text-lg text-ink-soft">
            The game may have been updated while it was open, or the connection may have dropped.
            Reload the page to continue. The game does not save progress, so the current design will
            start over.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionButton variant="primary" onPress={() => window.location.reload()}>
              <ReplayIcon />
              Reload the game
            </ActionButton>
            <ActionButton variant="secondary" href="/">
              <ArrowLeftIcon />
              Back to the title screen
            </ActionButton>
          </div>
        </StepPanel>
      </main>
    </>
  );
}
