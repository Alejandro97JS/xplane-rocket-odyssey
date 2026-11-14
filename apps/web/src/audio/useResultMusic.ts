import { useEffect } from 'react';
import { resultMusic } from './ResultMusic.ts';
import type { Outcome } from './resultTunes.ts';

/**
 * Plays the music of the result of a launch, unless it has already played
 * for that launch. The debrief uses it for players who skipped the animation
 * or saw the flight as a list, so they hear the result too, but only once.
 */
export function useResultMusic(launch: number | undefined, outcome: Outcome | undefined): void {
  useEffect(() => {
    if (launch === undefined || outcome === undefined) return;
    if (!resultMusic.hasPlayed(launch)) resultMusic.play(outcome, launch);
  }, [launch, outcome]);
}
