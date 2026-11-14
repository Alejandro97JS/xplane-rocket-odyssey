import {
  formatList,
  formatMissionClock,
  lowerFirst,
  type SimulationResult,
} from '@rocket-odyssey/game-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { useGame, useLaunchResult } from '../app/store.ts';
import { ActionButton } from '../components/ActionButton.tsx';
import { AppHeader } from '../components/AppHeader.tsx';
import { Frame } from '../components/Frame.tsx';
import {
  ChevronRightIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  RocketIcon,
  SkipIcon,
  SoundOffIcon,
  SoundOnIcon,
} from '../components/icons.tsx';
import { StepPanel } from '../components/StepPanel.tsx';
import { EventLog, TONE_CLASS, TONE_ICON } from '../launch/EventLog.tsx';
import { LaunchCanvas } from '../launch/LaunchCanvas.tsx';
import {
  createPlayback,
  eventsUpTo,
  missionTimeAt,
  phaseAt,
  telemetryAt,
  type Playback,
} from '../launch/playback.ts';
import { StepTimeline } from '../launch/StepTimeline.tsx';
import { TelemetryPanel } from '../launch/TelemetryPanel.tsx';
import { TrajectoryMap } from '../launch/TrajectoryMap.tsx';
import { useLaunchAudio } from '../launch/useLaunchAudio.ts';
import { useLaunchPlayback } from '../launch/useLaunchPlayback.ts';
import { cx } from '../lib/cx.ts';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion.ts';

/** The launch: the flight computed by game-core, played back as an animation or as a list. */
export function LaunchScreen() {
  const launch = useGame((state) => state.launch);
  const result = useLaunchResult();
  if (!launch || !result) return <Navigate to="/plan/mission" replace />;
  // A new launch gets a new view, so nothing of the previous flight is left over.
  return <LaunchView key={launch.sequence} result={result} />;
}

function LaunchView({ result }: { result: SimulationResult }) {
  const reducedMotion = usePrefersReducedMotion();
  // The player may ask for the animation even when the system prefers less motion.
  const [animationRequested, setAnimationRequested] = useState(false);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const playback = useMemo(() => createPlayback(result.flight), [result]);
  const onUnavailable = useCallback(() => setCanvasUnavailable(true), []);

  const { rocket, orbit, payloads } = result.evaluation;
  const animated = (!reducedMotion || animationRequested) && !canvasUnavailable;

  return (
    <>
      <AppHeader tagline="Launch simulation" />
      <main id="main" className="flex-1">
        <StepPanel
          badge={<RocketIcon />}
          title="Launch"
          subtitle={`${rocket.shortName} carries the ${formatList(payloads.map((p) => lowerFirst(p.shortName)))} to ${lowerFirst(orbit.shortName)}.`}
        >
          {animated ? (
            <AnimatedLaunch result={result} playback={playback} onUnavailable={onUnavailable} />
          ) : (
            <StaticLaunch
              result={result}
              reason={canvasUnavailable ? 'unavailable' : 'reduced-motion'}
              onPlay={() => setAnimationRequested(true)}
            />
          )}
        </StepPanel>
      </main>
    </>
  );
}

interface AnimatedLaunchProps {
  result: SimulationResult;
  playback: Playback;
  onUnavailable: () => void;
}

function AnimatedLaunch({ result, playback, onUnavailable }: AnimatedLaunchProps) {
  const { clock, seconds, status } = useLaunchPlayback(playback, true);
  const { muted, toggleMuted } = useLaunchAudio(playback, clock);
  const { flight } = result;
  const t = missionTimeAt(playback, seconds);
  const telemetry = telemetryAt(flight, t);
  const phase = phaseAt(flight, t);
  const events = eventsUpTo(flight, t);
  const latest = events[events.length - 1];
  const finished = status === 'finished';

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-lg border-2 border-line-dim">
            <LaunchCanvas
              result={result}
              playback={playback}
              clock={clock}
              onUnavailable={onUnavailable}
            />
            {/* Captions over the canvas. The same facts are in the panels as text. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3"
            >
              <p className="readout rounded bg-space-950/75 px-2.5 py-1 text-xl text-ink">
                {formatMissionClock(t)}
              </p>
              {latest && (
                <p
                  className={cx(
                    'flex items-center gap-2 rounded bg-space-950/80 px-3 py-1.5 text-lg font-bold',
                    TONE_CLASS[latest.tone],
                  )}
                >
                  {TONE_ICON[latest.tone]}
                  {latest.title}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {status === 'playing' ? (
              <ActionButton size="small" onPress={() => clock.pause()}>
                <PauseIcon />
                Pause
              </ActionButton>
            ) : (
              <ActionButton size="small" onPress={() => clock.play()}>
                <PlayIcon />
                {finished ? 'Play again' : 'Resume'}
              </ActionButton>
            )}
            <ActionButton
              size="small"
              onPress={() => {
                clock.seek(0);
                clock.play();
              }}
            >
              <ReplayIcon />
              Restart
            </ActionButton>
            <ActionButton size="small" onPress={toggleMuted}>
              {muted ? <SoundOffIcon /> : <SoundOnIcon />}
              {muted ? 'Turn sound on' : 'Mute sound'}
            </ActionButton>
            {!finished && (
              <ActionButton size="small" href="/debrief" className="ml-auto">
                <SkipIcon />
                Skip to debrief
              </ActionButton>
            )}
          </div>

          <div className="mt-5">
            <EventLog events={events} />
          </div>
        </div>

        <div className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <TelemetryPanel
            t={t}
            telemetry={telemetry}
            phase={phase}
            rocket={result.evaluation.rocket}
          />
          <TrajectoryMap
            flight={flight}
            orbit={result.evaluation.orbit}
            t={t}
            telemetry={telemetry}
          />
        </div>
      </div>

      {finished && <Outcome result={result} focusOnMount />}
    </>
  );
}

interface StaticLaunchProps {
  result: SimulationResult;
  reason: 'reduced-motion' | 'unavailable';
  onPlay: () => void;
}

function StaticLaunch({ result, reason, onPlay }: StaticLaunchProps) {
  return (
    <>
      <Frame tone="plain" className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <p className="flex min-w-0 flex-1 basis-64 items-start gap-2 text-ink-soft">
          <InfoIcon className="mt-0.5 flex-none text-line-bright" />
          {reason === 'reduced-motion'
            ? 'Your system asks for less motion, so the flight is shown as a list of steps instead of an animation.'
            : 'The animation cannot run in this browser, so the flight is shown as a list of steps.'}
        </p>
        {reason === 'reduced-motion' && (
          <ActionButton size="small" onPress={onPlay}>
            <PlayIcon />
            Play the animation
          </ActionButton>
        )}
      </Frame>
      <StepTimeline flight={result.flight} />
      <Outcome result={result} />
    </>
  );
}

/** The verdict at the end of the flight, with the way on to the debrief. */
function Outcome({
  result,
  focusOnMount = false,
}: {
  result: SimulationResult;
  focusOnMount?: boolean;
}) {
  const success = result.outcome === 'success';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When the animation ends, bring the keyboard to the way forward.
    if (focusOnMount) ref.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [focusOnMount]);

  return (
    <Frame
      tone={success ? 'good' : 'bad'}
      className="fade-in mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4"
    >
      <div role="status" className="min-w-0 flex-1 basis-72">
        <p className={cx('display text-2xl', success ? 'text-go' : 'text-stop')}>
          {result.report.headline}
        </p>
        <p className="mt-1 text-ink">{result.report.summary}</p>
      </div>
      <div ref={ref}>
        <ActionButton variant="primary" href="/debrief">
          View mission debrief
          <ChevronRightIcon />
        </ActionButton>
      </div>
    </Frame>
  );
}
