import {
  formatMass,
  formatUsd,
  getOrbit,
  getRocket,
  RocketIdSchema,
  ROCKETS,
  selectTotals,
  type RocketSpec,
} from '@rocket-odyssey/game-core';
import { RadioGroup } from 'react-aria-components';
import { useDispatch, useGame } from '../app/store.ts';
import { RocketSvg } from '../art/RocketSvg.tsx';
import { Frame } from '../components/Frame.tsx';
import { InfoIcon } from '../components/icons.tsx';
import { LoadMeter } from '../components/LoadMeter.tsx';
import { RadioCard, Tick } from '../components/OptionCard.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

/** Step 4: the launcher. One choice, which sets the launch cost and the performance. */
export function RocketStep() {
  const dispatch = useDispatch();
  const design = useGame((state) => state.design);
  const totals = useGame(selectTotals);
  const rocket = design.rocketId ? getRocket(design.rocketId) : null;
  const orbit = design.orbitId ? getOrbit(design.orbitId) : null;

  return (
    <>
      <StepPanel
        badge={4}
        title="Rocket selection"
        subtitle="Select the launch vehicle for your mission and payload."
      >
        <p className="mb-4 text-lg">
          <span className="label !text-base !text-line-bright">Selected mission params: </span>
          <span className="text-ink">Payload mass </span>
          <span className="value">{formatMass(totals.payloadMassKg)}</span>
          <span className="text-ink">, payload cost </span>
          <span className="value">{formatUsd(totals.payloadCostUsd)}</span>
          <span className="text-ink">, orbit </span>
          <span className="value">{orbit ? orbit.shortName : 'not selected'}</span>
        </p>

        <RadioGroup
          aria-label="Rocket"
          value={design.rocketId}
          onChange={(value) =>
            dispatch({ type: 'rocket/select', rocketId: RocketIdSchema.parse(value) })
          }
          className="grid gap-4 xs:grid-cols-2 md:grid-cols-4"
        >
          {ROCKETS.map((spec) => (
            <RocketCard key={spec.id} rocket={spec} />
          ))}
        </RadioGroup>

        <Frame tone="plain" role="status" className="mt-5 px-5 py-3.5">
          {rocket ? (
            <LoadMeter
              payloadKg={totals.payloadMassKg}
              capacityKg={rocket.maxLeoPayloadKg}
              rocketName={rocket.shortName}
            />
          ) : (
            <p className="text-ink-soft">
              Select a rocket to compare its capacity with the mass of your payload.
            </p>
          )}
        </Frame>

        <details className="mt-4 rounded-lg border border-line-dim bg-space-800/80 px-4 py-3">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold text-line-bright">
            <InfoIcon />
            How to read a rocket
          </summary>
          <dl className="mt-2 space-y-2 text-ink-soft">
            <div>
              <dt className="inline font-bold text-ink">Capacity: </dt>
              <dd className="inline">
                the heaviest payload the structure is rated to carry to low orbit.
              </dd>
            </div>
            <div>
              <dt className="inline font-bold text-ink">Propellant: </dt>
              <dd className="inline">
                the fuel and oxidiser on board. More propellant means more delta-v.
              </dd>
            </div>
            <div>
              <dt className="inline font-bold text-ink">Specific impulse (Isp): </dt>
              <dd className="inline">
                how efficiently the engines use propellant. Higher is better, like kilometres per
                litre.
              </dd>
            </div>
          </dl>
        </details>
      </StepPanel>

      <StepNav current="rocket" />
    </>
  );
}

function RocketCard({ rocket }: { rocket: RocketSpec }) {
  const detailsId = `rocket-${rocket.id}-details`;
  return (
    <RadioCard value={rocket.id} name={rocket.name} describedBy={detailsId} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="display text-lg text-ink sm:text-xl">{rocket.shortName}</p>
          <p className="text-sm text-ink-soft">{rocket.operator}</p>
        </div>
        <Tick />
      </div>
      {/* On a narrow screen the drawing sits beside the figures, not above them. */}
      <div className="mt-2 flex flex-1 gap-3 xs:flex-col xs:gap-0">
        <RocketSvg
          rocketId={rocket.id}
          className="h-40 w-16 flex-none xs:mx-auto xs:my-2 xs:h-44 xs:w-full sm:h-52"
        />
        <div id={detailsId} className="min-w-0 flex-1 xs:mt-auto xs:flex-none">
          <dl className="space-y-0.5">
            <div>
              <dt className="label inline">Capacity: </dt>
              <dd className="inline font-bold text-ink">
                {rocket.capacityLabel}
                <span className="font-medium text-ink-soft">
                  {' '}
                  · {formatMass(rocket.maxLeoPayloadKg)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="label inline">Launch cost: </dt>
              <dd className="value inline">{formatUsd(rocket.costUsd)}</dd>
            </div>
          </dl>
          <dl className="mt-2 space-y-0.5 border-t border-line-dim pt-2 text-sm">
            <div>
              <dt className="inline text-ink-soft">Propellant: </dt>
              <dd className="inline font-semibold text-ink tabular-nums">
                {formatMass(rocket.propellantMassKg)}
              </dd>
            </div>
            <div>
              <dt className="inline text-ink-soft">Dry mass: </dt>
              <dd className="inline font-semibold text-ink tabular-nums">
                {formatMass(rocket.dryMassKg)}
              </dd>
            </div>
            <div>
              <dt className="inline text-ink-soft">Isp: </dt>
              <dd className="inline font-semibold text-ink tabular-nums">{rocket.ispS} s</dd>
            </div>
            <div>
              <dt className="inline text-ink-soft">Height: </dt>
              <dd className="inline font-semibold text-ink tabular-nums">{rocket.heightM} m</dd>
            </div>
          </dl>
        </div>
      </div>
    </RadioCard>
  );
}
