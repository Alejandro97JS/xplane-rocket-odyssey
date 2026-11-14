# Use case 1: what was built

Use case 1, the launch, is implemented end to end: a title screen, five planning steps, the launch and the debrief. This document describes what exists and where. The decisions behind the rules are in [use_case_1_launch_rules.md](use_case_1_launch_rules.md) and the accessibility work in [accessibility.md](accessibility.md).

## The game, screen by screen

| Address | Screen | What the player does |
| --- | --- | --- |
| `/` | Title screen | Reads what the game is and starts. |
| `/plan/mission` | 1. Mission type | Chooses one of the five contracts and reads its briefing and budget. |
| `/plan/payload` | 2. Equipment & payload | Selects any number of the twelve payloads. Cost and mass add up as they change. |
| `/plan/orbit` | 3. Orbit selection | Chooses one of the five orbits and sees its path and the delta-v it needs. |
| `/plan/rocket` | 4. Rocket selection | Chooses one of the eight rockets and sees how much of its capacity the payload uses. |
| `/plan/summary` | 5. Mission summary | Reviews the design, the resources and the readiness, and presses Launch. |
| `/launch` | Launch | Watches the flight, with telemetry, a trajectory map and the mission events. Can pause, restart or skip. |
| `/debrief` | Mission debrief | Reads what happened and why, the hint, the five rules with their result, the numbers and the score. |

The player moves freely between the five steps with the stepper at the bottom of each one. The budget of the contract is in the header of every step. Every screen has its own address, so the back button of the browser works.

A flight ends in one of seven ways, each with its own animation and texts: success, scrubbed on the pad (over budget), breakup at Max-Q (payload too heavy), re-entry (short of delta-v before the first orbit), stranded (short of delta-v during the transfer), crew exposed to radiation, and objective missed.

## Where things are

```
packages/game-core/src
  ids.ts                 Identifiers of levels, payloads, orbits and rockets
  catalog/               The four tables of the use case, as data
  design.ts              What the player has chosen; totals of mass, cost and crew
  physics.ts             Rocket equation per stage; orbital speeds and periods
  rules.ts               evaluateMission: the five rules applied to a design
  flight.ts              buildFlight: events, phases and telemetry of the flight
  report.ts              buildReport: the written explanation
  score.ts               computeScore
  simulate.ts            simulate = evaluate + flight + report + score
  state.ts               GameState (plain JSON, Zod schema) and selectors
  reducer.ts             Actions and reduce(state, action)
  hints.ts, format.ts    Hint texts; number formatting

apps/web/src
  app/                   Router, layouts, the Zustand store, the list of steps
  screens/               One file per screen
  components/            Frame, buttons, option cards, stepper, meters, dialog, chart
  art/                   SVG drawings: payloads, orbits, missions, rockets, the Earth
  launch/                Playback clock and mapping, the PixiJS scene, telemetry, event log, map, step list
  styles/index.css       Design tokens and the few hand-written component styles

apps/server/src
  app.ts                 Hono app: /health, static files, fallback to the page of the game
  index.ts               Starts the server on PORT

e2e/                     Playwright tests: gameplay, keyboard, accessibility
```

## How the architecture rules are met

1. **All game rules live in `game-core`.** ESLint forbids it from importing React, PixiJS, Hono, Zustand or Node modules, and from using `window` or `document`.
2. **State is plain JSON, validated with Zod.** `GameState` holds the chosen level, the design, the last launch and the record of each level. `parseGameState` validates a state from outside. Actions are validated by `parseAction` every time the store dispatches one.
3. **State changes only through `reduce`.** The Zustand store in `apps/web/src/app/store.ts` holds the state and one `dispatch` that calls it.
4. **The simulation is computed first and animated second.** `simulate(levelId, design)` returns the evaluation, the flight (events, phases, telemetry), the report and the score. The canvas, the telemetry panel, the event log, the trajectory map and the debrief all read that one result. The state stores only the level and the design of the last launch; the result is recomputed from them.
5. **The simulation is deterministic.** No random numbers and no clock in `game-core`. Tests check that the same design gives an equal result twice and that the result survives JSON.
6. **The server serves the client build and `/health`**, nothing else.

## How the launch is played back

- `game-core` gives each event and telemetry sample a mission time in seconds. A flight to geostationary orbit lasts almost six hours.
- `apps/web/src/launch/playback.ts` maps mission time onto screen time. Each phase gets a fixed time on screen, so a whole flight takes between 7 and 55 seconds. The first 8 seconds of flight are shown in 3, so the liftoff can be seen.
- `PlaybackClock` advances with the frames of the browser and can be paused, restarted or moved.
- `LaunchScene` draws each frame as a function of the playback time. It keeps no state of its own apart from the smoke, so pausing, restarting and skipping are safe.
- The rockets are drawn from data in `art/rocketArt.ts`. The same geometry is drawn as SVG on the rocket cards and with PixiJS in the scene.
- The telemetry and the map are refreshed about eight times per second; the canvas on every frame.

How the altitude and speed curves are produced: during the climb they follow the delta-v delivered so far, with the share lost to gravity and air removed, so the speed equals the orbital speed exactly at insertion. During a transfer they follow the orbit equation. They are meant to look credible, as the standards ask, not to be a trajectory integration.

## Tests

| Command | What runs | Result on 2026-11-14 |
| --- | --- | --- |
| `npm test` | 208 unit tests: tables against the use case, physics, one case per failure and per valid path, every flight ending, reducer, serialization, playback mapping, rocket drawings, server. | All pass. |
| `npm run test:e2e` | 19 Playwright tests in Chrome against the production build: gameplay, keyboard only, reduced motion, axe on every screen, reflow at 320 pixels. | All pass. |
| `npm run typecheck` | TypeScript strict in the three packages and the end-to-end tests. | No errors. |
| `npm run lint` | ESLint with `typescript-eslint`, `jsx-a11y` and the rules of hooks. | No errors. |

## Not verified, and what is left

- **The Docker image has not been built.** Docker Desktop was not running on the development machine. The three stages were reproduced by hand outside Docker, on Windows, from a copy of the committed tree without the files that `.dockerignore` leaves out:
  - Build stage: `npm ci` from the manifests alone, then `npm run build`, produced `apps/web/dist` and `apps/server/dist`.
  - Dependencies stage: `npm ci --omit=dev --workspace @rocket-odyssey/server` installed 3 packages.
  - Runtime stage: with only `node_modules`, `apps/server/package.json` and the two build folders, the server started on `PORT` and answered `/health`, `/`, the addresses of the screens, the assets and `/api/*` as expected, also with the host name Railway uses for its health check.
  - What this does not cover is Alpine Linux. The lockfile does contain the musl builds of the native packages the build needs (Rolldown, Tailwind, Lightning CSS).
- **Nothing has been deployed.** Each deployment needs the confirmation of the owner, and the Railway session had expired. `main` is in step with `origin/main`, so a deployment from GitHub would get the current code. When the public domain is generated, its target port has to be the port the server prints in the deployment log: Railway sets `PORT` itself, and it may not be the 3000 of the `Dockerfile`.
- **Two things to improve in the server, found on 2026-11-14, neither blocking:**
  - `/` is answered by the static file handler, without `Cache-Control`. The other addresses of the game get `no-cache`. After a new deployment, a browser could keep an old page that asks for assets that no longer exist.
  - Responses are not compressed. The largest script is 346 kB, and 105 kB with gzip.
- **The game cannot be shown inside a frame on another site.** The server sends `X-Frame-Options: SAMEORIGIN`. This is the default of the secure headers and only matters if the game has to be embedded somewhere.
- **No screen reader has been used on the game.** The automated checks and the keyboard test pass, but a person has to do that pass.
- **The owner has to judge whether the animation looks credible.**
- **Use case 2** (`ai/standards/use_case_2_orbit.md`, the piloting phase after a successful design) is not implemented. The debrief of a success is where it would start.
- `npm audit` reports 7 moderate advisories, all in the chain of `typescript-eslint`, which is a development tool and is not part of what is deployed.
