import type { SimulationResult } from '@rocket-odyssey/game-core';

/**
 * The scores of the music that announces the result of a launch. They are
 * plain data, written for this game; `ResultMusic` synthesises them with the
 * Web Audio API, so there are no audio files and no recordings of anyone.
 *
 * - Success: a slow sunrise fanfare in D major, in the spirit of the music of
 *   classic space films. A deep organ note grows out of silence, the brass
 *   calls upwards in a fifth and an octave and opens into a major chord over
 *   a timpani roll, then climbs to a full chord with a crash. It is our own
 *   tune: it does not quote any piece.
 * - Failure: the "you lost" jingle of video games: four falling semitones in
 *   a square wave, "wah, wah, wah, waaah", the last one wobbling and sagging.
 */

export type Outcome = SimulationResult['outcome'];

/** An instrument of the result music. */
export type Voice = 'organ' | 'brass' | 'timpani' | 'cymbal' | 'chip' | 'chipBass';

export interface Note {
  voice: Voice;
  /** Start, in seconds from the start of the tune. */
  at: number;
  /** How long the note is held, in seconds. Drums and cymbals ring for this long. */
  length: number;
  /** MIDI note number: 60 is middle C, 69 is A 440 Hz. The cymbal has no pitch. */
  pitch: number;
  /** Loudness, from 0 to 1. */
  level: number;
  /** Seconds the note takes to reach its level; each voice has its own default. */
  attack?: number;
  /** Semitones the pitch slides by during the second half of the note. */
  bend?: number;
  /** Whether the pitch wobbles. */
  vibrato?: boolean;
}

export interface Tune {
  notes: readonly Note[];
  /** Share of the sound sent to the echo of the hall, from 0 to 1. */
  hall: number;
  /** Seconds from the start until the last echo has died away. */
  duration: number;
}

// MIDI numbers of the notes used.
const D1 = 26;
const D2 = 38;
const A2 = 45;
const D3 = 50;
const FS3 = 54;
const A3 = 57;
const D4 = 62;
const E4 = 64;
const FS4 = 66;
const A4 = 69;
const D5 = 74;

const G2 = 43;
const AB2 = 44;
const BB2 = 46;
const G3 = 55;
const AB3 = 56;
const BB3 = 58;

/** Seconds between the strokes of a timpani roll. */
const ROLL_STROKE_S = 0.065;

/** A timpani roll: quick strokes whose loudness goes from `from` to `to`. */
function roll(at: number, length: number, pitch: number, from: number, to: number): Note[] {
  const strokes = Math.max(2, Math.round(length / ROLL_STROKE_S));
  return Array.from({ length: strokes }, (_, i) => ({
    voice: 'timpani' as const,
    at: at + i * ROLL_STROKE_S,
    length: 0.5,
    pitch,
    level: from + ((to - from) * i) / (strokes - 1),
  }));
}

function chord(voice: Voice, at: number, length: number, pitches: number[], level: number): Note[] {
  return pitches.map((pitch) => ({ voice, at, length, pitch, level }));
}

/** Builds a tune whose duration covers its last note plus `tail` seconds of echo. */
function tune(notes: Note[], hall: number, tail: number): Tune {
  const end = Math.max(...notes.map((note) => note.at + note.length));
  return { notes, hall, duration: end + tail };
}

/** When the final chord of the success fanfare starts, in seconds. */
const CLIMAX_S = 6.8;

const SUCCESS = tune(
  [
    // The deep organ note that grows out of silence and holds everything up.
    { voice: 'organ', at: 0, length: CLIMAX_S + 2.6, pitch: D1, level: 0.22, attack: 2.5 },
    { voice: 'organ', at: 0, length: CLIMAX_S + 2.6, pitch: D2, level: 0.3, attack: 2.5 },
    // The call of the brass: up a fifth, up a fourth to the octave.
    { voice: 'brass', at: 1, length: 0.95, pitch: D3, level: 0.08, attack: 0.3 },
    { voice: 'brass', at: 2, length: 0.95, pitch: A3, level: 0.09, attack: 0.3 },
    { voice: 'brass', at: 3, length: 1, pitch: D4, level: 0.1, attack: 0.3 },
    // It opens into a major chord over a growing roll.
    ...chord('brass', 4, 1.5, [D3, A3, D4, FS4], 0.08),
    ...roll(4, 1.45, A2, 0.06, 0.4),
    { voice: 'timpani', at: 5.5, length: 1.1, pitch: D3, level: 0.6 },
    // A shorter climb, pushed on by a second roll.
    { voice: 'brass', at: 5.7, length: 0.36, pitch: E4, level: 0.17, attack: 0.06 },
    { voice: 'brass', at: 6.06, length: 0.36, pitch: FS4, level: 0.18, attack: 0.06 },
    { voice: 'brass', at: 6.42, length: 0.36, pitch: A4, level: 0.2, attack: 0.06 },
    ...roll(5.75, 1, A2, 0.08, 0.5),
    // The full chord, with the organ, a timpani stroke and a crash.
    ...chord('brass', CLIMAX_S, 2.6, [D3, A3, D4, FS4, A4, D5], 0.2),
    ...chord('organ', CLIMAX_S, 2.6, [A2, D3, FS3], 0.2).map((note) => ({ ...note, attack: 0.3 })),
    { voice: 'timpani', at: CLIMAX_S, length: 1.6, pitch: D3, level: 1 },
    { voice: 'cymbal', at: CLIMAX_S, length: 3.2, pitch: 0, level: 0.3 },
  ],
  0.4,
  2.5,
);

/** The four steps of the failure jingle: melody and bass, a semitone lower each time. */
const FAILURE_STEPS = [
  { at: 0, length: 0.38, melody: BB3, bass: BB2 },
  { at: 0.45, length: 0.38, melody: A3, bass: A2 },
  { at: 0.9, length: 0.38, melody: AB3, bass: AB2 },
  { at: 1.35, length: 1.3, melody: G3, bass: G2 },
];

const FAILURE = tune(
  FAILURE_STEPS.flatMap(({ at, length, melody, bass }, i) => {
    // The last note wobbles and sags, like a sigh.
    const last = i === FAILURE_STEPS.length - 1;
    const droop = last ? { bend: -1 } : {};
    return [
      { voice: 'chip' as const, at, length, pitch: melody, level: 0.22, vibrato: last, ...droop },
      { voice: 'chipBass' as const, at, length, pitch: bass, level: 0.28, ...droop },
    ];
  }),
  0.12,
  1.2,
);

export const RESULT_TUNES: Record<Outcome, Tune> = { success: SUCCESS, failure: FAILURE };
