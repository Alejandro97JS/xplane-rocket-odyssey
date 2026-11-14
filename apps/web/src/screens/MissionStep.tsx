import {
  formatUsd,
  getLevel,
  LEVELS,
  LevelIdSchema,
  selectRecord,
  type LevelSpec,
} from '@rocket-odyssey/game-core';
import { useRef, useState } from 'react';
import { RadioGroup } from 'react-aria-components';
import { useDispatch, useGame } from '../app/store.ts';
import { MissionArt } from '../art/MissionArt.tsx';
import { Frame } from '../components/Frame.tsx';
import { AlertIcon, CoinIcon, StarIcon, TargetIcon } from '../components/icons.tsx';
import { RadioCard, Tick } from '../components/OptionCard.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

/** Step 1: the level selector. Each level is a contract with a statement and a budget. */
export function MissionStep() {
  const dispatch = useDispatch();
  const levelId = useGame((state) => state.levelId);
  const [showError, setShowError] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const selected = levelId ? getLevel(levelId) : null;

  return (
    <>
      <StepPanel
        badge={1}
        title="Mission type"
        subtitle="Choose the contract your agency will fly."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* The group lays its cards out in the grid of its parent, next to the briefing. */}
          <RadioGroup
            aria-label="Mission"
          value={levelId}
          onChange={(value) => {
            setShowError(false);
            dispatch({ type: 'level/select', levelId: LevelIdSchema.parse(value) });
          }}
            className="contents"
          >
            {LEVELS.map((level) => (
              <MissionCard key={level.id} level={level} />
            ))}
          </RadioGroup>

          {/* The sixth cell of the grid: the briefing of the chosen mission. */}
          <Frame tone="plain" className="flex flex-col px-4 py-4" aria-live="polite">
            <h2 className="label flex items-center gap-2 !text-line-bright">
              <TargetIcon />
              Mission briefing
            </h2>
            {selected ? (
              <>
                <p className="display mt-2 text-xl text-ink">{selected.title}</p>
                <p className="mt-2 text-ink-soft">{selected.statement}</p>
                <p className="mt-auto flex items-center gap-2 pt-3 text-ink">
                  <CoinIcon className="text-gold" />
                  Maximum budget: <strong className="value">{formatUsd(selected.maxBudgetUsd)}</strong>
                </p>
              </>
            ) : (
              <p className="mt-2 text-ink-soft">
                Each mission is a contract with a client, a goal and a maximum budget. There is more
                than one way to fulfil it. Select a mission to read its briefing.
              </p>
            )}
          </Frame>
        </div>

        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mt-4 flex min-h-7 items-center gap-2 font-semibold text-warn outline-none"
        >
          {showError && (
            <>
              <AlertIcon />
              Choose a mission to continue.
            </>
          )}
        </p>
      </StepPanel>

      <StepNav
        current="mission"
        canGoNext={() => {
          if (levelId !== null) return true;
          setShowError(true);
          errorRef.current?.focus();
          return false;
        }}
      />
    </>
  );
}

function MissionCard({ level }: { level: LevelSpec }) {
  const record = useGame((state) => selectRecord(state, level.id));
  const detailsId = `mission-${level.id}-details`;
  return (
    <RadioCard value={level.id} name={`Mission ${level.number}: ${level.title}`} describedBy={detailsId}>
      <div className="relative m-[3px] overflow-hidden [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%,0_10px)]">
        <MissionArt levelId={level.id} className="block aspect-[2/1] w-full" />
        <div className="absolute right-2.5 top-2.5">
          <Tick round />
        </div>
        {record.completed && (
          <p className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-space-950/85 px-2.5 py-1 text-sm font-bold text-go">
            <StarIcon filled width="1em" height="1em" />
            Completed · {record.bestScore}
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <p className="label !text-line-bright">Mission {level.number}</p>
        <p className="display mt-0.5 text-xl text-ink">{level.title}</p>
        <div id={detailsId} className="flex flex-1 flex-col">
          <p className="mt-1.5 text-ink-soft">{level.goal}</p>
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-ink">
            <CoinIcon className="text-gold" />
            <span className="sr-only">Maximum budget:</span>
            <span className="value">{formatUsd(level.maxBudgetUsd)}</span>
            <span className="text-ink-soft">budget</span>
          </p>
        </div>
      </div>
    </RadioCard>
  );
}
