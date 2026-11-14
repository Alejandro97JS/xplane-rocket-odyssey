import { formatUsd } from '@rocket-odyssey/game-core';
import { cx } from '../lib/cx.ts';
import { Frame } from './Frame.tsx';
import { InfinityIcon } from './icons.tsx';

interface ExplorationCostProps {
  /** What the design costs so far. */
  totalUsd: number;
  className?: string;
}

/**
 * Takes the place of the budget meter in free exploration. There is no budget,
 * so nothing is measured against a limit and nothing turns red. The cost is
 * still shown: what a design costs is part of what the player learns, even
 * when it does not stop them.
 */
export function ExplorationCost({ totalUsd, className }: ExplorationCostProps) {
  return (
    <Frame tone="default" className={cx('px-4 py-2.5', className)}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4">
        <div className="min-w-0">
          <p className="label flex items-center gap-1.5 !text-line-bright">
            <InfinityIcon className="flex-none" />
            Free exploration
          </p>
          <p className="text-sm font-semibold text-ink-soft">No budget limit</p>
        </div>
        <p className="text-right leading-tight">
          <span className="block text-sm font-semibold text-ink-soft">Mission cost</span>
          <span className="display block text-2xl text-ink tabular-nums">
            {formatUsd(totalUsd)}
          </span>
        </p>
      </div>
    </Frame>
  );
}
