import { formatMissionClock, type EventTone, type FlightEvent } from '@rocket-odyssey/game-core';
import { useEffect, useRef, type ReactNode } from 'react';
import { AlertIcon, CheckIcon, CrossIcon, InfoIcon } from '../components/icons.tsx';
import { cx } from '../lib/cx.ts';

export const TONE_CLASS: Record<EventTone, string> = {
  info: 'text-line-bright',
  success: 'text-go',
  warning: 'text-warn',
  danger: 'text-stop',
};

/** Every tone has its own icon, so the tone is never told by colour alone. */
export const TONE_ICON: Record<EventTone, ReactNode> = {
  info: <InfoIcon />,
  success: <CheckIcon />,
  warning: <AlertIcon />,
  danger: <CrossIcon />,
};

const TONE_WORD: Record<EventTone, string> = {
  info: '',
  success: 'Success: ',
  warning: 'Warning: ',
  danger: 'Failure: ',
};

interface EventLogProps {
  /** The events that have happened so far, oldest first. */
  events: readonly FlightEvent[];
}

/**
 * Mission events as they happen. The list is a log region, so screen readers
 * announce each new event without moving focus. It can be scrolled with the
 * keyboard.
 */
export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = events.length;

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [count]);

  return (
    <section aria-labelledby="events-heading">
      <h2 id="events-heading" className="label !text-line-bright">
        Mission events
      </h2>
      <div
        ref={scrollRef}
        // The list scrolls, so it must be reachable with the keyboard to be scrolled.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="log"
        aria-labelledby="events-heading"
        className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line-dim bg-space-900/80 px-3 py-2"
      >
        {count === 0 ? (
          <p className="py-2 text-ink-soft">Waiting for the countdown.</p>
        ) : (
          <ol className="space-y-2.5">
            {events.map((event, index) => (
              <EventItem key={`${event.id}-${index}`} event={event} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function EventItem({ event, extra }: { event: FlightEvent; extra?: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-3">
      <span className={cx('mt-0.5 text-lg', TONE_CLASS[event.tone])} aria-hidden="true">
        {TONE_ICON[event.tone]}
      </span>
      <p>
        <span className="readout mr-2 text-ink-mute">{formatMissionClock(event.t)}</span>
        <strong className={cx('font-bold', TONE_CLASS[event.tone])}>
          <span className="sr-only">{TONE_WORD[event.tone]}</span>
          {event.title}
          {/[.!?]$/.test(event.title) ? '' : '.'}
        </strong>{' '}
        <span className="text-ink-soft">{event.detail}</span>
        {extra}
      </p>
    </li>
  );
}
