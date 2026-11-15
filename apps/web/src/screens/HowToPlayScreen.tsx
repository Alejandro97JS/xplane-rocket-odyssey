import {
  formatList,
  FREE_EXPLORATION,
  LEVELS,
  lowerFirst,
  ORBITS,
  PAYLOADS,
  ROCKETS,
  SCORE_POINTS,
  selectHasMission,
  STAR_THRESHOLDS,
} from '@rocket-odyssey/game-core';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { useGame } from '../app/store.ts';
import { getStep, STEPS, type StepId } from '../app/steps.ts';
import { ActionButton } from '../components/ActionButton.tsx';
import { AppHeader } from '../components/AppHeader.tsx';
import {
  AlertIcon,
  ArrowLeftIcon,
  BookIcon,
  ChevronRightIcon,
  CoinIcon,
  GaugeIcon,
  InfinityIcon,
  InfoIcon,
  KeyboardIcon,
  LightbulbIcon,
  PauseIcon,
  RocketIcon,
  SoundOnIcon,
  StarIcon,
  TargetIcon,
  WeightIcon,
} from '../components/icons.tsx';
import { StepPanel } from '../components/StepPanel.tsx';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * The sections of the guide, in reading order. `short` is the label in the
 * list of contents, kept short so the list fits a phone in a few lines.
 */
const SECTIONS = [
  { id: 'goal', short: 'Goal', title: 'Your goal', icon: TargetIcon },
  { id: 'steps', short: 'Steps', title: 'A mission, step by step', icon: RocketIcon },
  { id: 'rules', short: 'Rules', title: 'What decides the flight', icon: AlertIcon },
  { id: 'score', short: 'Score', title: 'The score', icon: StarIcon },
  { id: 'free', short: 'Free exploration', title: 'Free exploration', icon: InfinityIcon },
  { id: 'ideas', short: 'Key ideas', title: 'Ideas worth knowing', icon: InfoIcon },
  { id: 'controls', short: 'Controls', title: 'Controls and accessibility', icon: KeyboardIcon },
  { id: 'tips', short: 'Tips', title: 'Tips for your first launch', icon: LightbulbIcon },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

/** What the player does in each planning step. The names come from the stepper. */
const PLANNING: Record<StepId, string> = {
  mission:
    'Choose a contract and read its briefing: who the client is, what they need and the most they will pay.',
  payload:
    'Choose what the rocket carries: satellites, crew capsules or station modules. Each one adds mass and cost.',
  orbit:
    'Choose where the payload goes. Higher orbits need more delta-v, and some cross the Van Allen radiation belts.',
  rocket: 'Choose the launcher. A bigger rocket lifts more and flies higher, but it costs more.',
  summary: 'Check the whole design, the budget used and the load on the rocket. Then press Launch!',
};

/** The five rules of the flight review, in the order of `FAILURE_CODES` in game-core. */
const RULES: readonly { title: string; icon: IconComponent; text: string }[] = [
  {
    title: 'Budget',
    icon: CoinIcon,
    text: 'The payload and the rocket together must not cost more than the client pays, or the agency scrubs the launch.',
  },
  {
    title: 'Payload mass',
    icon: WeightIcon,
    text: 'The payload must not weigh more than the rocket is rated to carry.',
  },
  {
    title: 'Delta-v',
    icon: GaugeIcon,
    text: 'The rocket must generate at least the delta-v the orbit needs. The heavier the payload, the less it generates.',
  },
  {
    title: 'Crew radiation',
    icon: AlertIcon,
    text: 'Astronauts may cross the Van Allen radiation belts only in a shielded capsule.',
  },
  {
    title: 'Contract objective',
    icon: TargetIcon,
    text: 'The payload and the orbit must give the client what the contract asks for.',
  },
];

/** Orbits that cross the Van Allen belts, named as in the middle of a sentence. */
const BELT_ORBITS = formatList(
  ORBITS.filter((orbit) => orbit.radiationHazard).map((orbit) => lowerFirst(orbit.shortName)),
);

/**
 * How to play: the goal of the game, the steps of a mission, the rules that
 * decide a flight, the score, free exploration, the ideas a player without an
 * aerospace background needs, the controls and a few tips. It is opened from
 * the title screen.
 *
 * The numbers it quotes come from game-core, so the guide cannot drift from
 * the rules. Free exploration is explained here but not entered from here: it
 * is chosen in step 1 (rule 4 of `ai/standards/free_exploration.md`).
 */
export function HowToPlayScreen() {
  // A contract or free exploration already chosen: the way in says so, as on
  // the title screen.
  const planningStarted = useGame(selectHasMission);

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <StepPanel
          badge={<BookIcon width="1.1em" height="1.1em" />}
          title="How to play"
          subtitle="The goal, the steps of a mission and the ideas behind them."
        >
          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <Contents />

            <div className="min-w-0 max-w-3xl space-y-8">
              <GuideSection id="goal">
                <p>
                  You plan launches for a space agency. A client offers a contract with a goal and a
                  maximum budget. You design the mission that fulfils it: what the rocket carries,
                  the orbit it goes to and the rocket that takes it there. Then you launch, and the
                  flight shows whether your design holds up.
                </p>
                <p>
                  The mission succeeds when the rocket lifts the payload, reaches the orbit and
                  keeps any crew safe, and the client gets what the contract asks for, within
                  budget.
                </p>
                <p>
                  There is no single right answer. Each contract can be fulfilled with several
                  designs, and the score rewards the ones that spend less and keep more in reserve.
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  <Fact count={LEVELS.length} noun="contracts" />
                  <Fact count={PAYLOADS.length} noun="payloads" />
                  <Fact count={ORBITS.length} noun="orbits" />
                  <Fact count={ROCKETS.length} noun="rockets" />
                </ul>
              </GuideSection>

              <GuideSection id="steps">
                <p>
                  Planning has five steps. You can move freely between them, and the budget in the
                  header updates with every choice.
                </p>
                <ol className="space-y-3 pt-1">
                  {STEPS.map((step) => (
                    <TimelineItem
                      key={step.id}
                      marker={step.number}
                      kicker={`Step ${step.number}`}
                      title={step.label}
                    >
                      {PLANNING[step.id]}
                    </TimelineItem>
                  ))}
                  <TimelineItem marker={<RocketIcon />} kicker="Then" title="Launch">
                    Watch the flight, with live telemetry and a log of events. Pause, restart or
                    skip to the debrief at any time.
                  </TimelineItem>
                  <TimelineItem marker={<StarIcon />} kicker="Finally" title="Debrief">
                    Find out why the mission worked or failed, with your score and a hint. Then go
                    back to any step, improve the design and launch again.
                  </TimelineItem>
                </ol>
              </GuideSection>

              <GuideSection id="rules">
                <p>
                  Every flight is checked against five rules, in the order they matter in flight.
                  The first rule that fails ends the mission, and the debrief says which one and
                  takes you to the step that can fix it.
                </p>
                <ol className="space-y-3 pt-1">
                  {RULES.map((rule, index) => (
                    <li key={rule.title} className="flex items-start gap-3">
                      <rule.icon
                        className="mt-0.5 flex-none text-gold"
                        width="1.5em"
                        height="1.5em"
                      />
                      <p>
                        <strong className="text-ink">
                          {index + 1}. {rule.title}.
                        </strong>{' '}
                        {rule.text}
                      </p>
                    </li>
                  ))}
                </ol>
                <p>
                  Free exploration has no contract and no budget, so only the three rules of physics
                  apply there: payload mass, delta-v and crew radiation.
                </p>
              </GuideSection>

              <GuideSection id="score">
                <p>
                  A contract fulfilled earns a score out of 100 and up to three stars. A failed
                  mission has no score.
                </p>
                <ul className="space-y-2 pt-1">
                  <ScorePart points={`${SCORE_POINTS.objective} points`} name="Contract fulfilled">
                    Every successful contract earns them.
                  </ScorePart>
                  <ScorePart points={`Up to ${SCORE_POINTS.budget} points`} name="Budget saved">
                    The less of the budget you spend, the more you earn.
                  </ScorePart>
                  <ScorePart
                    points={`Up to ${SCORE_POINTS.margin} points`}
                    name="Propellant reserve"
                  >
                    Delta-v left over, beyond what the orbit needs.
                  </ScorePart>
                </ul>
                <p>
                  Only the best possible design of each contract scores 100: the cheapest one that
                  fulfils it and, between designs of the same cost, the one with the most delta-v in
                  reserve. Any other design scores 99 at most.
                </p>
                <p>
                  Three stars from {STAR_THRESHOLDS.three} points, two from {STAR_THRESHOLDS.two},
                  one for any other success. Your best score for each mission appears on its card in
                  step 1. The game does not save progress, so it starts over when the page is
                  reloaded.
                </p>
              </GuideSection>

              <GuideSection id="free">
                <p>{FREE_EXPLORATION.statement}</p>
                <p>
                  Choose it as the last card of step 1, Mission, after the contracts.{' '}
                  {FREE_EXPLORATION.noScore}
                </p>
              </GuideSection>

              <GuideSection id="ideas">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Idea term="Payload">
                    Whatever the rocket carries to orbit: satellites, crew capsules or modules of a
                    space station.
                  </Idea>
                  <Idea term="Delta-v">
                    “Change of speed”. To stay in orbit a spacecraft must fly sideways so fast that
                    it keeps missing the ground: almost 8 km every second in a low orbit. Each orbit
                    has a price in delta-v, and higher orbits cost more.
                  </Idea>
                  <Idea term="Capacity">
                    The heaviest payload a rocket is rated to carry to low orbit. Load more and the
                    mission fails.
                  </Idea>
                  <Idea term="Specific impulse (Isp)">
                    How efficiently the engines use propellant. Higher is better, like kilometres
                    per litre in a car.
                  </Idea>
                  <Idea term="Stages">
                    When the first stage of a rocket runs out of propellant it falls away, so the
                    second stage pushes a lighter vehicle and goes faster.
                  </Idea>
                  <Idea term="Van Allen belts">
                    Rings of radiation trapped by the magnetic field of the Earth, well above low
                    orbit. The {BELT_ORBITS} cross them. Satellites are built to stand it;
                    astronauts need a shielded capsule.
                  </Idea>
                </dl>
              </GuideSection>

              <GuideSection id="controls">
                <ul className="space-y-3">
                  <Point icon={TargetIcon}>
                    Click or tap a card to choose it. Payloads can be combined; every other step
                    takes one choice.
                  </Point>
                  <Point icon={KeyboardIcon}>
                    With the keyboard, Tab moves between controls, the arrow keys move within a
                    group of cards, Space selects a card and Enter presses a button. The whole game
                    can be played with the keyboard alone.
                  </Point>
                  <Point icon={PauseIcon}>
                    During the launch, Pause, Restart and Skip to debrief are always next to the
                    animation.
                  </Point>
                  <Point icon={SoundOnIcon}>
                    Mute sound silences the engines and the music, and the game remembers your
                    choice.
                  </Point>
                  <Point icon={InfoIcon}>
                    If your system asks for less motion, the flight is shown as a list of steps, and
                    the animation is one button away.
                  </Point>
                </ul>
              </GuideSection>

              <GuideSection id="tips">
                <ul className="space-y-3">
                  <Point icon={LightbulbIcon}>
                    Start with mission 1. Every contract is open from the start, but they get harder
                    in order.
                  </Point>
                  <Point icon={LightbulbIcon}>
                    Read the briefing closely. What the client needs points to the payload and to
                    the orbit.
                  </Point>
                  <Point icon={LightbulbIcon}>
                    The biggest rocket usually works, but it costs more, and every dollar left
                    unspent is worth points.
                  </Point>
                  <Point icon={LightbulbIcon}>
                    Failing is part of the job. The debrief explains what went wrong and takes you
                    to the step that can fix it.
                  </Point>
                </ul>
              </GuideSection>

              <div className="flex flex-col-reverse gap-3 border-t border-line-dim/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <ActionButton variant="secondary" href="/">
                  <ArrowLeftIcon />
                  Back to the title screen
                </ActionButton>
                <ActionButton variant="primary" href={getStep('mission').path}>
                  {planningStarted ? 'Continue planning' : 'Start mission'}
                  <ChevronRightIcon />
                </ActionButton>
              </div>
            </div>
          </div>
        </StepPanel>
      </main>
    </>
  );
}

/** Links to each section. A row of chips on small screens, a column beside the guide on large ones. */
function Contents() {
  return (
    <nav aria-labelledby="guide-contents" className="lg:sticky lg:top-6 lg:self-start">
      <p id="guide-contents" className="label">
        On this page
      </p>
      <ul className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-line-dim bg-space-800/80 px-3 font-semibold text-line-bright no-underline hover:border-line hover:text-ink lg:w-full"
            >
              {section.short}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * A section of the guide. Its heading is the target of the entry in the
 * contents and can take focus (`tabIndex={-1}`), so following the entry moves
 * focus to the heading, which a screen reader reads, and the next Tab goes on
 * from there. Without it the browser would leave focus on the page itself.
 */
function GuideSection({ id, children }: { id: SectionId; children: ReactNode }) {
  const section = SECTIONS.find((candidate) => candidate.id === id)!;
  const Icon: IconComponent = section.icon;
  return (
    <section
      aria-labelledby={id}
      className="border-t border-line-dim/60 pt-6 first:border-t-0 first:pt-0"
    >
      <h2
        id={id}
        tabIndex={-1}
        className="display flex scroll-mt-6 items-center gap-2.5 text-xl text-line-bright outline-none sm:text-2xl"
      >
        <Icon className="flex-none" />
        {section.title}
      </h2>
      <div className="mt-3 space-y-3 text-ink-soft">{children}</div>
    </section>
  );
}

function Fact({ count, noun }: { count: number; noun: string }) {
  return (
    <li className="rounded-lg border border-line-dim bg-space-800/80 px-3 py-1.5 text-ink">
      <span className="value">{count}</span> {noun}
    </li>
  );
}

/** One stage of a mission, with a round marker like the badges of the planning steps. */
function TimelineItem({
  marker,
  kicker,
  title,
  children,
}: {
  marker: ReactNode;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3.5">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full border-2 border-line bg-space-700 font-bold text-ink"
      >
        {marker}
      </span>
      <div>
        <p className="label !text-line-bright">{kicker}</p>
        <p className="font-bold text-ink">{title}</p>
        <p>{children}</p>
      </div>
    </li>
  );
}

function ScorePart({
  points,
  name,
  children,
}: {
  points: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3">
      <strong className="value min-w-36">{points}</strong>
      <span>
        <strong className="text-ink">{name}.</strong> {children}
      </span>
    </li>
  );
}

function Idea({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-bold text-ink">{term}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Point({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 flex-none text-gold" width="1.4em" height="1.4em" />
      <p>{children}</p>
    </li>
  );
}
