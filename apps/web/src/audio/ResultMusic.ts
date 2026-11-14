import { RESULT_TUNES, type Note, type Outcome, type Tune } from './resultTunes.ts';
import { useSoundSetting } from './soundSetting.ts';

/**
 * The music that announces the result of a launch: a fanfare for a success,
 * the "you lost" jingle for a failure. The scores are in `resultTunes.ts`;
 * this file synthesises them with the Web Audio API.
 *
 * It plays the moment the player learns the result: when the animation
 * reaches its end, or when the debrief opens if the player skipped the
 * animation or saw the flight as a list. It has an audio context of its own,
 * so it keeps playing when the player goes on from the launch to the debrief.
 *
 * The music adds nothing that is not already given as text, and the sound
 * buttons of the launch and of the debrief silence it (WCAG 1.4.2).
 */

/** Loudness of the music as a whole, from 0 to 1. */
const MUSIC_GAIN = 0.45;
/** Time to schedule the first notes, in seconds. */
const LEAD_IN_S = 0.06;
/** Length of the echo of the hall, in seconds. */
const HALL_S = 2.4;

class ResultMusic {
  private session: { context: AudioContext; master: GainNode; timer: number } | null = null;
  /** The launch whose result was announced last. */
  private announced: number | null = null;

  constructor() {
    useSoundSetting.subscribe(({ muted }) => {
      const session = this.session;
      if (!session) return;
      const { context, master } = session;
      master.gain.setTargetAtTime(muted ? 0 : MUSIC_GAIN, context.currentTime, 0.05);
    });
  }

  /** Whether the result of this launch has already been announced. */
  hasPlayed(launch: number): boolean {
    return this.announced === launch;
  }

  /** Plays the tune of an outcome, cutting short any tune still playing. */
  play(outcome: Outcome, launch: number): void {
    this.announced = launch;
    this.stop();
    const AudioContextClass = window.AudioContext as typeof AudioContext | undefined;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      if (context.state === 'suspended') void context.resume().catch(() => undefined);
      const master = context.createGain();
      master.gain.value = useSoundSetting.getState().muted ? 0 : MUSIC_GAIN;
      master.connect(context.destination);
      const tune = RESULT_TUNES[outcome];
      scheduleTune(context, master, tune, context.currentTime + LEAD_IN_S);
      const timer = window.setTimeout(() => this.stop(), (LEAD_IN_S + tune.duration) * 1000);
      this.session = { context, master, timer };
    } catch {
      // Without Web Audio there is no music; the result is given as text anyway.
    }
  }

  /** Fades out the tune that is playing, if any. */
  stop(): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    window.clearTimeout(session.timer);
    const { context, master } = session;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, 0.03);
    window.setTimeout(() => void context.close().catch(() => undefined), 200);
  }
}

export const resultMusic = new ResultMusic();

/**
 * Schedules every note of a tune, from `start` in the time of the context,
 * into `destination`. It works on an offline context too, which renders the
 * tune without playing it.
 */
export function scheduleTune(
  context: BaseAudioContext,
  destination: AudioNode,
  tune: Tune,
  start: number,
): void {
  // Peaks are held down so that full chords do not distort.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 4;
  limiter.ratio.value = 12;
  limiter.connect(destination);
  const bus = context.createGain();
  bus.connect(limiter);
  if (tune.hall > 0) {
    const send = context.createGain();
    send.gain.value = tune.hall;
    bus.connect(hall(context)).connect(send).connect(limiter);
  }
  const noise = whiteNoise(context);
  for (const note of tune.notes) {
    const t0 = start + note.at;
    const t1 = t0 + note.length;
    switch (note.voice) {
      case 'organ':
        organ(context, bus, note, t0, t1);
        break;
      case 'brass':
        brass(context, bus, note, t0, t1);
        break;
      case 'timpani':
        timpani(context, bus, noise, note, t0);
        break;
      case 'cymbal':
        cymbal(context, bus, noise, note, t0);
        break;
      case 'chip':
      case 'chipBass':
        chip(context, bus, note, t0, t1);
        break;
    }
  }
}

/** Frequency in hertz of a MIDI note number. */
function frequency(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

/** Rises to `peak` in `attack` seconds, holds until `t1`, then dies away in about `release`. */
function envelope(
  param: AudioParam,
  peak: number,
  t0: number,
  attack: number,
  t1: number,
  release: number,
): void {
  const held = Math.max(t0 + attack, t1);
  param.setValueAtTime(0, t0);
  param.linearRampToValueAtTime(peak, t0 + attack);
  param.setValueAtTime(peak, held);
  param.setTargetAtTime(0, held, release / 5);
}

/** A slow wobble of the pitch, in cents, that fades in from `from`. */
function vibrato(
  context: BaseAudioContext,
  rate: number,
  depthCents: number,
  from: number,
  until: number,
): GainNode {
  const oscillator = context.createOscillator();
  oscillator.frequency.value = rate;
  const depth = context.createGain();
  depth.gain.setValueAtTime(0, from);
  depth.gain.linearRampToValueAtTime(depthCents, from + 0.4);
  oscillator.connect(depth);
  oscillator.start(from);
  oscillator.stop(until);
  return depth;
}

/** Organ: a sine with a little of its octave and of a filtered sawtooth, swelling slowly. */
function organ(context: BaseAudioContext, out: AudioNode, note: Note, t0: number, t1: number) {
  const release = 1.5;
  const f = frequency(note.pitch);
  const gain = context.createGain();
  envelope(gain.gain, note.level, t0, note.attack ?? 1, t1, release);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(gain).connect(out);
  const partials: [OscillatorType, number, number][] = [
    ['sine', 1, 0.7],
    ['triangle', 2, 0.3],
    ['sawtooth', 1, 0.15],
  ];
  for (const [type, multiple, level] of partials) {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = f * multiple;
    const partial = context.createGain();
    partial.gain.value = level;
    oscillator.connect(partial).connect(filter);
    oscillator.start(t0);
    oscillator.stop(t1 + release);
  }
}

/** Brass: two slightly detuned sawtooth waves through a filter that opens as the note speaks. */
function brass(context: BaseAudioContext, out: AudioNode, note: Note, t0: number, t1: number) {
  const release = 0.4;
  const attack = note.attack ?? 0.1;
  const f = frequency(note.pitch);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(f * 1.2, t0);
  filter.frequency.linearRampToValueAtTime(f * 7, t0 + attack + 0.05);
  filter.frequency.setTargetAtTime(f * 4, t0 + attack + 0.05, 0.4);
  const gain = context.createGain();
  envelope(gain.gain, note.level, t0, attack, t1, release);
  filter.connect(gain).connect(out);
  const wobble = vibrato(context, 5, 6, t0 + 0.3, t1 + release);
  for (const detune of [-7, 7]) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = f;
    oscillator.detune.value = detune;
    wobble.connect(oscillator.detune);
    oscillator.connect(filter);
    oscillator.start(t0);
    oscillator.stop(t1 + release);
  }
}

/** Timpani: a sine that settles on its pitch, an overtone, and the thud of the stick. */
function timpani(
  context: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  note: Note,
  t0: number,
) {
  const f = frequency(note.pitch);
  const ring = (multiple: number, level: number, decay: number) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.setValueAtTime(f * multiple * 1.1, t0);
    oscillator.frequency.exponentialRampToValueAtTime(f * multiple, t0 + 0.1);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(level, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    oscillator.connect(gain).connect(out);
    oscillator.start(t0);
    oscillator.stop(t0 + decay + 0.02);
  };
  ring(1, note.level, note.length);
  ring(1.5, note.level * 0.35, note.length * 0.6);
  const stick = context.createBufferSource();
  stick.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  const gain = context.createGain();
  gain.gain.setValueAtTime(note.level * 0.5, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  stick.connect(filter).connect(gain).connect(out);
  stick.start(t0);
  stick.stop(t0 + 0.14);
}

/** Cymbal: high noise that dies away slowly. */
function cymbal(
  context: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  note: Note,
  t0: number,
) {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 5000;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(note.level, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.length);
  source.connect(filter).connect(gain).connect(out);
  source.start(t0);
  source.stop(t0 + note.length + 0.02);
}

/**
 * The sound of old game consoles. The melody is a square wave through a
 * resonant filter that opens fast and closes slowly, the "wah" of a muted
 * trombone; the bass is a plain triangle wave.
 */
function chip(context: BaseAudioContext, out: AudioNode, note: Note, t0: number, t1: number) {
  const release = 0.08;
  const melody = note.voice === 'chip';
  const f = frequency(note.pitch);
  const oscillator = context.createOscillator();
  oscillator.type = melody ? 'square' : 'triangle';
  oscillator.frequency.value = f;
  if (note.bend) {
    oscillator.detune.setValueAtTime(0, t0 + (t1 - t0) / 2);
    oscillator.detune.linearRampToValueAtTime(note.bend * 100, t1);
  }
  if (note.vibrato) vibrato(context, 6, 35, t0 + 0.15, t1 + release).connect(oscillator.detune);
  const gain = context.createGain();
  envelope(gain.gain, note.level, t0, note.attack ?? 0.015, t1, release);
  if (melody) {
    const wah = context.createBiquadFilter();
    wah.type = 'lowpass';
    wah.Q.value = 6;
    wah.frequency.setValueAtTime(f * 1.5, t0);
    wah.frequency.exponentialRampToValueAtTime(f * 8, t0 + 0.09);
    wah.frequency.exponentialRampToValueAtTime(f * 2.5, t1);
    oscillator.connect(wah).connect(gain);
  } else {
    oscillator.connect(gain);
  }
  gain.connect(out);
  oscillator.start(t0);
  oscillator.stop(t1 + release);
}

/** The echo of a large hall: noise that dies away, used as an impulse response. */
function hall(context: BaseAudioContext): ConvolverNode {
  const length = Math.floor(context.sampleRate * HALL_S);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  const convolver = context.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

function whiteNoise(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}
