# Self documentation index

This folder records what happens in this repository. This file is the index; update it in the same session as each change.

Approved decisions that later work must follow are written as rules in `ai/standards`. This folder keeps the record behind them: the reasons, the checks and the history.

## Current state

Use case 1, the launch, is implemented and can be played from the title screen to the debrief, with its five missions. Free exploration, with no contract and no budget, can be played from the title screen or from the first step. Run it with `npm install` and `npm run dev`; the commands are in the `README.md` at the root.

Waiting for the owner:

- The launch rules in the use case had contradictions and gaps. What was decided for each is in [use_case_1_launch_rules.md](use_case_1_launch_rules.md). None of it is approved yet, so none of it is in `ai/standards`. The exception is the rules of the score, which the owner set and which are in `ai/standards/use_case_1_score.md`.
- What makes a design optimal is not approved. It is now the cheapest winning design, then the one with the most delta-v in reserve, and in levels 2 to 5 that goes against the contract text: level 3, for example, is won best in high elliptical orbit instead of geostationary. See section 5 of [use_case_1_launch_rules.md](use_case_1_launch_rules.md).
- How free exploration works beyond the three rules the owner set (no contract, physics still decides, no score, the cost shown without a limit, where it is entered) is not approved. See [free_exploration.md](free_exploration.md), which ends with the questions for the owner. It is not deployed.
- The music of the result has been measured but nobody has listened to it yet. The tunes, when they play and how they are muted, beyond the three rules the owner set, are not approved. See [result_music.md](result_music.md), which ends with the questions for the owner. It is not deployed.
- The game is deployed on Railway at <https://rocket-odysseyserver-production.up.railway.app>, but nobody has played the deployed version in a browser yet.
- Railway has deprecated `railway.json`, which the standard names. Whether to move to `.railway/railway.ts` is the owner's decision. See [use_case_1_implementation.md](use_case_1_implementation.md).

We also want use case 2: `ai/standards/use_case_2_orbit.md`. It is not implemented.

## Documents

| Document | Contents |
| --- | --- |
| [tech_stack.md](tech_stack.md) | Decision record for the tech stack: reasons for each choice, version check, development machine check, alternatives considered, notes from the implementation and open points. The stack itself is in `ai/standards/tech_stack.md`. |
| [use_case_1_implementation.md](use_case_1_implementation.md) | What was built for use case 1: screens, where the code is, how the architecture rules are met, how the launch is played back, test results and what is not verified. |
| [use_case_1_launch_rules.md](use_case_1_launch_rules.md) | Decisions taken where the use case was contradictory or silent, differences from the mockups, inconsistencies for the owner to resolve, and how the score is computed. Not approved yet, except the score rules that are in `ai/standards/use_case_1_score.md`. |
| [free_exploration.md](free_exploration.md) | Free exploration, the mode with no contract and no budget: how it works and why, accessibility, where the code is, tests and questions for the owner. The owner's rules for it are in `ai/standards/free_exploration.md`. |
| [result_music.md](result_music.md) | The music that announces the result of a launch: the two tunes and why they are our own, when they play, their volume, muting, accessibility, where the code is, tests and questions for the owner. The owner's rules for it are in `ai/standards/result_music.md`. |
| [accessibility.md](accessibility.md) | What was done towards WCAG 2.1 AA, what the automated checks cover and what a person still has to check. |

## Log

| Date | Change |
| --- | --- |
| 2026-11-14 | Read the standards and proposed a tech stack. No code yet. Found that `ai/standards/use_case_1_launch.md` is empty and `ai/ui_mockups` does not exist. |
| 2026-11-14 | Checked the development machine and the package versions on npm. Nothing needs installing. Pinned TypeScript to 6.0.x and ESLint to 9.x for compatibility. Railway login has expired. |
| 2026-11-14 | The project owner approved the tech stack. |
| 2026-11-14 | At the owner's request, moved the stack and its rules into the standards: created `ai/standards/tech_stack.md` and made it mandatory reading in `ai/standards/standards.md`. `tech_stack.md` in this folder became the decision record. |
| 2026-11-14 | The owner wrote the launch rules of use case 1 and added the mockups. |
| 2026-11-14 | Created the workspace and `packages/game-core`: tables, rules, flight timeline, report, score, state and reducer, with their tests. Found that the rocket equation as written in the use case lets almost no design reach orbit, and applied it per stage instead. |
| 2026-11-14 | Built the client: title screen and the five planning steps in the style of the mockups. The owner committed this state and added use case 2 to the standards. |
| 2026-11-14 | Built the launch (PixiJS animation, telemetry, event log, trajectory map, list of steps for reduced motion) and the debrief. |
| 2026-11-14 | Added the server, the production build, the `Dockerfile`, `railway.json`, ESLint, Prettier and the end-to-end and accessibility tests. Fixed what they found. Wrote this documentation. |
| 2026-11-14 | The owner asked whether the repository is ready for Railway. Reproduced the three stages of the `Dockerfile` by hand from the committed tree and they work. Docker Desktop was still not running and the Railway session was still expired, so the image was not built and nothing was deployed. Found two things to improve in the server, neither of them blocking. No code was changed. |
| 2026-11-14 | The owner connected the private GitHub repository to Railway. The image was built, but the container did not start: something ran `npm` in `/app`, where the image has no `package.json`, instead of the `CMD` of the `Dockerfile`. Set `startCommand` in `railway.json` to the same command as the `CMD`, so a start command in the dashboard can no longer replace it. |
| 2026-11-14 | The owner pushed that change and the same `npm` error appeared about two minutes later. The runtime image now also holds the root `package.json`, so `npm start` works in `/app`; this was tested outside Docker. |
| 2026-11-14 | Read the Railway project with the CLI. Railway had imported the repository as a monorepo and created two services, one per workspace, with start commands, build commands and watch paths of its own, and without reading `railway.json`. With the owner's confirmation, deleted the web service and set the settings of `railway.json` on the server service directly, because Railway has deprecated `railway.json` and does not apply it. Details in [use_case_1_implementation.md](use_case_1_implementation.md). |
| 2026-11-14 | Deployed commit `ad6dc78` and generated the public domain. The health check passed and the public address serves the game. Upgraded the Railway CLI on the owner's machine from 4.30.5 to 5.74.0, and linked the repository folder to the Railway project of the game, `distinguished-emotion`. |
| 2026-11-14 | The owner asked that, in each mission, only the optimal design of all those that fulfil the contract gets the maximum score, and then that the total be rounded to the nearest integer, with 99 for a design that is not optimal and adds up to 99.5 or more. The old score broke the first rule in every level. The score is now measured against the optimal design of the level, found by trying every design: the cheapest, then the one with the most delta-v in reserve. The debrief says when a design is the best possible and then hides "Improve the score". Wrote the owner's rules in `ai/standards/use_case_1_score.md` and made it mandatory reading in `ai/standards/standards.md`. Unit tests, end-to-end tests, type checks, ESLint and Prettier pass. The definition of optimal is not approved. |
| 2026-11-14 | The owner asked for a free exploration mode with no budget, where the player can choose anything whatever it costs. Wrote the owner's three rules in `ai/standards/free_exploration.md` and made it mandatory reading in `ai/standards/standards.md`. Built the mode: a second button on the title screen, a sixth card in step 1, the cost without a limit in the header, the summary and the debrief, no contract objective, no score and no record; physics still decides. State version 2 with a play mode. 237 unit tests and 25 end-to-end tests pass, with type checks, ESLint and Prettier. The screens were also checked by eye in Chrome at 1280 and 320 pixels wide. The design of the mode beyond the owner's rules is not approved; see [free_exploration.md](free_exploration.md). |
| 2026-11-14 | At the owner's request, added sound to the launch of use case 1: countdown beeps and the engine roar, which fades with altitude and stops at 100 km, the edge of space. Added a "Mute sound" button. See [use_case_1_implementation.md](use_case_1_implementation.md). |
| 2026-11-14 | Six tests of `game-core` that try every design timed out: each evaluates more than 100,000 designs and takes about 7 seconds, over the default limit of 5 seconds. Gave them a limit of 60 seconds. All 219 unit tests pass. |
| 2026-11-14 | The owner asked for music when a mission ends: for a success, music free of copyright that recalls *2001: A Space Odyssey*; for a failure, the typical music of games when you lose. Wrote the owner's three rules in `ai/standards/result_music.md` and made it mandatory reading in `ai/standards/standards.md`. Wrote two tunes of our own, synthesised with the Web Audio API: a sunrise fanfare that quotes nothing of Strauss, whose music is still protected in Spain, and a falling "wah, wah, wah, waaah" in the sound of old consoles. The music plays when the animation reaches its end and goes on into the debrief, or when the debrief opens if the animation was skipped, once per launch. The mute setting is now one for the whole game, with a button at the top of the debrief too. 241 unit tests and 28 end-to-end tests pass, with type checks, ESLint and Prettier. The volume was measured in Chrome; nobody has listened to the music yet. Not approved beyond the owner's rules; see [result_music.md](result_music.md). |
| 2026-11-14 | At the owner's request, the deployment in the launch of use case 1 now depends on the payloads chosen: each type is drawn in its own way and unfolds its own wings, antennas, radar, telescope lid or inflatable shell, and several payloads leave one after another. Checked in the browser with single and multiple payloads, under a fairing and from a cargo bay. See [use_case_1_implementation.md](use_case_1_implementation.md). |
