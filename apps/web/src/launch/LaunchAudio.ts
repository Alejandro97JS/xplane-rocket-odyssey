import { missionTimeAt, telemetryAt, type Playback } from './playback.ts';
import type { PlaybackStatus } from './PlaybackClock.ts';

/**
 * Sound of the launch, made with the Web Audio API, so no audio files are
 * needed. It depends only on the playback time, like the canvas, so pausing,
 * restarting and skipping keep it in step with the picture.
 *
 * - Countdown: one beep per mission second, higher for the last three.
 * - From ignition: the roar of the engines while they fire inside the
 *   atmosphere. It fades as the air thins and stops at the edge of space,
 *   because sound does not travel through a vacuum.
 * - A breakup inside the atmosphere is heard as a dull boom.
 *
 * The audio adds nothing that is not already given as text, so it can be
 * turned off without losing information (WCAG 1.4.2).
 */

/** The Kármán line, the conventional edge of space. Above it there is no sound. */
const EDGE_OF_SPACE_KM = 100;
/** Loudest level of the engine roar, from 0 to 1. */
const ROAR_GAIN = 0.55;
const BEEP_GAIN = 0.18;
/** How quickly the roar follows its target level, in seconds. */
const ROAR_SMOOTHING_S = 0.08;

export class LaunchAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private roar: GainNode | null = null;
  private rumble: BiquadFilterNode | null = null;
  private lastT: number | null = null;
  private muted: boolean;
  private readonly countdownStart: number;
  private readonly holdAt: number;
  private readonly breakupAt: number | null;
  private readonly playback: Playback;

  constructor(playback: Playback, muted: boolean) {
    this.playback = playback;
    this.muted = muted;
    const { flight } = playback;
    this.countdownStart = flight.phases[0]?.tStart ?? -10;
    const hold = flight.events.find((e) => e.id === 'hold');
    // Beeps stop when the clock is held; otherwise they run up to liftoff.
    this.holdAt = hold ? hold.t : 0;
    const breakup = flight.events.find((e) => e.id === 'structural_failure');
    this.breakupAt = breakup ? breakup.t : null;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.context.currentTime, 0.05);
    }
  }

  /** Called on every frame of the playback clock. */
  update(seconds: number, status: PlaybackStatus): void {
    const t = missionTimeAt(this.playback, seconds);
    if (status !== 'playing') {
      this.silence();
      this.lastT = t;
      return;
    }
    if (!this.ensureContext()) return;
    const context = this.context!;
    if (context.state === 'suspended') void context.resume();

    // A jump backwards (restart) or a big jump forwards (seek) plays nothing
    // for the moments it skips.
    // At the very start, the first beep of the countdown is due now.
    const previous = seconds <= 0 ? this.countdownStart - 1e-3 : this.lastT;
    const continuous = previous !== null && t >= previous && t - previous < 2;
    if (continuous) this.playCrossings(previous, t);
    this.lastT = t;

    const telemetry = telemetryAt(this.playback.flight, t);
    const air = Math.max(0, 1 - telemetry.altitudeKm / EDGE_OF_SPACE_KM);
    // The engines are already firing between ignition and liftoff, held down by the clamps.
    const firing = telemetry.burning > 0 || this.isIgnited(t);
    const level = firing ? ROAR_GAIN * air ** 1.5 : 0;
    this.roar!.gain.setTargetAtTime(level, context.currentTime, ROAR_SMOOTHING_S);
    // Thinner air carries less of the high end, so the roar gets duller with height.
    this.rumble!.frequency.setTargetAtTime(150 + 650 * air, context.currentTime, 0.2);
  }

  destroy(): void {
    void this.context?.close();
    this.context = null;
  }

  private isIgnited(t: number): boolean {
    const ignition = this.playback.flight.events.find((e) => e.id === 'ignition');
    return ignition !== undefined && t >= ignition.t && t < 0.5;
  }

  /** Plays the beeps and booms whose moment lies in (from, to]. */
  private playCrossings(from: number, to: number): void {
    const end = Math.min(to, this.holdAt - 1e-6);
    for (let s = Math.floor(from) + 1; s <= end; s++) {
      if (s < this.countdownStart || s >= 0) continue;
      this.beep(s >= -3 ? 1320 : 880);
    }
    if (this.breakupAt !== null && from < this.breakupAt && to >= this.breakupAt) {
      const altitude = telemetryAt(this.playback.flight, this.breakupAt).altitudeKm;
      if (altitude < EDGE_OF_SPACE_KM) this.boom(1 - altitude / EDGE_OF_SPACE_KM);
    }
  }

  private silence(): void {
    if (this.context && this.roar) {
      this.roar.gain.cancelScheduledValues(this.context.currentTime);
      this.roar.gain.setTargetAtTime(0, this.context.currentTime, 0.03);
    }
  }

  private ensureContext(): boolean {
    if (this.context) return true;
    const AudioContextClass = window.AudioContext as typeof AudioContext | undefined;
    if (!AudioContextClass) return false;
    try {
      const context = new AudioContextClass();
      const master = context.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(context.destination);

      // The roar: brown noise through a low-pass filter, looped.
      const source = context.createBufferSource();
      source.buffer = brownNoise(context, 4);
      source.loop = true;
      const rumble = context.createBiquadFilter();
      rumble.type = 'lowpass';
      rumble.frequency.value = 800;
      const roar = context.createGain();
      roar.gain.value = 0;
      source.connect(rumble).connect(roar).connect(master);
      source.start();

      this.context = context;
      this.master = master;
      this.rumble = rumble;
      this.roar = roar;
      return true;
    } catch {
      return false;
    }
  }

  private beep(frequency: number): void {
    const context = this.context!;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(BEEP_GAIN, now + 0.01);
    gain.gain.setValueAtTime(BEEP_GAIN, now + 0.11);
    gain.gain.linearRampToValueAtTime(0, now + 0.14);
    oscillator.connect(gain).connect(this.master!);
    oscillator.start(now);
    oscillator.stop(now + 0.16);
  }

  private boom(strength: number): void {
    const context = this.context!;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = brownNoise(context, 2.5);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.9 * strength, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(now);
    source.stop(now + 2.5);
  }
}

/** Random noise weighted towards low frequencies, which sounds like a rumble. */
function brownNoise(context: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}
