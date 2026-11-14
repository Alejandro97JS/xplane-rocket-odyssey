import { useSoundSetting } from '../audio/soundSetting.ts';
import { ActionButton } from './ActionButton.tsx';
import { SoundOffIcon, SoundOnIcon } from './icons.tsx';

/**
 * Turns every sound of the game off or on, and the choice is remembered. It
 * is shown wherever sound plays by itself (WCAG 1.4.2).
 */
export function SoundToggle() {
  const muted = useSoundSetting((setting) => setting.muted);
  const toggleMuted = useSoundSetting((setting) => setting.toggleMuted);
  return (
    <ActionButton size="small" onPress={toggleMuted}>
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      {muted ? 'Turn sound on' : 'Mute sound'}
    </ActionButton>
  );
}
