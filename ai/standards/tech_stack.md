# Tech stack

This is the tech stack approved by the project owner on 2026-11-14. Follow it. Changing any choice in this file needs the owner's approval.

The reasons for each choice, the alternatives that were rejected and the compatibility checks are recorded in `ai/self_documentation/tech_stack.md`.

## Stack

| Area | Use |
| --- | --- |
| Language | TypeScript 6.0.x in strict mode, in every package |
| Runtime | Node.js 24 LTS |
| Repository layout | npm workspaces |
| Game logic | Plain TypeScript package, `packages/game-core` |
| Validation | Zod |
| UI framework | React 19 with Vite |
| Accessible components | React Aria Components |
| Styling | Tailwind CSS 4, with design tokens as CSS variables |
| Routing | React Router 8, client-side only |
| UI state | Zustand |
| Launch animation | PixiJS 8 on a single `<canvas>` |
| Server | Hono on Node |
| Unit tests | Vitest |
| End-to-end and accessibility tests | Playwright with `@axe-core/playwright`, using the Chrome installed on the machine |
| Linting and formatting | ESLint 9.x with `typescript-eslint` and `eslint-plugin-jsx-a11y`; Prettier |
| Deployment | Multi-stage `Dockerfile` and `railway.json`, as one Railway service |

## Version pins

- TypeScript stays on 6.0.x until `typescript-eslint` supports TypeScript 7.
- ESLint stays on 9.x until `eslint-plugin-jsx-a11y` supports ESLint 10.
- Every other package uses its latest stable release when it is first installed. The lockfile is committed.

## Repository structure

```
packages/game-core   Rules, state, simulation. No UI dependencies.
apps/web             React client. Renders state, dispatches actions, plays the simulation back.
apps/server          Hono server. Serves the client build; future API.
```

## Architecture rules

1. All game rules live in `packages/game-core`. It must not depend on React, the DOM, PixiJS or the server.
2. Game state is plain JSON, so it can be serialized, and it is validated with Zod when it enters the system.
3. State changes only through `reduce(state, action)` in `game-core`. The Zustand store is a thin binding over that reducer and holds no rules of its own.
4. The simulation is computed first and animated second. `simulate(design)` returns the outcome, a timeline of events and the reasons for the outcome. The canvas only plays that timeline back, and the written explanation is built from the same data.
5. The simulation is deterministic: the same design always gives the same outcome.
6. In the MVP the server only serves the built client and a `/health` endpoint. Do not add a database, accounts or multiplayer until the owner asks for them.

## Accessibility rules

A canvas is invisible to assistive technology, so the canvas must never be the only carrier of information:

- Show telemetry (altitude, velocity, fuel, mission clock) as DOM text next to the canvas.
- Write mission events to a log in an `aria-live` region.
- Give the result and its explanation as ordinary text.
- When `prefers-reduced-motion` is set, show the launch as a step-by-step timeline instead of the animation.
- Let the player pause and skip the animation (WCAG 2.2.2).
- Do not let explosions flash more than three times per second (WCAG 2.3.1).
- Run the automated axe checks on every screen. They find only part of the problems, so also check each screen with the keyboard alone.

## Local development

The repository must provide these commands from its root:

- `npm run dev`: Vite dev server with hot reload, plus the server in watch mode, with `/api` proxied to the server.
- `npm run build` then `npm start`: the production build on `localhost`, as Railway runs it.
- `npm test`: unit tests. `npm run test:e2e`: end-to-end and accessibility tests.
- `docker compose up`: the same image that Railway runs. This one is optional.

## Deployment

- One Railway service, built from the `Dockerfile`.
- The server listens on the `PORT` environment variable, and Railway checks `/health`.
- Each deployment needs the owner's confirmation.

## Planned later, not built now

- Persistence: PostgreSQL on Railway with Drizzle ORM.
- Multiplayer: WebSockets on the same Hono server. The server applies the same `game-core` reducer and broadcasts the resulting state.
