import {
  formatMass,
  formatPercent,
  formatUsd,
  FREE_EXPLORATION,
  getNextLevel,
  selectRecord,
  type Check,
  type Score,
  type SimulationResult,
} from '@rocket-odyssey/game-core';
import { Navigate, useNavigate } from 'react-router';
import { useDispatch, useGame, useLaunchResult } from '../app/store.ts';
import { getStep, type StepId } from '../app/steps.ts';
import { useResultMusic } from '../audio/useResultMusic.ts';
import { ActionButton } from '../components/ActionButton.tsx';
import { AppHeader } from '../components/AppHeader.tsx';
import { DeltaVChart } from '../components/DeltaVChart.tsx';
import { Frame } from '../components/Frame.tsx';
import {
  CheckIcon,
  ChevronRightIcon,
  CrossIcon,
  InfinityIcon,
  LightbulbIcon,
  ReplayIcon,
  StarIcon,
} from '../components/icons.tsx';
import { SoundToggle } from '../components/SoundToggle.tsx';
import { StepPanel } from '../components/StepPanel.tsx';
import { cx } from '../lib/cx.ts';

/** The step where the player can fix each kind of failure. */
function stepToFix(result: SimulationResult): StepId {
  switch (result.failure) {
    case 'budget_exceeded':
    case 'payload_overweight':
    case 'delta_v_shortage':
      return 'rocket';
    case 'radiation':
      return 'orbit';
    case 'objective_unfulfilled':
      return (result.evaluation.objective?.missingHardware.length ?? 0) > 0 ? 'payload' : 'orbit';
    case null:
      return 'summary';
  }
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

/**
 * The debrief: what happened, why, and what to try next. Everything here is
 * ordinary text built from the same data the animation played back.
 *
 * A flight in free exploration has no contract: it gets no score and no
 * record, the flight review lists only the rules of physics, and the cost is
 * shown without a budget.
 *
 * The music of the result plays here if the player did not hear it at the
 * end of the animation, and the sound button is at the top of the page.
 */
export function DebriefScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const launch = useGame((state) => state.launch);
  const result = useLaunchResult();
  const record = useGame((state) => (launch?.levelId ? selectRecord(state, launch.levelId) : null));
  useResultMusic(launch?.sequence, result?.outcome);
  if (!launch || !result) return <Navigate to="/plan/mission" replace />;

  const { evaluation, report, score } = result;
  const { level, rocket, orbit, budget } = evaluation;
  const success = result.outcome === 'success';
  const nextLevel = level ? getNextLevel(level.id) : null;
  const ruleCount = NUMBER_WORDS[evaluation.checks.length] ?? String(evaluation.checks.length);

  let verdict: string;
  if (level === null) verdict = success ? 'Flight successful' : 'Flight failed';
  else verdict = success ? 'Contract fulfilled' : 'Mission failed';

  return (
    <>
      <AppHeader tagline="Mission debrief">
        <SoundToggle />
      </AppHeader>
      <main id="main" className="flex-1">
        <StepPanel
          badge={success ? <CheckIcon /> : <CrossIcon />}
          title="Mission debrief"
          subtitle={
            level
              ? `Mission ${level.number}: ${level.title} · attempt ${record?.attempts ?? 1}`
              : `${FREE_EXPLORATION.title} · no contract, no budget limit`
          }
        >
          {/* The verdict */}
          <Frame tone={success ? 'good' : 'bad'} className="px-5 py-5 sm:px-7">
            <p className={cx('label !text-base', success ? '!text-go' : '!text-stop')}>{verdict}</p>
            <h2 className="display mt-1 text-2xl text-ink sm:text-3xl">{report.headline}</h2>
            <p className="mt-2 text-lg text-ink">{report.summary}</p>
            {score && <ScoreSummary score={score} best={record?.bestScore ?? null} />}
            {success && level === null && (
              <p className="mt-4 flex items-center gap-2 border-t border-go/40 pt-4 text-ink-soft">
                <InfinityIcon className="flex-none text-line-bright" />
                {FREE_EXPLORATION.noScore}
              </p>
            )}
          </Frame>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <section aria-labelledby="why-heading">
                <h2 id="why-heading" className="display text-xl text-line-bright">
                  {success ? 'Why it worked' : 'Why it failed'}
                </h2>
                <div className="mt-2 space-y-2.5 text-ink-soft">
                  {report.explanation.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              {report.hints.length > 0 && (
                <Frame
                  as="section"
                  tone="warn"
                  aria-labelledby="hint-heading"
                  className="px-4 py-4"
                >
                  <h2
                    id="hint-heading"
                    className="display flex items-center gap-2 text-xl text-warn"
                  >
                    <LightbulbIcon />
                    {report.hints.length > 1 ? 'Hints' : 'Hint'}
                  </h2>
                  <div className="mt-2 space-y-2 text-lg text-ink">
                    {report.hints.map((hint) => (
                      <p key={hint}>{hint}</p>
                    ))}
                  </div>
                </Frame>
              )}
            </div>

            <div className="space-y-5">
              <section aria-labelledby="review-heading">
                <h2 id="review-heading" className="display text-xl text-line-bright">
                  Flight review
                </h2>
                <p className="text-ink-soft">
                  The {ruleCount} rules every {level ? 'mission' : 'flight'} must pass, in the order
                  they matter in flight.
                  {level === null &&
                    ' Free exploration has no budget and no contract, so only the rules of physics apply.'}
                </p>
                <ol className="mt-3 space-y-3">
                  {evaluation.checks.map((check) => (
                    <CheckItem
                      key={check.id}
                      check={check}
                      decisive={check.failureCode === result.failure}
                    />
                  ))}
                </ol>
              </section>
            </div>
          </div>

          {/* The numbers behind the result */}
          <section aria-labelledby="numbers-heading" className="mt-6">
            <h2 id="numbers-heading" className="display text-xl text-line-bright">
              The numbers
            </h2>
            <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Frame tone="plain" className="px-4 py-4">
                <DeltaVChart deltaV={evaluation.deltaV} orbitName={orbit.shortName} />
              </Frame>
              <Frame tone="plain" className="px-4 py-4">
                <h3 className="label !text-line-bright">Resources</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <dt className="text-ink-soft">Mission cost:</dt>
                  <dd className="font-bold text-ink tabular-nums">
                    {formatUsd(evaluation.totals.totalCostUsd)}{' '}
                    <span className="font-medium text-ink-soft">
                      {budget
                        ? `of ${formatUsd(budget.maxUsd)} (${formatPercent(budget.totalUsd / budget.maxUsd)})`
                        : '(no budget limit)'}
                    </span>
                  </dd>
                  <dt className="text-ink-soft">Payload mass:</dt>
                  <dd className="font-bold text-ink tabular-nums">
                    {formatMass(evaluation.mass.payloadKg)}{' '}
                    <span className="font-medium text-ink-soft">
                      of {formatMass(evaluation.mass.capacityKg)} rated (
                      {formatPercent(evaluation.mass.payloadKg / evaluation.mass.capacityKg)})
                    </span>
                  </dd>
                  <dt className="text-ink-soft">Liftoff mass:</dt>
                  <dd className="font-bold text-ink tabular-nums">
                    {formatMass(evaluation.deltaV.budget.liftoffMassKg)}
                  </dd>
                  <dt className="text-ink-soft">Rocket:</dt>
                  <dd className="font-bold text-ink">{rocket.name}</dd>
                  <dt className="text-ink-soft">Orbit:</dt>
                  <dd className="font-bold text-ink">{orbit.name}</dd>
                </dl>
              </Frame>
            </div>
          </section>

          {score && (
            <section aria-labelledby="score-heading" className="mt-6">
              <h2 id="score-heading" className="display text-xl text-line-bright">
                Score
              </h2>
              <ul className="mt-3 grid gap-4 sm:grid-cols-3">
                {score.parts.map((part) => (
                  <Frame as="li" tone="plain" key={part.id} className="px-4 py-3.5">
                    <p className="label">{part.label}</p>
                    <p className="figure mt-1 text-2xl text-ink">
                      {part.points}
                      <span className="text-base font-semibold not-italic text-ink-soft">
                        {' '}
                        / {part.maxPoints}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{part.detail}</p>
                  </Frame>
                ))}
              </ul>
            </section>
          )}

          {/* What to do next */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <ActionButton variant="secondary" href="/launch">
              <ReplayIcon />
              Watch the launch again
            </ActionButton>
            <div className="flex flex-wrap gap-3">
              {success && level === null ? (
                <>
                  <ActionButton
                    variant="secondary"
                    onPress={() => {
                      dispatch({ type: 'mode/select', mode: 'contract' });
                      void navigate(getStep('mission').path);
                    }}
                  >
                    Fly a contract
                  </ActionButton>
                  <ActionButton variant="primary" href={getStep('summary').path}>
                    Try another design
                    <ChevronRightIcon />
                  </ActionButton>
                </>
              ) : success ? (
                <>
                  {!score?.optimal && (
                    <ActionButton variant="secondary" href={getStep('summary').path}>
                      Improve the score
                    </ActionButton>
                  )}
                  {nextLevel ? (
                    <ActionButton
                      variant="primary"
                      onPress={() => {
                        dispatch({ type: 'level/start', levelId: nextLevel.id });
                        void navigate(getStep('mission').path);
                      }}
                    >
                      Next mission
                      <ChevronRightIcon />
                    </ActionButton>
                  ) : (
                    <ActionButton variant="primary" href={getStep('mission').path}>
                      Choose another mission
                      <ChevronRightIcon />
                    </ActionButton>
                  )}
                </>
              ) : (
                <>
                  <ActionButton variant="secondary" href={getStep('summary').path}>
                    Review the whole design
                  </ActionButton>
                  <ActionButton variant="primary" href={getStep(stepToFix(result)).path}>
                    Fix the design
                    <ChevronRightIcon />
                  </ActionButton>
                </>
              )}
            </div>
          </div>
          {success && level && !nextLevel && (
            <p className="mt-3 text-right text-ink-soft">
              That was the last mission. Every contract can be flown again for a better score.
            </p>
          )}
        </StepPanel>
      </main>
    </>
  );
}

function ScoreSummary({ score, best }: { score: Score; best: number | null }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-go/40 pt-4">
      <p className="flex items-center gap-1 text-3xl text-gold" aria-hidden="true">
        {[1, 2, 3].map((star) => (
          <StarIcon key={star} filled={star <= score.stars} />
        ))}
      </p>
      <p className="text-lg text-ink">
        <span className="sr-only">{score.stars} of 3 stars. </span>
        Score: <strong className="figure text-3xl text-gold-bright">{score.total}</strong>
        <span className="text-ink-soft"> / 100</span>
      </p>
      {score.optimal && <p className="font-bold text-go">Best possible design for this contract</p>}
      {best !== null && best > score.total && (
        <p className="text-ink-soft">Your best on this mission: {best}</p>
      )}
    </div>
  );
}

function CheckItem({ check, decisive }: { check: Check; decisive: boolean }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-3">
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 grid size-7 place-items-center rounded-full border-2',
          check.passed ? 'border-go text-go' : 'border-stop text-stop',
        )}
      >
        {check.passed ? (
          <CheckIcon width="1em" height="1em" />
        ) : (
          <CrossIcon width="1em" height="1em" />
        )}
      </span>
      <div>
        <p className="font-bold text-ink">
          {check.title}:{' '}
          <span className={check.passed ? 'text-go' : 'text-stop'}>
            {check.passed ? 'passed' : 'failed'}
          </span>
          {decisive && (
            <span className="font-semibold text-ink-soft"> · this ended the mission</span>
          )}
        </p>
        <p className="text-ink-soft">{check.detail}</p>
      </div>
    </li>
  );
}
