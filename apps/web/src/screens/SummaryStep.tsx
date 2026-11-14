import {
  formatList,
  formatMass,
  formatPercent,
  formatSpeedKms,
  formatUsd,
  FREE_EXPLORATION,
  getLevel,
  getOrbit,
  getPayload,
  getRocket,
  lowerFirst,
  selectBudget,
  selectIsFreeExploration,
  selectReadiness,
  selectTotals,
} from '@rocket-odyssey/game-core';
import { useRef, useState, type ReactNode } from 'react';
import { Label, Link, ProgressBar } from 'react-aria-components';
import { useNavigate } from 'react-router';
import { useDispatch, useGame } from '../app/store.ts';
import { getStep, type StepId } from '../app/steps.ts';
import { RocketSvg } from '../art/RocketSvg.tsx';
import { ActionButton } from '../components/ActionButton.tsx';
import { Frame } from '../components/Frame.tsx';
import {
  AlertIcon,
  BoxIcon,
  InfinityIcon,
  OrbitIcon,
  RocketIcon,
  TargetIcon,
} from '../components/icons.tsx';
import { LoadMeter } from '../components/LoadMeter.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';
import { cx } from '../lib/cx.ts';

/** Step 5: the whole design on one screen, the readiness check and the launch button. */
export function SummaryStep() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const state = useGame((s) => s);
  const totals = selectTotals(state);
  const budget = selectBudget(state);
  const readiness = selectReadiness(state);
  const freeExploration = selectIsFreeExploration(state);
  const [showMissing, setShowMissing] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Free exploration keeps the contract chosen before, but does not fly it.
  const level = !freeExploration && state.levelId ? getLevel(state.levelId) : null;
  const payloads = state.design.payloadIds.map(getPayload);
  const orbit = state.design.orbitId ? getOrbit(state.design.orbitId) : null;
  const rocket = state.design.rocketId ? getRocket(state.design.rocketId) : null;
  const missing = readiness.items.filter((item) => !item.done);

  const launch = () => {
    if (!readiness.ready) {
      setShowMissing(true);
      statusRef.current?.focus();
      return;
    }
    dispatch({ type: 'mission/launch' });
    void navigate('/launch');
  };

  return (
    <>
      <StepPanel
        badge={5}
        title="Mission summary"
        subtitle="Final mission summary and confirmation."
      >
        <p className="mb-4 text-lg">
          <span className="label !text-base !text-line-bright">Selected mission params: </span>
          <span className="text-ink">Total cost </span>
          <span className={budget?.over ? 'font-bold text-stop' : 'value'}>
            {formatUsd(totals.totalCostUsd)}
          </span>
          <span className="text-ink">, payload mass </span>
          <span className="value">{formatMass(totals.payloadMassKg)}</span>
        </p>

        <Frame tone="default" className="px-4 py-2 sm:px-6">
          <ul className="divide-y divide-line-dim/60">
            <SummaryRow icon={<TargetIcon />} label="Mission type" step="mission">
              {freeExploration ? (
                <>
                  <span className="font-bold text-ink">{FREE_EXPLORATION.title}</span>
                  <span className="block text-ink-soft">
                    No contract and no budget limit. {FREE_EXPLORATION.goal}
                  </span>
                </>
              ) : level ? (
                <>
                  <span className="font-bold text-ink">{level.title}</span>
                  <span className="block text-ink-soft">{level.goal}</span>
                </>
              ) : (
                <Missing>No mission selected</Missing>
              )}
            </SummaryRow>

            <SummaryRow icon={<BoxIcon />} label="Equipment" step="payload">
              {payloads.length > 0 ? (
                <ul className="space-y-0.5">
                  {payloads.map((payload) => (
                    <li key={payload.id}>
                      <span className="font-bold text-ink">{payload.name}</span>
                      <span className="text-ink-soft tabular-nums">
                        {' '}
                        · {formatMass(payload.massKg)} · {formatUsd(payload.costUsd)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Missing>No equipment selected</Missing>
              )}
            </SummaryRow>

            <SummaryRow icon={<OrbitIcon />} label="Orbit" step="orbit">
              {orbit ? (
                <>
                  <span className="font-bold text-ink">{orbit.name}</span>
                  <span className="block text-ink-soft">
                    {orbit.altitudeLabel} · delta-v required{' '}
                    <span className="value">{formatSpeedKms(orbit.requiredDeltaVMs)}</span>
                  </span>
                </>
              ) : (
                <Missing>No orbit selected</Missing>
              )}
            </SummaryRow>

            <SummaryRow
              icon={
                rocket ? <RocketSvg rocketId={rocket.id} className="h-16 w-8" /> : <RocketIcon />
              }
              label="Rocket"
              step="rocket"
            >
              {rocket ? (
                <>
                  <span className="font-bold text-ink">{rocket.name}</span>
                  <span className="block text-ink-soft">
                    Capacity <span className="value">{rocket.capacityLabel}</span> (
                    {formatMass(rocket.maxLeoPayloadKg)}) · launch cost{' '}
                    <span className="value">{formatUsd(rocket.costUsd)}</span> · Isp {rocket.ispS} s
                  </span>
                </>
              ) : (
                <Missing>No rocket selected</Missing>
              )}
            </SummaryRow>
          </ul>
        </Frame>

        {/* Resources the player balances: money and mass. */}
        <section aria-labelledby="resources-heading" className="mt-5">
          <h2 id="resources-heading" className="label !text-line-bright">
            Resources
          </h2>
          <div className="mt-2 grid gap-4 md:grid-cols-2">
            <Frame tone={budget?.over ? 'bad' : 'plain'} className="px-4 py-3.5">
              {freeExploration && (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="label !text-ink">Mission cost</p>
                    <p className="value tabular-nums">{formatUsd(totals.totalCostUsd)}</p>
                  </div>
                  <p className="mt-1.5 text-ink-soft tabular-nums">
                    Payload {formatUsd(totals.payloadCostUsd)} · rocket{' '}
                    {formatUsd(totals.rocketCostUsd)}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-semibold text-line-bright">
                    <InfinityIcon className="flex-none" />
                    No budget limit in free exploration.
                  </p>
                </>
              )}
              {budget && (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="label !text-ink">Budget used</p>
                    <p className="tabular-nums">
                      <span className={budget.over ? 'font-bold text-stop' : 'value'}>
                        {formatUsd(budget.spentUsd)}
                      </span>
                      <span className="text-ink-soft"> / {formatUsd(budget.maxUsd)}</span>
                      <span className="text-ink-soft">
                        {' '}
                        ({formatPercent(budget.spentUsd / budget.maxUsd)})
                      </span>
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="bar mt-1.5"
                    style={
                      {
                        '--bar-line': budget.over ? 'var(--color-stop)' : 'var(--color-line-dim)',
                        '--bar-fill': budget.over
                          ? 'var(--color-stop)'
                          : 'linear-gradient(90deg, #22c55e, #4ade80)',
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className="bar__fill"
                      style={{ width: `${Math.min(1, budget.spentUsd / budget.maxUsd) * 100}%` }}
                    />
                  </div>
                  {budget.over && (
                    <p className="mt-1.5 flex items-center gap-1.5 font-semibold text-stop">
                      <AlertIcon />
                      Over budget by {formatUsd(-budget.remainingUsd)}.
                    </p>
                  )}
                </>
              )}
            </Frame>
            <Frame tone="plain" className="px-4 py-3.5">
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
          </div>
        </section>

        {/* Readiness, as in the mockup. */}
        <section aria-labelledby="readiness-heading" className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="readiness-heading" className="display text-xl text-ink">
              Mission readiness
            </h2>
            <p
              ref={statusRef}
              tabIndex={-1}
              role="status"
              className="display text-xl text-ink outline-none"
            >
              Status:{' '}
              <span className={readiness.ready ? 'text-go' : 'text-warn'}>
                {readiness.ready ? 'Ready for launch' : 'Not ready'}
              </span>
            </p>
          </div>
          <ProgressBar
            value={readiness.progress * 100}
            valueLabel={formatPercent(readiness.progress)}
            className="mt-2 flex items-center gap-3"
          >
            <Label className="sr-only">Mission readiness</Label>
            <div
              className="bar h-5 flex-1"
              style={
                {
                  '--bar-line': 'var(--color-line)',
                  '--bar-fill': 'linear-gradient(90deg, #2563eb, #38bdf8)',
                } as React.CSSProperties
              }
            >
              <div className="bar__fill" style={{ width: `${readiness.progress * 100}%` }} />
            </div>
            <span aria-hidden="true" className="readout w-14 text-right text-lg text-ink">
              {formatPercent(readiness.progress)}
            </span>
          </ProgressBar>
          <p className="mt-2 text-center text-lg text-ink">
            Final checks:{' '}
            <span className={cx('font-bold', readiness.ready ? 'text-go' : 'text-warn')}>
              {readiness.ready ? 'Complete' : 'Incomplete'}
            </span>
          </p>
          {missing.length > 0 && (
            <p
              className={cx(
                'mt-1 flex flex-wrap items-center justify-center gap-x-1.5 text-center',
                showMissing ? 'font-semibold text-warn' : 'text-ink-soft',
              )}
            >
              {showMissing && <AlertIcon />}
              Still to choose:
              {missing.map((item, index) => (
                <span key={item.id}>
                  <Link
                    href={getStep(item.id).path}
                    className="font-bold text-line-bright underline underline-offset-4"
                  >
                    {item.label.toLowerCase()}
                  </Link>
                  {index < missing.length - 1 ? ',' : '.'}
                </span>
              ))}
            </p>
          )}
          {readiness.ready && budget?.over && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center font-semibold text-stop">
              <AlertIcon />
              The design is complete, but it is over budget. The launch will be scrubbed.
            </p>
          )}
          {readiness.ready && !budget?.over && rocket && orbit && (
            <p className="mt-1 text-center text-ink-soft">
              {rocket.shortName} will carry the{' '}
              {formatList(payloads.map((payload) => lowerFirst(payload.shortName)))} to{' '}
              {lowerFirst(orbit.shortName)}. Will it get there? There is one way to find out.
            </p>
          )}
        </section>
      </StepPanel>

      <StepNav
        current="summary"
        nextSlot={
          <div className="ml-auto flex flex-col items-end gap-1">
            <p id="launch-caption" className="text-sm font-semibold text-go">
              Press to initiate mission
            </p>
            <ActionButton
              variant="launch"
              onPress={launch}
              aria-describedby="launch-caption"
              className="!min-h-14 !px-5 !text-xl sm:!px-8 sm:!text-2xl"
            >
              <RocketIcon />
              Launch!
            </ActionButton>
          </div>
        }
      />
    </>
  );
}

interface SummaryRowProps {
  icon: ReactNode;
  label: string;
  step: StepId;
  children: ReactNode;
}

function SummaryRow({ icon, label, step, children }: SummaryRowProps) {
  return (
    <li className="grid grid-cols-[2rem_1fr] items-center gap-x-3 py-3 sm:grid-cols-[2.5rem_1fr_auto]">
      <span
        aria-hidden="true"
        className="row-span-2 grid place-items-center self-start pt-1 text-2xl text-line-bright sm:row-span-1 sm:self-center sm:pt-0"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="label">{label}</h2>
        <div className="mt-0.5">{children}</div>
      </div>
      <Link
        href={getStep(step).path}
        aria-label={`Change ${label.toLowerCase()}`}
        className="col-start-2 grid min-h-11 min-w-11 place-items-center justify-self-start rounded-lg font-bold text-line-bright underline underline-offset-4 sm:col-start-3 sm:justify-self-auto sm:px-2"
      >
        Change
      </Link>
    </li>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-warn">{children}</span>;
}
