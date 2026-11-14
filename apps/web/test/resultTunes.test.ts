import { describe, expect, it } from 'vitest';
import { RESULT_TUNES, type Note } from '../src/audio/resultTunes.ts';

const TUNES = Object.entries(RESULT_TUNES);

/** The pitch class of a MIDI note: 0 is C, 2 is D, 6 is F sharp, 9 is A. */
const pitchClass = (note: Note) => note.pitch % 12;

describe('result music', () => {
  it.each(TUNES)('every note of the %s tune can be played', (_, tune) => {
    expect(tune.notes.length).toBeGreaterThan(0);
    for (const note of tune.notes) {
      expect(note.at).toBeGreaterThanOrEqual(0);
      expect(note.length).toBeGreaterThan(0);
      // Above zero, because drums and cymbals die away exponentially from it.
      expect(note.level).toBeGreaterThan(0);
      expect(note.level).toBeLessThanOrEqual(1);
      if (note.voice !== 'cymbal') {
        // From the lowest to the highest key of a piano.
        expect(note.pitch).toBeGreaterThanOrEqual(21);
        expect(note.pitch).toBeLessThanOrEqual(108);
      }
      expect(note.at + note.length).toBeLessThan(tune.duration);
    }
  });

  it('the success fanfare is short and ends on the major chord of its key', () => {
    const { notes, duration } = RESULT_TUNES.success;
    expect(duration).toBeLessThan(14);
    const lastStart = Math.max(...notes.map((note) => note.at));
    // Every pitched note still sounding then, the deep organ note included.
    const lastChord = notes.filter(
      (n) => n.voice !== 'cymbal' && n.at <= lastStart && lastStart < n.at + n.length,
    );
    // D major: D, F sharp and A, with D at the bottom.
    expect(new Set(lastChord.map(pitchClass))).toEqual(new Set([2, 6, 9]));
    expect(pitchClass(lastChord.reduce((low, n) => (n.pitch < low.pitch ? n : low)))).toBe(2);
  });

  it('the failure jingle is short and only goes down', () => {
    const { notes, duration } = RESULT_TUNES.failure;
    expect(duration).toBeLessThan(4);
    for (const voice of ['chip', 'chipBass'] as const) {
      const line = notes.filter((note) => note.voice === voice).sort((a, b) => a.at - b.at);
      expect(line.length).toBe(4);
      for (let i = 1; i < line.length; i++) expect(line[i]!.pitch).toBe(line[i - 1]!.pitch - 1);
      // The last note sags further.
      expect(line[line.length - 1]!.bend).toBeLessThan(0);
    }
  });
});
