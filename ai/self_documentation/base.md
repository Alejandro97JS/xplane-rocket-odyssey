# Self documentation index

This folder records what happens in this repository. This file is the index; update it in the same session as each change.

Approved decisions that later work must follow are written as rules in `ai/standards`. This folder keeps the record behind them: the reasons, the checks and the history.

## Current state

Use case 1, the launch, is implemented and can be played from the title screen to the debrief, with its five missions. Run it with `npm install` and `npm run dev`; the commands are in the `README.md` at the root.

Waiting for the owner:

- The launch rules in the use case had contradictions and gaps. What was decided for each is in [use_case_1_launch_rules.md](use_case_1_launch_rules.md). None of it is approved yet, so none of it is in `ai/standards`.
- The game has not been deployed, and the Docker image has not been built. The repository is ready for it: see "Not verified, and what is left" in [use_case_1_implementation.md](use_case_1_implementation.md). The owner has to log in with `railway login`, or connect the GitHub repository from the Railway dashboard, and confirm the deployment.

We also want use case 2: `ai/standards/use_case_2_orbit.md`. It is not implemented.

## Documents

| Document | Contents |
| --- | --- |
| [tech_stack.md](tech_stack.md) | Decision record for the tech stack: reasons for each choice, version check, development machine check, alternatives considered, notes from the implementation and open points. The stack itself is in `ai/standards/tech_stack.md`. |
| [use_case_1_implementation.md](use_case_1_implementation.md) | What was built for use case 1: screens, where the code is, how the architecture rules are met, how the launch is played back, test results and what is not verified. |
| [use_case_1_launch_rules.md](use_case_1_launch_rules.md) | Decisions taken where the use case was contradictory or silent, differences from the mockups, and inconsistencies for the owner to resolve. Not approved yet. |
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
