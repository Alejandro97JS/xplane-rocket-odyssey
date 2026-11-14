import type { SimulationResult } from '@rocket-odyssey/game-core';
import { useEffect, useRef } from 'react';
import { LaunchScene } from './LaunchScene.ts';
import type { Playback } from './playback.ts';
import type { PlaybackClock } from './PlaybackClock.ts';

interface LaunchCanvasProps {
  result: SimulationResult;
  playback: Playback;
  clock: PlaybackClock;
  /** Called when the canvas cannot be created, for example without WebGL. */
  onUnavailable: () => void;
}

/**
 * The canvas of the launch animation. A canvas is invisible to assistive
 * technology, so it is labelled as an image and everything it shows is also
 * given as text by the telemetry and the event log.
 */
export function LaunchCanvas({ result, playback, clock, onUnavailable }: LaunchCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new LaunchScene(result, playback);
    let cancelled = false;
    let unsubscribe = () => {};
    scene
      .mount(host)
      .then(() => {
        if (cancelled) return;
        scene.draw(clock.time);
        unsubscribe = clock.subscribe((seconds) => scene.draw(seconds));
      })
      .catch((error: unknown) => {
        console.error('The launch animation could not start.', error);
        if (!cancelled) onUnavailable();
      });
    return () => {
      cancelled = true;
      unsubscribe();
      scene.destroy();
    };
  }, [result, playback, clock, onUnavailable]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Animation of the launch. The telemetry and the mission events next to it give the same information as text."
      className="scene"
    />
  );
}
