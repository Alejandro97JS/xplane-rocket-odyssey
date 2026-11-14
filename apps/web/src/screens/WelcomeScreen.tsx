import { LEVELS, selectCompletedCount } from '@rocket-odyssey/game-core';
import { useGame } from '../app/store.ts';
import { getStep } from '../app/steps.ts';
import { RocketSvg } from '../art/RocketSvg.tsx';
import { ActionButton } from '../components/ActionButton.tsx';
import { Frame } from '../components/Frame.tsx';
import { ChevronRightIcon } from '../components/icons.tsx';
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

/** The title screen: the name of the game, what it is about and one way in. */
export function WelcomeScreen() {
  const headingRef = usePageHeading('Welcome');
  const completed = useGame(selectCompletedCount);
  const started = useGame((state) => state.levelId !== null);

  return (
    <main id="main" className="flex flex-1 flex-col justify-center py-4">
      <Frame tone="panel" className="fade-in overflow-hidden px-5 py-8 sm:px-10 sm:py-12">
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

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ActionButton variant="primary" href={getStep('mission').path} className="!text-2xl !px-9 !min-h-16">
                {started ? 'Continue planning' : 'Start mission'}
                <ChevronRightIcon />
              </ActionButton>
              <p className="text-ink-soft">
                {LEVELS.length} missions · {completed} completed
              </p>
            </div>
          </div>

          {/* A rocket on the pad, to set the scene. Hidden on small screens to keep the text first. */}
          <div aria-hidden="true" className="relative hidden h-[26rem] w-56 lg:block">
            <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-line/40 blur-md" />
            <RocketSvg rocketId="falcon9" className="absolute inset-0 size-full" />
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
