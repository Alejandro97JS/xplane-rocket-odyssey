import {
  formatSpeedKms,
  getOrbit,
  OrbitIdSchema,
  ORBITS,
  type EnergyLabel,
  type OrbitSpec,
} from '@rocket-odyssey/game-core';
import { RadioGroup } from 'react-aria-components';
import { useDispatch, useGame } from '../app/store.ts';
import { OrbitArt } from '../art/OrbitArt.tsx';
import { Frame } from '../components/Frame.tsx';
import { AlertIcon, GaugeIcon, InfoIcon, RocketIcon } from '../components/icons.tsx';
import { RadioCard, Tick } from '../components/OptionCard.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';
import { cx } from '../lib/cx.ts';

/** Colour of the energy label. The word itself carries the meaning. */
const ENERGY_CLASS: Record<EnergyLabel, string> = {
  Low: 'text-go',
  Moderate: 'text-gold-bright',
  High: 'text-warn',
  'Very high': 'text-stop',
};

/** Step 3: the orbit. One choice, which sets the delta-v the rocket must generate. */
export function OrbitStep() {
  const dispatch = useDispatch();
  const orbitId = useGame((state) => state.design.orbitId);
  const selected = orbitId ? getOrbit(orbitId) : null;

  return (
    <>
      <StepPanel badge={3} title="Orbit selection" subtitle="Select the orbit for your mission.">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Preview of the chosen orbit */}
          <Frame
            tone="default"
            className="flex flex-col self-start px-4 py-4 lg:sticky lg:top-4"
            aria-live="polite"
          >
            <h2 className="label !text-line-bright">Orbital path</h2>
            {selected ? (
              <>
                <OrbitArt orbitId={selected.id} detailed className="my-3 h-auto max-h-72 w-full" />
                <p className="display text-xl text-ink">{selected.name}</p>
                <p className="mt-1 text-ink-soft">{selected.description}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-ink-soft">Altitude:</dt>
                  <dd className="value">{selected.altitudeLabel}</dd>
                  <dt className="text-ink-soft">Inclination:</dt>
                  <dd className="value">{selected.inclinationLabel}</dd>
                  <dt className="text-ink-soft">Delta-v required:</dt>
                  <dd className={cx('font-bold', ENERGY_CLASS[selected.energyLabel])}>
                    {selected.energyLabel} ({formatSpeedKms(selected.requiredDeltaVMs)})
                  </dd>
                </dl>
                <p className="mt-2 text-sm text-ink-mute">
                  Diagram not to scale.
                  {selected.radiationHazard &&
                    ' The purple bands are the Van Allen radiation belts.'}
                </p>
              </>
            ) : (
              <p className="my-auto py-10 text-center text-ink-soft">
                Select an orbit to see its path around the Earth.
              </p>
            )}
          </Frame>

          <RadioGroup
            aria-label="Orbit"
            value={orbitId}
            onChange={(value) =>
              dispatch({ type: 'orbit/select', orbitId: OrbitIdSchema.parse(value) })
            }
            className="grid content-start gap-4 xs:grid-cols-2"
          >
            {ORBITS.map((orbit) => (
              <OrbitCard key={orbit.id} orbit={orbit} />
            ))}
          </RadioGroup>
        </div>

        <Frame
          tone="plain"
          role="status"
          className="mt-5 flex flex-wrap items-center justify-around gap-x-8 gap-y-2 px-5 py-3.5"
        >
          <p className="flex items-center gap-2.5">
            <GaugeIcon className="text-gold" width="1.6em" height="1.6em" />
            <span className="label !text-ink">Energy needed:</span>
            <span
              className={cx(
                'display text-2xl',
                selected ? ENERGY_CLASS[selected.energyLabel] : 'text-ink-mute',
              )}
            >
              {selected ? selected.energyLabel : 'No orbit selected'}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <RocketIcon className="text-line-bright" width="1.6em" height="1.6em" />
            <span className="label !text-ink">Total delta-v required:</span>
            <span className="value figure text-2xl">
              {selected ? formatSpeedKms(selected.requiredDeltaVMs) : '—'}
            </span>
          </p>
        </Frame>

        <details className="group mt-4 rounded-lg border border-line-dim bg-space-800/80 px-4 py-3">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold text-line-bright">
            <InfoIcon />
            What is delta-v?
          </summary>
          <div className="mt-2 space-y-2 text-ink-soft">
            <p>
              Delta-v means “change of speed”. To stay in orbit a spacecraft must fly sideways so
              fast that it keeps missing the ground: almost 8 km every second in a low orbit.
            </p>
            <p>
              Each orbit has a price in delta-v, which includes the speed itself and what is lost
              fighting gravity and the air on the way up. Higher orbits cost more. A rocket can
              generate only so much delta-v, and the heavier its payload, the less it has.
            </p>
          </div>
        </details>
      </StepPanel>

      <StepNav current="orbit" />
    </>
  );
}

function OrbitCard({ orbit }: { orbit: OrbitSpec }) {
  const detailsId = `orbit-${orbit.id}-details`;
  return (
    <RadioCard value={orbit.id} name={orbit.name} describedBy={detailsId} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-bold leading-snug text-ink">{orbit.name}</p>
        <Tick />
      </div>
      <OrbitArt orbitId={orbit.id} className="mx-auto my-1.5 h-28 w-full" />
      <div id={detailsId} className="mt-auto space-y-0.5">
        <p>
          <span className="text-ink-soft">Altitude: </span>
          <span className="font-bold text-ink">{orbit.altitudeLabel}</span>
        </p>
        <p>
          <span className="text-ink-soft">Delta-v: </span>
          <span className={cx('font-bold', ENERGY_CLASS[orbit.energyLabel])}>
            {orbit.energyLabel}
          </span>
        </p>
        <p>
          <span className="text-ink-soft">Radiation: </span>
          {orbit.radiationHazard ? (
            <span className="font-bold text-warn">
              <AlertIcon className="mr-1 inline align-[-0.2em]" />
              Crosses the radiation belts
            </span>
          ) : (
            <span className="font-bold text-go">Below the radiation belts</span>
          )}
        </p>
        <p className="pt-1 text-sm text-ink-soft">{orbit.notes}</p>
      </div>
    </RadioCard>
  );
}
