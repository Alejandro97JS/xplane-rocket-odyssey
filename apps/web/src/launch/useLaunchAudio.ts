import { useEffect, useRef, useState } from 'react';
import { LaunchAudio } from './LaunchAudio.ts';
import type { Playback } from './playback.ts';
import type { PlaybackClock } from './PlaybackClock.ts';

const STORAGE_KEY = 'rocket-odyssey:sound-muted';

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Plays the sound of the launch in step with the playback clock. The choice
 * to mute it is remembered between launches.
 */
export function useLaunchAudio(
  playback: Playback,
  clock: PlaybackClock,
): { muted: boolean; toggleMuted: () => void } {
  const [muted, setMuted] = useState(readMuted);
  const audioRef = useRef<LaunchAudio | null>(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    const audio = new LaunchAudio(playback, mutedRef.current);
    audioRef.current = audio;
    audio.update(clock.time, clock.state);
    const unsubscribe = clock.subscribe((seconds, status) => audio.update(seconds, status));
    return () => {
      unsubscribe();
      audio.destroy();
      audioRef.current = null;
    };
  }, [playback, clock]);

  useEffect(() => {
    mutedRef.current = muted;
    audioRef.current?.setMuted(muted);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(muted));
    } catch {
      // Storage may be blocked; the choice then lasts only for this launch.
    }
  }, [muted]);

  return { muted, toggleMuted: () => setMuted((value) => !value) };
}
