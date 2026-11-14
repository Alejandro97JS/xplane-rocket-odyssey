import { formatInteger, type Flight } from '@rocket-odyssey/game-core';
import { EventItem } from './EventLog.tsx';
import { telemetryAt } from './playback.ts';

interface StepTimelineProps {
  flight: Flight;
}

/**
 * The flight as a list of steps, with no animation. It is what players who
 * ask their system to reduce motion see instead of the canvas, and the
 * fallback when the canvas cannot be created.
 */
export function StepTimeline({ flight }: StepTimelineProps) {
  return (
    <section aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="label !text-line-bright">
        Flight, step by step
      </h2>
      <ol className="mt-3 space-y-3.5 border-l-2 border-line-dim pl-4">
        {flight.events.map((event, index) => {
          const telemetry = telemetryAt(flight, event.t);
          return (
            <EventItem
              key={`${event.id}-${index}`}
              event={event}
              extra={
                event.t >= 0 ? (
                  <span className="mt-0.5 block text-sm text-ink-mute">
                    Altitude {formatInteger(telemetry.altitudeKm)} km · speed{' '}
                    {formatInteger(telemetry.velocityMs)} m/s · stage 1 propellant{' '}
                    {formatInteger(telemetry.fuel[0] * 100)}% · stage 2 propellant{' '}
                    {formatInteger(telemetry.fuel[1] * 100)}%
                  </span>
                ) : null
              }
            />
          );
        })}
      </ol>
    </section>
  );
}
