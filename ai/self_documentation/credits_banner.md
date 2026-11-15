# Credits banner

On 2026-11-15 the owner asked for a thin banner at the bottom of every screen, saying that the game is made by the XPlane team and that it takes part in the NASA Space Apps Challenge, at the Salamanca (Spain) local event. The owner's rules are in `ai/standards/credits_banner.md`. This document records how it was built and why.

## What it says

"Made by the XPlane team · Taking part in the NASA Space Apps Challenge, Salamanca (Spain) local event."

The owner asked in Spanish ("sede de Salamanca"); the standards ask for everything in English. "Local event" is the name the Space Apps Challenge gives to its venues. The names of the team and of the challenge are in bold, so they can be found at a glance.

## Where it is

- `apps/web/src/components/CreditsBanner.tsx`: the banner.
- `apps/web/src/app/RootLayout.tsx`: the layout shared by every screen places it after the screen, full width. The screen keeps its column of at most 72 rem; the banner spans the whole window, with its text in the same column.

Because it is in the shared layout, every address shows it: the title screen, the five planning steps, the launch, the debrief, the page for an unknown address and the "Loading mission control…" message shown while the launch or the debrief loads.

## Decisions

| Decision | Why |
| --- | --- |
| It ends the page instead of being fixed to the window | A bar fixed to the bottom would always cover part of the screen: the buttons at the end of each step, the controls of the launch, and on a phone, where the text wraps, about 77 pixels of a 640-pixel window. The layout is a column as tall as the window at least, so on a short screen, such as the title screen on a computer, the banner still sits at the bottom of the window. |
| An opaque fill, the darkest colour of the palette (`space-950`, `#020611`), with a thin line above in `line-dim` | It lies over the glowing rim of the Earth in the backdrop, where text over the backdrop would not have a measurable contrast. On that fill, the text (`ink-soft`) has a contrast of 14.3:1 and the names in bold (`ink`) 18.8:1, above the 4.5:1 of WCAG 2.1 AA. |
| Small text, 14 pixels, 37 pixels high in all on a computer | The owner asked for a thin banner. 14 pixels (`text-sm`) is the size of the tagline in the header on a phone, and still easy to read. On a 320-pixel screen it wraps to three lines and grows to 77 pixels, and nothing scrolls sideways. |
| A `<footer>` outside `<main>` | It is the `contentinfo` landmark of the page, so screen reader users can reach it from the list of landmarks, and it is not part of the content that "Skip to main content" jumps to. |
| A dot between the two sentences, hidden from screen readers, and a full stop only screen readers hear | Screen readers would read the dot aloud or run the two sentences together. On narrow screens the dot is hidden and the two sentences take a line each. |
| No links and no logos | The owner asked for a text. A link to the challenge would add a Tab stop to every screen and lead out of the game. The NASA logo has its own rules of use. |

## Tests

- The end-to-end test "every screen ends with who made the game and the challenge it takes part in", in `e2e/play.spec.ts`, checks that the title screen, the summary, the launch, the debrief and the page for an unknown address each have one `contentinfo` landmark with both sentences.
- The automated axe checks already run on every screen, so they now check the banner too: colour contrast, landmarks and that all content is inside a landmark. The reflow test at 320 pixels covers it the same way.
- On 2026-11-15, 248 unit tests and 30 end-to-end tests passed, with type checks, ESLint and Prettier. The banner was also looked at in the screenshots of the production build in Chrome, at 1440 pixels on the title screen and the debrief, and at 320 pixels.

## Screenshots of the README

The banner is at the bottom of the page, so it shows only in the screenshots that reach the bottom. The position of the banner was measured with each screenshot's screen, design and viewport, as recorded in [readme.md](readme.md):

| Image | Banner |
| --- | --- |
| `debrief-success.webp`, `debrief-failure.webp` | Shows, because they are grown to the height of the page. Captured again; each is 37 pixels taller. |
| `title.webp` | Shows, in the bottom 37 pixels. Another session was changing the title screen at the same time, to add a "How to play" guide, and captures it again with its change; see [readme.md](readme.md). |
| `step-*.webp`, `launch.webp`, `free-exploration.webp`, `phone-*.webp`, `launch.gif` | Do not show it. The pages are taller than the captured area, which is unchanged: the launch page, for example, is 1,620 pixels tall when "Mission accomplished" appears, and `launch.webp` keeps its top 1,160. The GIF is cropped to the canvas. |

The README describes no part of the screens that the banner changes, so its text was not changed.

## Questions for the owner

1. Is the wording right, and is "XPlane" the name of the team as it should be written?
2. Should the banner stay at the end of the page, or be fixed to the bottom of the window, always visible, at the cost of covering part of each screen?
3. Should it link to the page of the Salamanca local event or of the challenge, or carry a logo?
