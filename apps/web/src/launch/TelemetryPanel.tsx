import {
  formatInteger,
  formatMissionClock,
  formatPercent,
  type FlightPhase,
  type RocketSpec,
  type TelemetrySample,
} from '@rocket-odyssey/game-core';
import { Frame } from '../components/Frame.tsx';

interface TelemetryPanelProps {
  /** Mission time, in seconds. */
  t: number;
  telemetry: TelemetrySample;
  phase: FlightPhase | null;
  rocket: RocketSpec;
}

function formatLiveAltitude(km: number): string {
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${formatInteger(km)} km`;
}

/**
 * Telemetry as text, next to the canvas: mission clock, phase, altitude,
 * speed and the propellant of both stages. It changes several times per
 * second, so it is not a live region; the mission events are announced
 * instead.
 */
export function TelemetryPanel({ t, telemetry, phase, rocket }: TelemetryPanelProps) {
  const [stage1, stage2] = rocket.stages;
  return (
    <Frame as="section" tone="default" aria-labelledby="telemetry-heading" className="px-4 py-4">
      <h2 id="telemetry-heading" className="label !text-line-bright">
        Telemetry
      </h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <dt className="label">Mission clock</dt>
          <dd className="readout text-3xl text-ink">{formatMissionClock(t)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="label">Phase</dt>
          <dd className="text-lg font-bold text-gold-bright">{phase?.label ?? '—'}</dd>
        </div>
        <div>
          <dt className="label">Altitude</dt>
          <dd className="readout text-xl text-ink">{formatLiveAltitude(telemetry.altitudeKm)}</dd>
        </div>
        <div>
          <dt className="label">Speed</dt>
          <dd className="readout text-xl text-ink">{formatInteger(telemetry.velocityMs)} m/s</dd>
        </div>
        <FuelGauge
          label="Stage 1 propellant"
          name={stage1.name}
          level={telemetry.fuel[0]}
          burning={telemetry.burning === 1}
        />
        <FuelGauge
          label="Stage 2 propellant"
          name={stage2.name}
          level={telemetry.fuel[1]}
          burning={telemetry.burning === 2}
        />
      </dl>
    </Frame>
  );
}

interface FuelGaugeProps {
  label: string;
  name: string;
  level: number;
  burning: boolean;
}

function FuelGauge({ label, name, level, burning }: FuelGaugeProps) {
  const empty = level <= 0.0005;
  return (
    <div className="col-span-2">
      <dt className="label flex items-baseline justify-between gap-2">
        <span>{label}</span>
        <span className="normal-case tracking-normal text-ink-mute">{name}</span>
      </dt>
      <dd>
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="bar flex-1"
            style={
              {
                '--bar-line': empty ? 'var(--color-stop)' : 'var(--color-line-dim)',
                '--bar-fill':
                  level < 0.15
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #38bdf8, #9be5ff)',
              } as React.CSSProperties
            }
          >
            {/* No transition: the level follows the clock of the animation. */}
            <div className="bar__fill !transition-none" style={{ width: `${level * 100}%` }} />
          </div>
          <span className="readout w-12 text-right text-ink">{formatPercent(level)}</span>
        </div>
        <span className="text-sm text-ink-soft">
          {empty ? 'Empty' : burning ? 'Engines firing' : 'Engines off'}
        </span>
      </dd>
    </div>
  );
}
