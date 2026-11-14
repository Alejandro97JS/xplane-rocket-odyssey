# Rocket Odyssey

An educational game about designing a space mission. The player picks a contract, a payload, an orbit and a rocket, balances money, mass and delta-v, then launches and reads why the mission worked or failed.

This version contains use case 1, the launch: five missions, a launch animation and a written debrief.

## Requirements

- Node.js 24 or later, with npm.
- Google Chrome, only to run the end-to-end tests.
- Docker, only if you want to run the production image locally.

## Run it locally

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. The client reloads when a file changes, and the server restarts on port 3000.

To run the production build, as Railway runs it:

```sh
npm run build
npm start
```

Open <http://localhost:3000>. Set the `PORT` environment variable to use another port.

With Docker:

```sh
docker compose up --build
```

## Commands

| Command             | What it does                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload, plus the server in watch mode. `/api` and `/health` are proxied to the server. |
| `npm run build`     | Builds the client into `apps/web/dist` and the server into `apps/server/dist`.                                  |
| `npm start`         | Serves the built client and `/health` on `PORT` (3000 by default).                                              |
| `npm test`          | Unit tests of the rules, the client helpers and the server.                                                     |
| `npm run test:e2e`  | Builds, starts the server on port 3100 and plays the game in Chrome, with WCAG 2.1 AA checks on every screen.   |
| `npm run typecheck` | TypeScript in strict mode over every package and the end-to-end tests.                                          |
| `npm run lint`      | ESLint, including the accessibility rules for JSX.                                                              |
| `npm run format`    | Prettier over the whole repository.                                                                             |

## Structure

```
packages/game-core   Rules, state and simulation. No UI dependencies.
apps/web             React client. Renders state, dispatches actions, plays the simulation back.
apps/server          Hono server. Serves the client build and the health check.
e2e                  End-to-end and accessibility tests.
ai                   Standards the project follows and the record of what was done.
```

The rules of the game live in `packages/game-core` and nowhere else. A launch is computed first, by `simulate`, and animated second: the canvas only plays back the timeline that `simulate` returns, and the debrief is written from the same data.

## Deployment

The repository deploys to Railway as one service, built from the `Dockerfile` and configured by `railway.json`. The server listens on `PORT` and Railway checks `/health`.

## Documentation

- `ai/standards` holds the rules the project follows: the brief, the tech stack and the use cases.
- `ai/self_documentation/base.md` is the index of what has been built and why.
