import {
  formatMass,
  formatUsd,
  PAYLOAD_GROUPS,
  PAYLOADS,
  selectTotals,
  type PayloadSpec,
} from '@rocket-odyssey/game-core';
import { CheckboxGroup } from 'react-aria-components';
import { useDispatch, useGame } from '../app/store.ts';
import { PayloadArt } from '../art/PayloadArt.tsx';
import { Frame } from '../components/Frame.tsx';
import { CoinIcon, UsersIcon, WeightIcon } from '../components/icons.tsx';
import { CheckboxCard, Tick } from '../components/OptionCard.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';
import { cx } from '../lib/cx.ts';

/** Step 2: the payload. Several items can be chosen; their mass and cost add up. */
export function PayloadStep() {
  const dispatch = useDispatch();
  const payloadIds = useGame((state) => state.design.payloadIds);
  const totals = useGame(selectTotals);

  return (
    <>
      <StepPanel
        badge={2}
        title="Equipment & payload"
        subtitle="Select the equipment you want to include in your mission."
      >
        <div className="space-y-6">
          {PAYLOAD_GROUPS.map((group) => {
            const items = PAYLOADS.filter((payload) => payload.group === group.id);
            const headingId = `payload-group-${group.id}`;
            return (
              <section key={group.id} aria-labelledby={headingId}>
                <h2 id={headingId} className="display text-lg text-ink">
                  {group.title}
                </h2>
                <p className="text-ink-soft">{group.description}</p>
                <CheckboxGroup
                  aria-labelledby={headingId}
                  value={payloadIds.filter((id) => items.some((item) => item.id === id))}
                  onChange={(next) => {
                    // The group reports its whole selection; toggle what changed.
                    for (const item of items) {
                      if (next.includes(item.id) !== payloadIds.includes(item.id)) {
                        dispatch({ type: 'payload/toggle', payloadId: item.id });
                      }
                    }
                  }}
                  className={cx(
                    'mt-3 grid gap-4 xs:grid-cols-2',
                    items.length % 3 === 0 || items.length > 4
                      ? 'lg:grid-cols-3'
                      : 'lg:grid-cols-4',
                  )}
                >
                  {items.map((payload) => (
                    <PayloadCard key={payload.id} payload={payload} />
                  ))}
                </CheckboxGroup>
              </section>
            );
          })}
        </div>

        {/* Running totals, as in the mockup. Announced politely when they change. */}
        <Frame
          tone="plain"
          role="status"
          className="mt-6 flex flex-wrap items-center justify-around gap-x-8 gap-y-2 px-5 py-3.5"
        >
          <p className="flex items-center gap-2.5">
            <CoinIcon className="text-gold" width="1.6em" height="1.6em" />
            <span className="label !text-ink">Total cost:</span>
            <span className="value figure text-2xl">{formatUsd(totals.payloadCostUsd)}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <WeightIcon className="text-line-bright" width="1.6em" height="1.6em" />
            <span className="label !text-ink">Total mass:</span>
            <span className="value figure text-2xl">{formatMass(totals.payloadMassKg)}</span>
          </p>
          {totals.crew > 0 && (
            <p className="flex items-center gap-2.5">
              <UsersIcon className="text-line-bright" width="1.6em" height="1.6em" />
              <span className="label !text-ink">Crew:</span>
              <span className="value figure text-2xl">{totals.crew}</span>
            </p>
          )}
        </Frame>
      </StepPanel>

      <StepNav current="payload" />
    </>
  );
}

function PayloadCard({ payload }: { payload: PayloadSpec }) {
  const detailsId = `payload-${payload.id}-details`;
  return (
    <CheckboxCard value={payload.id} name={payload.name} describedBy={detailsId} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-bold leading-snug text-ink">{payload.name}</p>
        <Tick />
      </div>
      <PayloadArt payloadId={payload.id} className="mx-auto my-2 h-28 w-full" />
      <div id={detailsId} className="mt-auto">
        <p className="label">{payload.category}</p>
        <p className="mt-1 text-sm text-ink-soft">{payload.description}</p>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <CoinIcon className="text-gold" />
            <span className="sr-only">Cost:</span>
            <span className="value">{formatUsd(payload.costUsd)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <WeightIcon className="text-line-bright" />
            <span className="sr-only">Mass:</span>
            <span className="font-bold text-ink tabular-nums">{formatMass(payload.massKg)}</span>
          </span>
        </p>
      </div>
    </CheckboxCard>
  );
}
