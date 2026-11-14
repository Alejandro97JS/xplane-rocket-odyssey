import { formatMass, formatPercent } from '@rocket-odyssey/game-core';
import { Label, Meter } from 'react-aria-components';
import { AlertIcon } from './icons.tsx';

interface LoadMeterProps {
  payloadKg: number;
  capacityKg: number;
  rocketName: string;
}

/**
 * How much of the rated capacity of the rocket the payload uses. Mass is one
 * of the resources the player balances, so it is always in view. Going over
 * the capacity is shown with an icon and words, not by colour alone.
 */
export function LoadMeter({ payloadKg, capacityKg, rocketName }: LoadMeterProps) {
  const share = payloadKg / capacityKg;
  const over = share > 1;
  return (
    <Meter
      value={Math.min(payloadKg, capacityKg)}
      minValue={0}
      maxValue={capacityKg}
      valueLabel={`${formatMass(payloadKg)} of ${formatMass(capacityKg)}, ${formatPercent(share)}${over ? ', above the rated capacity' : ''}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <Label className="label !text-ink">Payload load on {rocketName}</Label>
        <p aria-hidden="true" className="tabular-nums">
          <span className={over ? 'font-bold text-warn' : 'value'}>{formatMass(payloadKg)}</span>
          <span className="text-ink-soft"> / {formatMass(capacityKg)} rated</span>
          <span className="text-ink-soft"> ({formatPercent(share)})</span>
        </p>
      </div>
      <div
        className="bar mt-1.5"
        style={
          {
            '--bar-line': over ? 'var(--color-warn)' : 'var(--color-line-dim)',
            '--bar-fill': over ? 'var(--color-warn)' : 'linear-gradient(90deg, #38bdf8, #9be5ff)',
          } as React.CSSProperties
        }
      >
        <div className="bar__fill" style={{ width: `${Math.min(1, share) * 100}%` }} />
      </div>
      {over && (
        <p className="mt-1.5 flex items-center gap-1.5 font-semibold text-warn">
          <AlertIcon />
          Above the rated capacity of the rocket.
        </p>
      )}
    </Meter>
  );
}
