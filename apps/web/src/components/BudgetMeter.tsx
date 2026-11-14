import { formatUsd, type BudgetStatus } from '@rocket-odyssey/game-core';
import { Label, Meter } from 'react-aria-components';
import { cx } from '../lib/cx.ts';
import { Frame } from './Frame.tsx';
import { AlertIcon } from './icons.tsx';

interface BudgetMeterProps {
  budget: BudgetStatus;
  className?: string;
}

/**
 * Budget still available for the contract, as in the header of the mockups.
 * The state is never shown by colour alone: an over-budget design also gets
 * an icon and the words "Over budget".
 */
export function BudgetMeter({ budget, className }: BudgetMeterProps) {
  const available = Math.max(0, budget.remainingUsd);
  const share = budget.maxUsd === 0 ? 0 : available / budget.maxUsd;
  const low = !budget.over && share < 0.15;
  const valueText = budget.over
    ? `Over budget by ${formatUsd(-budget.remainingUsd)}. Budget: ${formatUsd(budget.maxUsd)}.`
    : `${formatUsd(budget.remainingUsd)} available of ${formatUsd(budget.maxUsd)}.`;

  return (
    <Frame tone={budget.over ? 'bad' : 'default'} className={cx('px-4 py-2.5', className)}>
      <Meter
        value={available}
        minValue={0}
        maxValue={budget.maxUsd}
        valueLabel={valueText}
        className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1"
      >
        <Label className="label flex items-center gap-1.5 !text-ink-soft">
          {budget.over ? (
            <>
              <AlertIcon className="text-stop" />
              <span className="text-stop">Over budget</span>
            </>
          ) : (
            'Budget available'
          )}
        </Label>
        <p className="row-span-2 text-right leading-tight" aria-hidden="true">
          <span
            className={cx(
              'display block text-2xl tabular-nums',
              budget.over ? 'text-stop' : 'text-ink',
            )}
          >
            {formatUsd(budget.remainingUsd)}
          </span>
          <span className="text-sm font-semibold text-ink-soft tabular-nums">
            / {formatUsd(budget.maxUsd)}
          </span>
        </p>
        <div
          className="bar w-full min-w-28"
          style={
            {
              '--bar-line': budget.over ? 'var(--color-stop)' : 'var(--color-go)',
              '--bar-fill': budget.over
                ? 'var(--color-stop)'
                : low
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #22c55e, #4ade80)',
            } as React.CSSProperties
          }
        >
          <div className="bar__fill" style={{ width: `${budget.over ? 100 : share * 100}%` }} />
        </div>
      </Meter>
    </Frame>
  );
}
