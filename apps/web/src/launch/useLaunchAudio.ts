import { useEffect, useRef } from 'react';
import { resultMusic } from '../audio/ResultMusic.ts';
import type { Outcome } from '../audio/resultTunes.ts';
import { useSoundSetting } from '../audio/soundSetting.ts';
import { LaunchAudio } from './LaunchAudio.ts';
import type { Playback } from './playback.ts';
import type { PlaybackClock, PlaybackStatus } from './PlaybackClock.ts';

/**
 * Plays the sound of the launch in step with the playback clock and, when
 * the animation plays to its end, the music of the result. Playing the
 * launch again cuts that music short. The music is not stopped when the
 * player leaves, so it goes on into the debrief. The game's sound setting
 * mutes both.
 */
export function useLaunchAudio(
  playback: Playback,
  clock: PlaybackClock,
  outcome: Outcome,
  launch: number,
): void {
  const muted = useSoundSetting((setting) => setting.muted);
  const audioRef = useRef<LaunchAudio | null>(null);

  useEffect(() => {
    const audio = new LaunchAudio(playback, useSoundSetting.getState().muted);
    audioRef.current = audio;
    let lastStatus: PlaybackStatus | null = null;
    const onFrame = (seconds: number, status: PlaybackStatus) => {
      audio.update(seconds, status);
      if (status === 'playing' && lastStatus !== 'playing') resultMusic.stop();
      // Only when the playback reaches its end while playing.
      if (status === 'finished' && lastStatus === 'playing') resultMusic.play(outcome, launch);
      lastStatus = status;
    };
    onFrame(clock.time, clock.state);
    const unsubscribe = clock.subscribe(onFrame);
    return () => {
      unsubscribe();
      audio.destroy();
      audioRef.current = null;
    };
  }, [playback, clock, outcome, launch]);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);
}
