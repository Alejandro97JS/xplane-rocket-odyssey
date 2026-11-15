# Free exploration: what was built and why

On 2026-11-14 the owner asked for "a free exploration mode, without a budget, where you can choose anything you want no matter how much you spend", built with the best options for the interface and the experience of the player. The rules the owner set are in `ai/standards/free_exploration.md`. This document records how the mode was designed around them, why, and what is left for the owner to decide.

**Status:** built and tested on 2026-11-14. On 2026-11-15 the owner asked to remove the way into the mode from the title screen and keep only the one in step 1; that is now rule 4 of the standard. Only the four rules in the standard are the owner's. Everything else here is a proposal the owner has not approved.

## How it works

| Decision | What the player sees | Why |
| --- | --- | --- |
| A mode, not a sixth contract | Free exploration has no client and no objective, as well as no budget. | "Choose anything you want" leaves nothing for an objective to ask for. An objective would turn some choices into failures that have nothing to do with physics. |
| Physics still decides | Payload mass, delta-v and radiation are checked as in a contract, with the same numbers, animations, texts and hints. A Telecom satellite on Electron still breaks apart at Max-Q. | Without consequences there is nothing to learn. The brief asks that every decision have consequences, and lists a "sandbox mode for unrestricted experimentation": the restrictions removed are money and the contract, not the laws of the flight. |
| No score, no record | The debrief says "Free exploration flights are not scored. Fly a contract to earn a score." The mission cards and the count of completed missions on the title screen do not change. | The score in `ai/standards/use_case_1_score.md` measures a design against the optimal design of a contract, and that design is the cheapest. With no budget and no contract there is nothing to measure against. Saying why the score is missing avoids the player thinking it is a fault. |
| The cost is still shown | In the header, where the budget meter is in a contract: "Free exploration · No budget limit · Mission cost". In the summary, the cost with its split between payload and rocket. In the debrief, the cost with "(no budget limit)". Never red, never an alert, never the warning dialog. | Money is one of the resources the brief asks the player to learn about. Seeing that a whole station on Saturn V costs $1,980M, next to contract budgets of $35M to $520M, teaches that without blocking anything. |
| The design moves with the player | Switching between a contract and free exploration keeps the payload, orbit and rocket, and keeps the contract that was chosen, so the player can come back to it. | It lets the player ask "what if money were no object?" about the design in front of them, and then go back to the contract with what they learned. It is how choosing another contract already works. |
| One way in, in step 1 | Free exploration is the sixth card of step 1, after the five contracts. The title screen has one button, "Start mission", which reads "Continue planning" once a contract or free exploration has been chosen; it opens step 1 and leaves the mode as it is. | Rule 4 of the standard, set by the owner on 2026-11-15. Until then the title screen also had a "Free exploration" button, next to "Start mission", that went straight to the payload step. The card lets the player switch at any time, in the place where the kind of mission is chosen. The title button used to switch to contract mode, because each of the two buttons chose its mode; with step 1 as the only place to choose, that would silently undo free exploration for a player who chose it and went back to the title, so the button now only opens step 1. |
| Step 1 layout | The six cards fill a grid of three by two, and the briefing of the selected card now runs across the full width below them. | Before, the briefing filled the sixth cell of the grid. Moving it keeps the order on screen the same as the order in the page and the keyboard order. |
| Debrief | The verdict says "Flight successful" or "Flight failed" instead of "Contract fulfilled" or "Mission failed". The flight review lists the three rules of physics and says why the other two are not there. After a success, the actions are "Try another design" (to the summary) and "Fly a contract" (to step 1, in contract mode). After a failure they are the same as in a contract: "Fix the design" and "Review the whole design". | Each text describes what really happened: there was no contract to fulfil. |

## Accessibility

- The header shows text, not a meter: with no limit there is nothing to measure. It is not a live region, so screen readers are not interrupted every time a payload is added; the payload step already announces its totals.
- The free exploration card is a radio button like the contracts. Its name is "Free exploration, no contract", which contains the visible text of the card.
- The way in is the card in step 1, reached with Tab and the arrow keys like the contracts. Until 2026-11-15 there was also a button on the title screen, a button rather than a link because it changed the mode before it opened the payload step.
- New automated checks: axe on the payload step in free exploration, on step 1 with free exploration selected, on the summary and on the debrief; the keyboard alone to enter free exploration and move between it and the contracts with the arrow keys; and the free exploration screens at 320 pixels wide. See [accessibility.md](accessibility.md).

## Where the code is

| Place | What changed |
| --- | --- |
| `packages/game-core/src/ids.ts` | `PLAY_MODES`: `contract` and `free_exploration`. |
| `packages/game-core/src/exploration.ts` | The texts of the mode: title, goal, briefing, why there is no score, and the line said after a successful flight. |
| `packages/game-core/src/state.ts` | State version 2, with `mode`. A launch without a contract stores `levelId: null`. `selectIsFreeExploration` and `selectHasMission`; `selectBudget` is null in free exploration, so the alert and the warning never show; free exploration counts as the mission in the readiness check. |
| `packages/game-core/src/reducer.ts` | The action `mode/select`. Choosing or starting a contract returns to contract mode. A launch in free exploration counts for no record. |
| `packages/game-core/src/rules.ts` | `evaluateMission(null, design)` evaluates without a contract: `level`, `budget` and `objective` are null, and only the payload mass, delta-v and radiation checks run. |
| `packages/game-core/src/score.ts`, `report.ts`, `flight.ts`, `simulate.ts` | No score without a contract; the written explanation and the last event of the flight speak of cost without a budget and use the line of free exploration. |
| `apps/web/src/screens/WelcomeScreen.tsx` | Until 2026-11-15, the free exploration button. Now the single way in, to step 1, which leaves the mode alone. |
| `apps/web/src/screens/MissionStep.tsx`, `art/MissionArt.tsx` | The sixth card, its drawing, and the briefing across the grid. |
| `apps/web/src/components/ExplorationCost.tsx`, `app/PlannerLayout.tsx`, `components/Stepper.tsx` | The header in free exploration; the steps open without a contract. |
| `apps/web/src/screens/SummaryStep.tsx`, `DebriefScreen.tsx` | The summary and the debrief described above. |

## Tests

| Command | What was added | Result on 2026-11-14 |
| --- | --- | --- |
| `npm test` | `packages/game-core/test/exploration.test.ts`: switching modes keeps the design and the contract; no budget and no warning; a launch with no record; only the three checks of physics; a $1,980M design flies; the physics is the same as in a contract; overweight, short of delta-v and radiation still fail; no score; the texts; determinism and JSON. The test of state versions now rejects version 1. | 237 tests pass. |
| `npm run test:e2e` | A whole flight in free exploration, from the title to "Fly a contract"; a flight that physics does not allow; the same design moved between a contract and free exploration; axe on the screens of the mode; the keyboard test; the 320-pixel test. | 25 tests pass, 6 of them new. |

On 2026-11-15, when the title button was removed, the tests changed to enter free exploration through step 1: the helper `startExploring` chooses the card and presses Next, and the keyboard test reaches it from the first contract with the left arrow, which wraps round to the last card. A new test checks that the title screen has no button or link into the mode, and that "Continue planning" opens step 1 with free exploration still chosen. 247 unit tests and 29 end-to-end tests pass, with type checks, ESLint and Prettier.

## For the owner to decide

1. **Physics in free exploration.** It still decides the result. If the owner wants a mode where anything reaches orbit, the change is small, but the debrief would then have nothing to explain.
2. **A contract without a budget.** Free exploration has no objective. Another option is to practise a chosen contract with its objective but without its budget. It was not built: it would need its own answer about the score.
3. **Records of free flights.** None are kept. They could be counted, or the best designs kept, when persistence arrives.
4. **`our_intention.md`** lists the sandbox mode as out of scope for the first version. The new standard says that this request brings it in; the owner may want to update that file.
