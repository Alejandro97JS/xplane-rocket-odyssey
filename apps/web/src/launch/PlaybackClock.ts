export type PlaybackStatus = 'playing' | 'paused' | 'finished';

type Listener = (seconds: number, status: PlaybackStatus) => void;

/**
 * The clock that drives the launch animation. It advances with the frames of
 * the browser, can be paused and resumed at any time, and stops at the end.
 * The canvas and the telemetry both listen to it, so they never disagree.
 */
export class PlaybackClock {
  private seconds = 0;
  private status: PlaybackStatus = 'paused';
  private frame = 0;
  private lastTick = 0;
  private readonly listeners = new Set<Listener>();
  readonly duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  get time(): number {
    return this.seconds;
  }

  get state(): PlaybackStatus {
    return this.status;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (this.status === 'playing') return;
    if (this.seconds >= this.duration) this.seconds = 0;
    this.status = 'playing';
    this.lastTick = performance.now();
    this.frame = requestAnimationFrame(this.tick);
    this.emit();
  }

  pause(): void {
    if (this.status !== 'playing') return;
    cancelAnimationFrame(this.frame);
    this.status = 'paused';
    this.emit();
  }

  /** Jumps to a moment of the playback without changing whether it is running. */
  seek(seconds: number): void {
    this.seconds = Math.min(this.duration, Math.max(0, seconds));
    if (this.seconds >= this.duration) {
      cancelAnimationFrame(this.frame);
      this.status = 'finished';
    } else if (this.status === 'finished') {
      this.status = 'paused';
    }
    this.emit();
  }

  /** Stops the clock and forgets its listeners. It can be started again afterwards. */
  dispose(): void {
    cancelAnimationFrame(this.frame);
    if (this.status === 'playing') this.status = 'paused';
    this.listeners.clear();
  }

  private readonly tick = (now: number) => {
    // A tab in the background gets no frames. Without a limit, coming back
    // to it would jump the animation forward by the whole time away.
    const elapsed = Math.min(0.1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.seconds = Math.min(this.duration, this.seconds + elapsed);
    if (this.seconds >= this.duration) {
      this.status = 'finished';
      this.emit();
      return;
    }
    this.emit();
    this.frame = requestAnimationFrame(this.tick);
  };

  private emit(): void {
    for (const listener of this.listeners) listener(this.seconds, this.status);
  }
}
