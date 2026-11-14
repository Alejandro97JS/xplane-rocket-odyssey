import { formatUsd, selectBudget } from '@rocket-odyssey/game-core';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AppHeader } from '../components/AppHeader.tsx';
import { BudgetMeter } from '../components/BudgetMeter.tsx';
import { Frame } from '../components/Frame.tsx';
import { AlertIcon } from '../components/icons.tsx';
import { useGame } from './store.ts';
import { getStep } from './steps.ts';

/**
 * Frame of the five planning screens: the header with the budget of the
 * contract and the over-budget alert. The alert appears the moment the design
 * costs more than the budget, as the use case asks.
 */
export function PlannerLayout() {
  const location = useLocation();
  const levelId = useGame((state) => state.levelId);
  const budget = useGame(selectBudget);

  // Every step after the first one plans a contract, so it needs one.
  if (levelId === null && location.pathname !== getStep('mission').path) {
    return <Navigate to={getStep('mission').path} replace />;
  }

  return (
    <>
      <AppHeader>{budget && <BudgetMeter budget={budget} className="w-full sm:w-80" />}</AppHeader>

      {/* Always in the page so screen readers announce the alert when it appears. */}
      <div role="alert">
        {budget?.over && (
          <Frame tone="bad" className="fade-in mb-4 flex items-start gap-3 px-4 py-3">
            <AlertIcon className="mt-0.5 flex-none text-stop" width="1.5em" height="1.5em" />
            <p className="text-ink">
              <strong className="text-stop">
                Over budget by {formatUsd(-budget.remainingUsd)}.
              </strong>{' '}
              The agency will not fund this launch. Choose a cheaper rocket or a lighter payload.
            </p>
          </Frame>
        )}
      </div>

      <main id="main" className="flex-1">
        <Outlet />
      </main>
    </>
  );
}
