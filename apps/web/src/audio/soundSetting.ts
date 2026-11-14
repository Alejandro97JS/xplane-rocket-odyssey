import { create } from 'zustand';

/** Where the choice is kept. It is the key the launch sound has used since it was added. */
const STORAGE_KEY = 'rocket-odyssey:sound-muted';

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // Storage may be blocked; the choice then lasts until the page is reloaded.
  }
}

interface SoundSetting {
  muted: boolean;
  toggleMuted: () => void;
}

/**
 * Whether the game is muted. There is one setting for every sound of the
 * game, so the sound buttons of the launch and of the debrief always agree,
 * and the choice is remembered between visits. It is a preference of the
 * interface, not part of the game, so it lives outside the game-core store.
 */
export const useSoundSetting = create<SoundSetting>((set) => ({
  muted: readMuted(),
  toggleMuted: () =>
    set((setting) => {
      const muted = !setting.muted;
      writeMuted(muted);
      return { muted };
    }),
}));
