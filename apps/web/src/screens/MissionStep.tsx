import {
  formatUsd,
  FREE_EXPLORATION,
  getLevel,
  LEVELS,
  LevelIdSchema,
  selectHasMission,
  selectIsFreeExploration,
  selectRecord,
  type LevelSpec,
} from '@rocket-odyssey/game-core';
import { useRef, useState } from 'react';
import { RadioGroup } from 'react-aria-components';
import { useDispatch, useGame } from '../app/store.ts';
import { MissionArt } from '../art/MissionArt.tsx';
import { Frame } from '../components/Frame.tsx';
import { AlertIcon, CoinIcon, InfinityIcon, StarIcon, TargetIcon } from '../components/icons.tsx';
import { RadioCard, Tick } from '../components/OptionCard.tsx';
import { StepNav } from '../components/StepNav.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

/** Value of the free exploration card in the radio group. No level has this id. */
const FREE_EXPLORATION_VALUE = 'free_exploration';

/** Cuts the corners of the drawing at the top of a card, like the frame around it. */
const ART_CLIP =
  'relative m-[3px] overflow-hidden [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%,0_10px)]';

/**
 * Step 1: the level selector. Each level is a contract with a statement and a
 * budget. The last card is free exploration, with no contract and no budget.
 */
export function MissionStep() {
  const dispatch = useDispatch();
  const levelId = useGame((state) => state.levelId);
  const freeExploration = useGame(selectIsFreeExploration);
  const hasMission = useGame(selectHasMission);
  const [showError, setShowError] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const selected = !freeExploration && levelId ? getLevel(levelId) : null;

  return (
    <>
      <StepPanel
        badge={1}
        title="Mission type"
        subtitle="Fly a contract for a client, or explore freely with no budget."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* The group lays its cards out in the grid of its parent. */}
          <RadioGroup
            aria-label="Mission"
            value={freeExploration ? FREE_EXPLORATION_VALUE : levelId}
            onChange={(value) => {
              setShowError(false);
              if (value === FREE_EXPLORATION_VALUE) {
                dispatch({ type: 'mode/select', mode: 'free_exploration' });
              } else {
                dispatch({ type: 'level/select', levelId: LevelIdSchema.parse(value) });
              }
            }}
            className="contents"
          >
            {LEVELS.map((level) => (
              <MissionCard key={level.id} level={level} />
            ))}
            <FreeExplorationCard />
          </RadioGroup>

          {/* The briefing of the choice, across the whole grid. */}
          <Frame tone="plain" className="px-4 py-4 sm:col-span-2 lg:col-span-3" aria-live="polite">
            <h2 className="label flex items-center gap-2 !text-line-bright">
              <TargetIcon />
              Mission briefing
            </h2>
            {freeExploration ? (
              <>
                <p className="display mt-2 text-xl text-ink">{FREE_EXPLORATION.title}</p>
                <p className="mt-2 max-w-3xl text-ink-soft">{FREE_EXPLORATION.statement}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-2 text-ink">
                  <InfinityIcon className="text-gold" />
                  Budget: <strong className="value">no limit</strong>
                </p>
                <p className="mt-1 text-ink-soft">{FREE_EXPLORATION.noScore}</p>
              </>
            ) : selected ? (
              <>
                <p className="display mt-2 text-xl text-ink">{selected.title}</p>
                <p className="mt-2 max-w-3xl text-ink-soft">{selected.statement}</p>
                <p className="mt-3 flex items-center gap-2 text-ink">
                  <CoinIcon className="text-gold" />
                  Maximum budget:{' '}
                  <strong className="value">{formatUsd(selected.maxBudgetUsd)}</strong>
                </p>
              </>
            ) : (
              <p className="mt-2 max-w-3xl text-ink-soft">
                Each mission is a contract with a client, a goal and a maximum budget. There is more
                than one way to fulfil it. Or choose free exploration to fly anything you want,
                whatever it costs. Select a card to read its briefing.
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
          if (hasMission) return true;
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
  const recordId = `mission-${level.id}-record`;
  return (
    <RadioCard
      value={level.id}
      name={`Mission ${level.number}: ${level.title}`}
      // The record is part of the description, so screen readers hear it too.
      describedBy={record.completed ? `${detailsId} ${recordId}` : detailsId}
    >
      <div className={ART_CLIP}>
        <MissionArt scene={level.id} className="block aspect-[2/1] w-full" />
        <div className="absolute right-2.5 top-2.5">
          <Tick round />
        </div>
        {record.completed && (
          <p
            id={recordId}
            className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-space-950/85 px-2.5 py-1 text-sm font-bold text-go"
          >
            <StarIcon filled width="1em" height="1em" />
            Completed · best {record.bestScore}
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

/** The sixth card: no client, no contract and no budget. */
function FreeExplorationCard() {
  const detailsId = 'mission-free-exploration-details';
  return (
    <RadioCard
      value={FREE_EXPLORATION_VALUE}
      name={`${FREE_EXPLORATION.title}, no contract`}
      describedBy={detailsId}
    >
      <div className={ART_CLIP}>
        <MissionArt scene="free_exploration" className="block aspect-[2/1] w-full" />
        <div className="absolute right-2.5 top-2.5">
          <Tick round />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <p className="label !text-gold-bright">No contract</p>
        <p className="display mt-0.5 text-xl text-ink">{FREE_EXPLORATION.title}</p>
        <div id={detailsId} className="flex flex-1 flex-col">
          <p className="mt-1.5 text-ink-soft">{FREE_EXPLORATION.goal}</p>
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-ink">
            <InfinityIcon className="text-gold" />
            <span className="value">No budget limit</span>
          </p>
        </div>
      </div>
    </RadioCard>
  );
}
