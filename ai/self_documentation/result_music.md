# Music of the result: what was built and why

On 2026-11-14, after Víctor added sound to the launch, the owner asked for music when the mission ends: for a success, music "without copyright that recalls the music of *2001: A Space Odyssey*"; for a failure, music "that recalls the typical music of games when you lose". The rules the owner set are in `ai/standards/result_music.md`. This document records how the music was made around them, why, and what is left for the owner to decide.

**Status:** built and tested on 2026-11-14. Only the three rules in the standard are the owner's. Everything else here is a proposal the owner has not approved. The tunes were checked by measurement, not by ear: nobody has listened to them yet.

## The tunes

| Decision | What the player hears | Why |
| --- | --- | --- |
| Our own tunes, synthesised in the browser | No audio files. The notes are written as data in `resultTunes.ts` and played with the Web Audio API, like the launch sound. | Copyright covers both the music and each recording of it. A tune of our own, played by code, has neither problem. It also adds no files to download, and it needs no change to the approved tech stack. |
| Success: a sunrise fanfare in D major, about 9 seconds of music plus the echo | A deep organ note grows out of silence. The brass calls slowly upwards, a fifth and then an octave, and opens into a major chord over a timpani roll. A short climb, pushed on by a second roll, ends on a full chord with organ, a timpani stroke and a crash, which dies away in the echo of a hall. | These are the features that make the music of the film recognisable: the deep note out of silence, the slow solemn call in open intervals, the major chord over timpani, the climax. The film uses *Also sprach Zarathustra* by Richard Strauss, who died in 1949. In Spain the works of authors who died before 7 December 1987 are protected for 80 years after their death, so that piece stays protected there until the end of 2029, and its recordings are protected on their own. So the tune quotes none of it: not its melody, not its change from major to minor chord and not its timpani pattern. This was not checked by a lawyer. |
| Failure: the "you lost" jingle, about 3 seconds | Four notes falling a semitone each, "wah, wah, wah, waaah", in the square wave of old game consoles over a triangle-wave bass. Each note opens and closes like a muted trombone; the last one wobbles and sags. | The falling semitones are the most widespread sound of losing, in games and outside them, and the square wave says "game". It is a generic figure, not the theme of any particular game. |
| One tune for all failures | A scrub on the pad, a breakup, a re-entry, a stranded payload, radiation and a missed objective all play the same jingle. Free exploration plays the same tunes as the contracts. | The owner asked for one kind of music for success and one for failure. The reason for the failure is already given in text, in the event log and the debrief. |

## When it plays

| Case | What happens | Why |
| --- | --- | --- |
| The animation plays to its end | The tune starts when the verdict appears under the canvas. It keeps playing when the player goes on to the debrief. | That is the moment the player learns the result. The music has an audio context of its own, so leaving the launch screen, which closes the context of the launch sound, does not cut it. |
| The player skips the animation, or sees the flight as a list | The tune plays when the debrief opens. | Every player should hear the result. The list for reduced motion has no sound of its own, and sound is not motion. |
| Going from the launch to the debrief | The tune does not start again. | It plays once per launch. The launch is recognised by its sequence number in the game state. |
| "Watch the launch again", "Play again" or "Restart" | Starting the playback cuts the tune short, and it plays again if the animation reaches its end again. | The roar of the new playback and the old tune should not overlap. Reaching the end again is hearing the result again. |
| Pausing just before the end | No music until the end is reached, or until the debrief opens. | The music announces a result the player has not seen yet. |

## Volume

Measured in Chrome by rendering each tune offline and filtering out what is below 200 Hz, roughly what a laptop speaker and the ear make of it:

| Moment | Level |
| --- | --- |
| The roar of the launch at liftoff, at its loudest, for comparison | −20 dB |
| Success: the brass call | about −33 to −25 dB |
| Success: the major chord over the roll | about −23 dB |
| Success: the final chord | about −17 dB |
| Failure, throughout | about −17 dB |

The success tune grows by about 16 dB from the call to the final chord. Both tunes are at most about 3 dB louder than the roar at liftoff. A limiter keeps full chords from distorting. The highest peak is below half of full scale.

## Muting

- There is one sound setting for the whole game, in `audio/soundSetting.ts`, a small Zustand store. The buttons of the launch and of the debrief use it, so they always agree. It is a preference of the interface, not part of the game, so it is not in the game-core state.
- The setting is kept in `localStorage` under the key the launch sound already used, so a player who had muted the launch stays muted.
- Muting while a tune plays fades it out; turning the sound on again brings it back.

## Accessibility

- **Audio control (1.4.2).** The success tune plays by itself for more than 3 seconds, so the page that plays it must offer a way to stop it. The launch has "Mute sound" next to Pause. The debrief has the same button at the top of the page, in the header, where the budget is on the planning steps; WCAG technique G170 asks for the control near the beginning of the page.
- The music carries no information that is not given as text: the verdict is written under the canvas and in the debrief.
- Nothing about the music flashes or moves.

## Where the code is

| Place | What changed |
| --- | --- |
| `apps/web/src/audio/resultTunes.ts` | New. The two scores, as data. |
| `apps/web/src/audio/ResultMusic.ts` | New. The instruments (organ, brass, timpani, cymbal and the console sounds), the echo of the hall, the limiter, and the player that plays a tune once per launch. `scheduleTune` also works on an offline context, which is how the volume was measured. |
| `apps/web/src/audio/soundSetting.ts` | New. The one sound setting of the game. |
| `apps/web/src/audio/useResultMusic.ts` | New. Plays the tune when the debrief opens, if it has not played for that launch. |
| `apps/web/src/components/SoundToggle.tsx` | New. The "Mute sound" / "Turn sound on" button, taken out of the launch screen so the debrief can use it too. |
| `apps/web/src/launch/useLaunchAudio.ts` | Uses the shared setting instead of its own, starts the tune when the playback reaches its end and cuts it when the playback starts. |
| `apps/web/src/screens/LaunchScreen.tsx` | Passes the outcome and the sequence number of the launch to the sound; uses `SoundToggle`. |
| `apps/web/src/screens/DebriefScreen.tsx` | Plays the tune if needed; `SoundToggle` in the header. |

## Tests

- `apps/web/test/resultTunes.test.ts`, 3 unit tests: every note can be played and ends before the tune does; the success tune is short and ends on the major chord of its key with the key note at the bottom; the failure jingle is short and only falls, a semitone at a time, with the last note sagging.
- `e2e/sound.spec.ts`, 3 end-to-end tests. They record the tunes without listening to them: only the result music uses the echo of a hall, and the wave shapes of its instruments tell the two tunes apart.
  - A scrubbed launch played to its end plays the failure jingle on the launch screen, and the debrief does not play it again.
  - A won launch whose animation is skipped plays the fanfare on the debrief.
  - The sound button of the debrief is in the header, and muting there shows on the launch screen and is kept in `localStorage`.
- The volume table above was measured in Chrome.

## Not verified

- **Nobody has listened to the music.** Whether the fanfare recalls the film and the jingle sounds like losing has to be judged by ear. The way to hear them is to play a mission to the end, once won and once lost, with the sound on.
- The sound of the instruments on other browsers and on phone speakers.
- Whether a screen reader talking over the music is a problem. The music starts at the same time as the verdict is announced.

## Questions for the owner

1. Do the tunes sound right, and is the fanfare (about 9 seconds) too long?
2. Should the best possible design of a contract, which scores 100, get something more than the normal fanfare?
3. Should every failure keep the same jingle, or should some, such as a breakup, sound different?
