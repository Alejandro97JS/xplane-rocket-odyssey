import { LEVELS, selectCompletedCount, selectHasMission } from '@rocket-odyssey/game-core';
import { useGame } from '../app/store.ts';
import { getStep } from '../app/steps.ts';
import { RocketSvg } from '../art/RocketSvg.tsx';
import { ActionButton } from '../components/ActionButton.tsx';
import { Frame } from '../components/Frame.tsx';
import { ChevronRightIcon, HelpIcon } from '../components/icons.tsx';
import { Logo } from '../components/Logo.tsx';
import { usePageHeading } from '../lib/usePageHeading.ts';

const LOOP = [
  {
    title: 'Design',
    text: 'Pick a contract, the payload it needs, an orbit and a rocket.',
  },
  {
    title: 'Balance',
    text: 'Every choice costs money, mass and delta-v. Nothing is free.',
  },
  {
    title: 'Simulate',
    text: 'Press Launch and watch the flight your design produces.',
  },
  {
    title: 'Learn',
    text: 'Read why it worked or failed, then improve the design.',
  },
];

/**
 * The title screen: the name of the game, what it is about, one way in, to
 * the first planning step, and the way to the guide, "How to play"
 * (`ai/standards/how_to_play.md`). Free exploration is chosen in step 1, next
 * to the contracts, not here (rule 4 of `ai/standards/free_exploration.md`).
 */
export function WelcomeScreen() {
  const headingRef = usePageHeading('Welcome');
  const completed = useGame(selectCompletedCount);
  // A contract or free exploration already chosen in step 1. The link leaves
  // the mode alone, so the player finds step 1 as they left it.
  const planningStarted = useGame(selectHasMission);

  return (
    <main id="main" className="flex flex-1 flex-col justify-center py-4">
      <Frame tone="panel" className="fade-in px-5 py-8 sm:px-10 sm:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-4">
              <Logo size={88} className="flex-none drop-shadow-[0_0_14px_rgb(56_189_248/0.6)]" />
              <p className="label !text-base !text-line-bright">Space Mission Planner</p>
            </div>

            <h1
              ref={headingRef}
              tabIndex={-1}
              className="display text-shadow-glow mt-6 text-5xl text-ink sm:text-7xl"
            >
              Rocket <span className="text-gold">Odyssey</span>
            </h1>
            <p className="mt-5 max-w-xl text-xl text-ink-soft text-balance sm:text-2xl">
              Plan a space mission from the contract to the launch pad. Then light the engines and
              find out if your design reaches orbit.
            </p>

            {/* The way in and, beside it, the guide for a first-time player. */}
            <div className="mt-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ActionButton
                  variant="primary"
                  href={getStep('mission').path}
                  aria-describedby="contracts-caption"
                  className="!min-h-16 !px-6 !text-xl sm:w-96 sm:!text-2xl"
                >
                  {planningStarted ? 'Continue planning' : 'Start mission'}
                  <ChevronRightIcon />
                </ActionButton>
                <ActionButton variant="secondary" href="/how-to-play" className="!min-h-16 !px-6">
                  <HelpIcon width="1.4em" height="1.4em" />
                  How to play
                </ActionButton>
              </div>
              <p id="contracts-caption" className="mt-2 text-ink-soft">
                {LEVELS.length} contracts, each with a client and a budget{' '}
                <span className="whitespace-nowrap">· {completed} completed</span>
              </p>
            </div>
          </div>

          {/* Three launchers at their relative sizes, to set the scene. Hidden on
              small screens to keep the text first. */}
          <div
            aria-hidden="true"
            className="relative hidden h-[26rem] w-80 items-end justify-center gap-5 lg:flex"
          >
            <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-line/45 blur-md" />
            <RocketSvg rocketId="soyuz" className="relative h-[66%] w-20" />
            <RocketSvg rocketId="falcon9" className="relative h-full w-16" />
            <RocketSvg rocketId="ariane5" className="relative h-[74%] w-28" />
          </div>
        </div>

        <h2 className="sr-only">How the game works</h2>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((step, index) => (
            <Frame as="li" tone="plain" key={step.title} className="px-4 py-3.5">
              <p className="display flex items-center gap-2.5 text-lg text-line-bright">
                <span
                  aria-hidden="true"
                  className="grid size-7 flex-none place-items-center rounded-full border-2 border-line text-sm not-italic text-ink"
                >
                  {index + 1}
                </span>
                {step.title}
              </p>
              <p className="mt-1.5 text-ink-soft">{step.text}</p>
            </Frame>
          ))}
        </ol>
      </Frame>
    </main>
  );
}
