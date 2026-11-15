# How to play

On 2026-11-15 the owner asked, in Spanish, for an option of information or help on the title screen, in whatever form is best for the experience and the interface, that tells how the game works, its goal and whatever else such a feature should have. The owner's rules are in `ai/standards/how_to_play.md`. This document records how it was built and why. Nothing here beyond those rules is approved yet.

## What was built

- **On the title screen**, a "How to play" button (blue, the secondary style) next to "Start mission" (yellow, the main way in). On a phone the two buttons are stacked, the main one first. The caption with the number of contracts and those completed now sits under both buttons and stays tied to "Start mission" with `aria-describedby`.
- **A screen of its own**, `/how-to-play`, with the header of the planning screens and one panel titled "How to play". It has a list of contents and eight sections:

| Section | What it says |
| --- | --- |
| Your goal | The role of the player, what a contract is, when a mission succeeds, that there is no single right answer, and the size of the game: 5 contracts, 12 payloads, 5 orbits, 8 rockets. |
| A mission, step by step | The five planning steps, with the names of the stepper, then the launch and the debrief. |
| What decides the flight | The five rules of the flight review in flight order (budget, payload mass, delta-v, crew radiation, contract objective), that the first one that fails ends the mission, and that free exploration applies only the three rules of physics. |
| The score | 60 points for the contract, up to 25 for budget saved and up to 15 for the propellant reserve; only the best design of each contract scores 100; the stars at 80 and 65 points; where the best score shows; that the game does not save progress. |
| Free exploration | The briefing of free exploration from `game-core`, that it is the last card of step 1 and that it is not scored. |
| Ideas worth knowing | Payload, delta-v, capacity, specific impulse, stages and the Van Allen belts, in plain words, with the orbits that cross the belts. |
| Controls and accessibility | Mouse and touch, the keyboard, pause, restart and skip in the launch, the sound button, and reduced motion. |
| Tips for your first launch | Start with mission 1, read the briefing, the biggest rocket costs points, and failing is part of the job. |

At the end, "Back to the title screen" and "Start mission", which reads "Continue planning" when a contract or free exploration is already chosen, as on the title screen.

## Why this form

- **A screen, not a dialog.** The guide is long enough to scroll, and a long dialog is hard to read on a phone and with a screen reader. A screen has its own address, so it can be linked, the back button of the browser closes it, and it follows the pattern every other screen already uses: focus on its `<h1>` and its own document title.
- **A button next to "Start mission".** A new player looks there first. It is the secondary style, so "Start mission" stays the main action; the two are the same height so they read as one group. An icon in a corner was rejected as too easy to miss.
- **A list of contents.** Eight sections are a long page on a phone. On a wide screen the list stays beside the guide as it scrolls. Its labels are short ("Goal", "Rules", "Key ideas") so the list fits a 320-pixel screen in four rows.
- **Short sections, plain words.** The statement of the challenge asks that the game be playable without an aerospace background. The explanations of delta-v, capacity and specific impulse reuse the words of the orbit and rocket steps, so the guide and the game say the same.
- **Numbers from `game-core`.** The counts of the catalogs, the points of the score (`SCORE_POINTS`, now exported from `score.ts`), the star thresholds (`STAR_THRESHOLDS`), the orbits that cross the belts, the names of the steps and the texts of free exploration are read, not copied. A unit test checks that the points add up to 100. The sentences around them are still written by hand; the standard says when to read them again.
- **No way into free exploration.** Rule 4 of `ai/standards/free_exploration.md` keeps free exploration in step 1. The guide explains it and says where to find it. Its "Start mission" opens step 1 without choosing anything, and leaves a choice already made as it was.
- **What it does not include.** The table of orbits and the list of rockets are in steps 3 and 4 with their drawings, so the guide does not repeat them. It does not give the best design of any contract.

## Accessibility

- The screen has one `<h1>`, which takes focus when the screen opens, and an `<h2>` per section. Each section is a region named by its heading.
- Each entry of the contents is a plain link to the `<h2>` of its section. The headings have `tabIndex={-1}`, so following an entry moves focus to the heading, which a screen reader reads, and the next Tab goes on from there. Without it, Chrome left focus on the page itself and nothing was announced. The headings show no focus ring, like the `<h1>`, because they are not controls.
- Following an entry does not count as a new screen: the hook that moves focus to the `<h1>` leaves it alone, and the title of the document stays.
- The entries of the contents are at least 44 pixels high. Icons are decorative and hidden from assistive technology; every piece of information is in the text.
- The guide reflows down to 320 pixels without scrolling sideways.

## Where the code is

| File | Contents |
| --- | --- |
| `apps/web/src/screens/HowToPlayScreen.tsx` | The guide. |
| `apps/web/src/screens/WelcomeScreen.tsx` | The "How to play" button. |
| `apps/web/src/app/router.tsx` | The route `/how-to-play`. |
| `apps/web/src/components/icons.tsx` | Three new icons: help, book and keyboard. |
| `packages/game-core/src/score.ts` | `SCORE_POINTS` and `STAR_THRESHOLDS`, exported. The score itself did not change. |

## Tests

- `e2e/how-to-play.spec.ts`: the guide opens from the title screen with its address and title, has every section and the names of the five steps, its contents lead to each section and move focus there; its "Start mission" opens step 1 with nothing chosen, its "Back to the title screen" works, and a mission already chosen stays chosen.
- `e2e/keyboard.spec.ts`: the guide is opened from the title screen, a section is reached through the contents and the guide is left for step 1, all with the keyboard.
- `e2e/accessibility.spec.ts`: axe on the guide, and the guide at 320 pixels with axe and the check for sideways scrolling.
- `packages/game-core/test/rules.test.ts`: the points of the score add up to 100 and the star thresholds are in order.

On 2026-11-15, 248 unit tests and 36 end-to-end tests passed, with type checks, ESLint and Prettier. They were run in a separate worktree at commit `5e5d7a0` with only these changes, because another session was adding the credits banner in the same folder at the same time. The title screen and the guide were also checked by eye in Chrome at 1440, 1024, 390 and 320 pixels wide.

## Questions for the owner

1. Is a screen of its own the right form, or would you prefer a dialog over the title screen?
2. Should "How to play" also be reachable from the planning steps, for example from the header? Today it is only on the title screen, as asked.
3. Is the content right? In particular, should the guide say how the score is split, given that the split is not approved yet (section 5, "Score", of `ai/self_documentation/use_case_1_launch_rules.md`)?
