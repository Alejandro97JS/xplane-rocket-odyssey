import { selectHasMission } from '@rocket-odyssey/game-core';
import { Link } from 'react-aria-components';
import { useGame } from '../app/store.ts';
import { isStepDone, STEPS, type StepId } from '../app/steps.ts';
import { cx } from '../lib/cx.ts';
import { CheckIcon } from './icons.tsx';

interface StepperProps {
  current: StepId;
}

/**
 * The row of numbered steps at the bottom of every planning screen. The
 * player can jump to any step at any time. Before a mission is chosen, or
 * free exploration, the other steps have nothing to plan, so they are shown
 * but cannot be opened.
 */
export function Stepper({ current }: StepperProps) {
  const state = useGame((s) => s);
  const hasMission = selectHasMission(state);

  return (
    <nav aria-label="Planning steps">
      <div className="relative">
        {/* The line that joins the steps */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[10%] right-[10%] top-[1.375rem] h-0.5 bg-line-dim"
        />
        <ol className="relative flex items-start justify-between gap-1">
          {STEPS.map((step) => {
            const isCurrent = step.id === current;
            const done = isStepDone(state, step.id);
            const locked = !hasMission && step.id !== 'mission';
            return (
              <li key={step.id} className="relative flex min-w-0 flex-1 justify-center">
                <Link
                  href={step.path}
                  isDisabled={locked}
                  {...(isCurrent ? { 'aria-current': 'step' as const } : {})}
                  className={cx(
                    'group flex min-h-11 min-w-11 flex-col items-center gap-1.5 rounded-lg px-1 pb-1 text-center no-underline',
                    locked ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                >
                  <span
                    className={cx(
                      'grid size-11 place-items-center rounded-full border-2 text-lg font-bold transition-colors',
                      isCurrent
                        ? 'border-line-bright bg-space-600 text-ink shadow-[0_0_14px_2px_rgb(56_189_248/0.7)]'
                        : 'border-line-dim bg-space-800 text-ink-soft group-data-[hovered]:border-line',
                    )}
                  >
                    {done && !isCurrent ? <CheckIcon className="text-go" /> : step.number}
                  </span>
                  <span
                    className={cx(
                      'text-sm leading-tight max-sm:sr-only',
                      isCurrent ? 'font-bold text-line-bright' : 'font-medium text-ink-soft',
                    )}
                  >
                    {step.label}
                    <span className="sr-only">
                      {done ? ', done' : ''}
                      {locked ? ', choose a mission first' : ''}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
