# Tech stack: decision record

The stack itself, with its architecture and accessibility rules, is defined in `ai/standards/tech_stack.md`. That file is the one to follow. This document records why the stack was chosen and what was checked. If the two ever differ, the standard is right and this record needs correcting.

**Status:** Proposed on 2026-11-14 and approved by the project owner the same day. Implemented the same day with use case 1; see [use_case_1_implementation.md](use_case_1_implementation.md).

## What drove the choice

- Browser game, deployed on Railway, with a local development setup.
- MVP is single player, with no accounts and no saved data: title screen, level selection, one level (use case 1, rocket launch).
- The level is mostly parameter screens (forms, dashboards) followed by one animated launch and a written explanation of the outcome.
- Accessibility target is WCAG 2.1 AA.
- Game logic must stay separate from the UI and the game state must be serializable. A database may be added soon; multiplayer (up to 4 players) may come later.
- The launch outcome comes from simple deterministic rules, and the animation must show that outcome.
- The agent implements everything, so the stack avoids anything that needs art assets or tools the owner would have to install.

## Reasons for each choice

| Choice | Reason |
| --- | --- |
| TypeScript everywhere | One language for game rules, UI and server; the rules can be shared between client and server. |
| Node.js 24 LTS | Already installed on the owner's machine; supported by Railway. |
| npm workspaces | No extra tooling to install. Package boundaries enforce the separation between logic and UI. |
| `packages/game-core` in plain TypeScript | Pure functions and plain JSON state run unchanged on a server later, which persistence and multiplayer both need. |
| Zod | One schema gives both the type and the runtime validator for player parameters and serialized state. |
| React 19 with Vite | The game is mostly accessible forms and dashboards, which is DOM work, not canvas work. |
| React Aria Components | Unstyled sliders, radio groups, selects, dialogs and tabs with keyboard and screen reader behaviour built in. |
| Tailwind CSS 4 with tokens | Fast to build with; colour tokens are checked once for AA contrast. |
| React Router 8 | Each screen has a URL, so the browser back button works and focus can be managed on navigation. |
| Zustand | A small store that can wrap the `game-core` reducer without adding rules of its own. |
| PixiJS 8 | 2D GPU rendering with particles (exhaust, smoke, debris). The rocket is drawn procedurally, so no art assets are needed. |
| Hono on Node | Railway needs a process to serve the files anyway. Our own server costs about the same and is where the API, the database and WebSockets go later. |
| Vitest | Table-driven tests of the launch rules: one case per failure cause and per success path. |
| Playwright with axe | Plays the level through in a real browser and runs automated WCAG 2.1 AA checks on each screen. |
| ESLint with `jsx-a11y`, and Prettier | Catches accessibility mistakes while writing code. |
| `Dockerfile` and `railway.json` | One Railway service, and the same image runs locally with Docker. |

Computing the simulation before animating it was chosen so that the animation cannot disagree with the result, and so that the written explanation comes from the same data as the animation.

## Version check

Checked against the npm registry on 2026-11-14. Two packages must stay one major version behind the latest release:

| Package | Latest | Use | Reason |
| --- | --- | --- | --- |
| `typescript` | 7.0.2 | 6.0.3 | `typescript-eslint` 8.72 supports TypeScript `>=4.8.4 <6.1.0`. |
| `eslint` | 10.15.0 | 9.39.5 | `eslint-plugin-jsx-a11y` 6.10 supports ESLint up to 9. |

Everything else uses the latest release, and the peer dependency ranges and Node engine ranges were checked against each other and against Node 24.16: Vite 8.3, React 19.3, `@vitejs/plugin-react` 6.3, React Aria Components 1.22, Tailwind CSS 4.3, React Router 8.5, Zustand 5.1, Zod 4.6, PixiJS 8.23, Hono 4.13, `@hono/node-server` 2.1, Vitest 5.1, Playwright 1.65, `@axe-core/playwright` 4.14, Prettier 3.10.

React Router 8 is newer than the version the stack was first proposed with. Read its documentation before using it. React Router 7.18 is the fallback; switching to it changes the standard, so it needs the owner's approval.

## Development machine check

Checked on 2026-11-14 on the project owner's Windows 11 machine.

| Item | State | Consequence |
| --- | --- | --- |
| Node.js 24.16, npm 11.13, Git 2.46 | Installed | Nothing to install to develop and run the game locally. |
| npm registry | Reachable | Libraries are installed into the project's `node_modules`, not system-wide. |
| Chrome and Edge | Installed | Playwright uses the installed Chrome. |
| Ports 3000 and 5173 | Free | Default ports can be used. |
| Docker 27.5 and Compose 2.32 | Installed, but Docker Desktop was not running | Optional. Only needed to run the production image locally; Railway builds the image itself. |
| Railway CLI 4.30 | Installed, session expired | The owner must run `railway login`, or connect the GitHub repository from the Railway dashboard. |
| Free space on `C:` | 11.1 GB | Enough for the project (under 1 GB). Local Docker builds would take 1 to 2 GB more. |

## Alternatives considered

- **Game engine for everything (Phaser, Unity WebGL):** rejected. The whole UI would live in a canvas, which makes WCAG 2.1 AA very hard to reach.
- **Next.js or SvelteKit:** rejected. Server rendering brings nothing to a game with no content pages, and a long-lived WebSocket server fits a plain Node server better.
- **Static site only, no server:** rejected. Railway needs a process to serve the files anyway, and our own server costs about the same and gives the future API a home.
- **Three.js (3D launch):** not chosen for the MVP. It looks more impressive but needs 3D assets and more work for the same gameplay. The renderer is isolated behind the timeline, so it can be swapped later.

## Notes from the implementation

Found while building use case 1 on 2026-11-14. None of them changes the stack.

- **React Router 8** was used as documented for version 7: `createBrowserRouter`, `RouterProvider` from `react-router/dom`, lazy screens. The fallback to version 7 was not needed.
- **TypeScript 6** no longer includes `@types` packages by default. Each `tsconfig.json` lists the ones it needs in `types`.
- **Node 24 runs TypeScript directly**, so the server needs no extra tool in development: `node --watch src/index.ts`. For that to work the code uses only syntax that can be erased (`erasableSyntaxOnly`), and relative imports carry the `.ts` extension.
- **`@hono/node-server` 2:** the `onFound` option of `serveStatic` runs after the response has been created, so headers set in it are lost. The cache header of built assets is set in a middleware of our own, after `next()`.
- **`serveStatic` resolves its root from the working directory.** The server computes the path of the client build relative to it.
- **PixiJS 8:** only containers may have children. The scene asks for the WebGL renderer explicitly and is drawn by our own clock, not by the ticker of PixiJS, so that it can be paused and restarted.
- **Zustand 5** needs selectors that return the same value for the same state. The `useGame` hook subscribes to the whole state and derives values while rendering.
- **Two small development tools were added** that the stack table does not list: `concurrently`, to run the client and the server together in `npm run dev`, and `globals`, for ESLint.
- **Fonts** are Exo 2 and Share Tech Mono, served from the build through the `@fontsource` packages. No request leaves for a font service.
- **`npm audit`** reports 7 moderate advisories in the chain of `typescript-eslint`. They are in development tools only.

## Open points

- The Railway session has expired. The owner must log in before the first deployment, and each deployment needs the owner's confirmation.
- The `Dockerfile` has not been built: Docker Desktop was not running. See [use_case_1_implementation.md](use_case_1_implementation.md).
- The owner judges whether the launch animation looks credible, and a real screen reader pass has to be done by a person.
- The questions about the launch rules are in [use_case_1_launch_rules.md](use_case_1_launch_rules.md).
