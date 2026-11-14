import { useEffect, useMemo, useState } from 'react';
import type { Playback } from './playback.ts';
import { PlaybackClock, type PlaybackStatus } from './PlaybackClock.ts';

/** How often the text next to the canvas is refreshed, in milliseconds. */
const TEXT_REFRESH_MS = 120;

interface LaunchPlayback {
  clock: PlaybackClock;
  /** Screen time, refreshed a few times per second. */
  seconds: number;
  status: PlaybackStatus;
}

/**
 * Owns the clock of a launch. The canvas listens to the clock on every frame;
 * React state, which drives the telemetry text, is refreshed more slowly so
 * the page does not re-render sixty times per second.
 */
export function useLaunchPlayback(playback: Playback, autoPlay: boolean): LaunchPlayback {
  const clock = useMemo(() => new PlaybackClock(playback.duration), [playback]);
  const [snapshot, setSnapshot] = useState<{ seconds: number; status: PlaybackStatus }>({
    seconds: 0,
    status: 'paused',
  });

  useEffect(() => {
    let lastRefresh = 0;
    let lastStatus: PlaybackStatus | null = null;
    const unsubscribe = clock.subscribe((seconds, status) => {
      const now = performance.now();
      if (status !== lastStatus || now - lastRefresh >= TEXT_REFRESH_MS) {
        lastRefresh = now;
        lastStatus = status;
        setSnapshot({ seconds, status });
      }
    });
    if (autoPlay) clock.play();
    return () => {
      unsubscribe();
      clock.dispose();
    };
  }, [clock, autoPlay]);

  return { clock, ...snapshot };
}
