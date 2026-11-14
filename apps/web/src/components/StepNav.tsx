import { selectBudget, selectNeedsBudgetWarning } from '@rocket-odyssey/game-core';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useGame } from '../app/store.ts';
import { getAdjacentSteps, type StepId } from '../app/steps.ts';
import { ActionButton } from './ActionButton.tsx';
import { BudgetWarningDialog } from './BudgetWarningDialog.tsx';
import { Frame } from './Frame.tsx';
import { ArrowLeftIcon, ChevronRightIcon } from './icons.tsx';
import { Stepper } from './Stepper.tsx';

interface StepNavProps {
  current: StepId;
  /**
   * Called before moving forward. Return false to stay on the step, for
   * example to show what is missing.
   */
  canGoNext?: () => boolean;
  /** Replaces the Next button, for the launch button of the summary. */
  nextSlot?: ReactNode;
}

/**
 * The bottom of every planning screen: the stepper, Back and Next. Before
 * moving forward with a design that is over budget it shows the warning the
 * use case asks for.
 */
export function StepNav({ current, canGoNext, nextSlot }: StepNavProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const budget = useGame(selectBudget);
  const needsWarning = useGame(selectNeedsBudgetWarning);
  const [warningOpen, setWarningOpen] = useState(false);
  const { previous, next } = getAdjacentSteps(current);

  const goNext = () => {
    if (canGoNext && !canGoNext()) return;
    if (!next) return;
    if (needsWarning) {
      setWarningOpen(true);
      return;
    }
    void navigate(next.path);
  };

  return (
    <Frame tone="plain" className="mt-5 px-3 py-4 sm:px-6">
      <Stepper current={current} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <ActionButton variant="secondary" href={previous?.path ?? '/'}>
          <ArrowLeftIcon />
          Back
        </ActionButton>
        {nextSlot ??
          (next && (
            <ActionButton variant="primary" onPress={goNext}>
              Next
              <ChevronRightIcon />
            </ActionButton>
          ))}
      </div>
      {budget && next && (
        <BudgetWarningDialog
          isOpen={warningOpen}
          budget={budget}
          onReview={() => setWarningOpen(false)}
          onContinue={() => {
            dispatch({ type: 'budget/dismissWarning' });
            setWarningOpen(false);
            void navigate(next.path);
          }}
        />
      )}
    </Frame>
  );
}
