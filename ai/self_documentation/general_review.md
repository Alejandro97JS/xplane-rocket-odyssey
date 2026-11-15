# General review, 2026-11-15

The owner asked, in Spanish, for a general review of the whole game: function, accessibility, user experience, interface, technical correctness, coherence and documentation, changing whatever needed it, without committing or pushing. This document records what was checked, what was changed and why, and what was found but left for the owner. None of it is approved yet; nothing here changes a rule in `ai/standards`.

## How it was reviewed

- Read the standards, the record in this folder, the `README.md`, every source file of `game-core`, the client and the server, and the tests.
- Ran every check before changing anything: 248 unit tests and 36 end-to-end tests passed, with type checks and ESLint. `npm run format:check` failed on 11 files, only because of their line endings (see below).
- Printed the texts of the flight and of the debrief for designs with several payloads and with a crew of one.
- Looked at the screens in Chrome with forced colours, the mode that Windows High Contrast uses, through the `forcedColors` option of Playwright.
- Checked the production build served locally: the headers of the page and the size of the scripts with and without gzip.

## What was changed

| Area | Change | Why |
| --- | --- | --- |
| Texts of the flight and of the debrief | The verbs agree with several payloads: "the core module and laboratory module separate from the second stage and fly free", "the test capsule and classic capsule have no shielding", "so their crews were exposed", "The capsules enter the Van Allen belts". A crew of one is "the astronaut", not "the crew of 1". New helpers `agree`, `crewOf` and `upperFirst` in `packages/game-core/src/format.ts`. | The sentences were written for one payload and read wrong with several, which level 5 and free exploration allow. |
| Over-budget warning | Choosing another contract forgets that the warning was dismissed (`level/select` in `reducer.ts`). Going to free exploration and back to the same contract keeps it dismissed. | The warning had been read against the budget of the other contract. With the same cost, the new contract let the player move on without it. |
| Server | Answers are compressed with gzip (`hono/compress`). Every HTML answer, `/` and `/index.html` included, has `Cache-Control: no-cache`. | The two improvements found on 2026-11-14 (see [use_case_1_implementation.md](use_case_1_implementation.md)). The main script goes from 364 kB to 109 kB over the network. Before, `/` could stay in the cache of the browser and, after a deployment, ask for scripts that no longer exist. |
| Error screen | A screen that cannot be shown is replaced by "Lost contact" (`apps/web/src/screens/ErrorScreen.tsx`), inside the layout shared by every screen, with "Reload the game" and "Back to the title screen". The router has a route with no address that holds every screen and this error element. | The launch and the debrief are loaded on demand. A player with the game open while a new version was deployed got the error page React Router shows to developers, with no way back. |
| Loading message | "Loading mission control…" is now inside `<main id="main">`. | The skip link pointed nowhere while it showed, and the message was outside every landmark. |
| Mission cards | The record of a completed mission reads "Completed · best 100" and is part of the description of the card. | "Completed · 100" did not say what 100 was, and screen readers did not read it. |
| Forced colours | Rules for `@media (forced-colors: active)` in `apps/web/src/styles/index.css`, and two `forced-colors:` utilities in the delta-v chart. Frames, cards and buttons get a plain border; the chosen card gets an outline in the selection colour; ticks, bars and the current step are drawn with system colours; the backdrop is hidden. | Seen in Chrome with forced colours: every option card showed its tick, chosen or not, so the choice could not be seen; frames, cards and buttons lost their edges; the bars of the budget, the load and the propellant lost their fill; the delta-v chart lost its bars. |
| `<noscript>` | A sentence in `apps/web/index.html`. | Without JavaScript the page was blank. |
| Line endings | `.gitattributes` with `* text=auto eol=lf`. The working copies with CRLF were checked out again, now with LF; their content did not change. | With `core.autocrlf=true`, Git on Windows wrote CRLF, and Prettier, which expects LF, failed on 11 files that were correctly formatted. |

The `README.md` gained one line in its accessibility section about forced colours. No screenshot needed capturing again: none shows a completed mission, several payloads deploying or forced colours.

## Tests added

- `packages/game-core/test/flight.test.ts`: the texts agree with several payloads and with one, and a crew of one is "the astronaut".
- `packages/game-core/test/reducer.test.ts`: the same cost is warned about again under the budget of another contract.
- `apps/server/test/app.test.ts`: `/` and `/index.html` are never cached; text is compressed for clients that accept gzip and sent as it is to the others.
- `e2e/play.spec.ts`: a screen that cannot be loaded shows the error screen, with focus on its heading, its title, the credits banner and no axe violations, and leads back to the title screen. The record of a mission is part of the description of its card.
- `e2e/accessibility.spec.ts`: in forced colours only the chosen card shows its tick, and the budget bar keeps its fill.

Each new test fails on the code as it was before.

## Results

On 2026-11-15, after the changes: 255 unit tests and 38 end-to-end tests pass, with type checks, ESLint and Prettier. The error screen, the new record on the mission cards at 1280 and 320 pixels, and the title, the planning steps, the summary, the launch and the debrief in forced colours were looked at in screenshots of the production build.

## Found and not changed, for the owner

1. **The trajectory map draws a high elliptical orbit as a circle** at its apogee. The map says "Map not to scale", but the shape is not that of the orbit.
2. **Two announcements on the orbit step.** When the choice changes, a screen reader reads the card, then the preview of the orbit (a live region) and the totals below it (a status region). A pass with a screen reader should decide whether the preview should stay a live region.
3. **`ai/standards/use_case_1_launch.md` is stored with CRLF**, unlike every other text file. With the new `.gitattributes` it will be stored with LF the next time it is committed, and that commit will show every line as changed.
4. **Forced colours were checked with the emulation of Chrome**, not with Windows High Contrast itself, and not with a light and a dark theme of it.
5. **The deployed game was not updated.** Each deployment needs the owner's confirmation.
