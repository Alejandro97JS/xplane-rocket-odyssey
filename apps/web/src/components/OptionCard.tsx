import type { ReactNode } from 'react';
import { Checkbox, Radio } from 'react-aria-components';
import { cx } from '../lib/cx.ts';
import { FrameBackground } from './Frame.tsx';
import { CheckIcon } from './icons.tsx';

interface OptionCardProps {
  value: string;
  /** Read by screen readers as the name of the option. Must match the visible title. */
  name: string;
  /** Id of the element that describes the option: price, mass, notes. */
  describedBy?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A card the player picks one of. It is a real radio button, so arrow keys
 * move between the cards of a group and the selection is announced.
 */
export function RadioCard({ value, name, describedBy, className, children }: OptionCardProps) {
  return (
    <Radio
      value={value}
      aria-label={name}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      className={cx('frame option', className)}
    >
      <FrameBackground />
      {children}
    </Radio>
  );
}

/** A card the player can pick several of. It is a real checkbox. */
export function CheckboxCard({ value, name, describedBy, className, children }: OptionCardProps) {
  return (
    <Checkbox
      value={value}
      aria-label={name}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      className={cx('frame option', className)}
    >
      <FrameBackground />
      {children}
    </Checkbox>
  );
}

/** The box in the corner of a card that fills with a tick when the card is selected. */
export function Tick({ round = false }: { round?: boolean }) {
  return (
    <span aria-hidden="true" className={cx('tick', round && 'tick--round')}>
      <CheckIcon width="1.1em" height="1.1em" />
    </span>
  );
}
