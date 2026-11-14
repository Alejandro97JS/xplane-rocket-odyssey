# Accessibility

The target is WCAG 2.1 AA. This document records what was done to meet it, what the automated checks cover and what a person still has to check.

## What was done

| Need | How it is met |
| --- | --- |
| The canvas must never be the only carrier of information | Next to the canvas there is a telemetry panel with the mission clock, phase, altitude, speed and propellant of both stages as text. Mission events are written to a log region, which screen readers announce. The result and its explanation are ordinary text in the debrief. The canvas is labelled as an image that points to those. |
| Reduced motion | When the system asks for less motion, the launch is shown as a list of steps with the telemetry at each one, and entrance animations are switched off. The player can still ask for the animation with one button. |
| Pause, stop, hide (2.2.2) | The launch has Pause, Restart and Skip. Nothing else on any screen moves for more than five seconds: the backdrop is still. |
| Audio control (1.4.2) | The launch has sound. A "Mute sound" button next to Pause turns it off, and the choice is remembered. The sound carries no information that is not also in the telemetry and the event log. Pausing the launch silences it. |
| Flashes (2.3.1) | Nothing flashes. The breakup is one fireball that swells once and fades. The beacon after a hold is steady. |
| Keyboard (2.1.1) | Every control is reachable and usable with the keyboard. Option cards are real radio buttons and checkboxes: Tab enters a group, arrows move inside it, Space selects. The warning dialog traps focus and closes with Escape. A test plays the whole level with the keyboard alone. |
| Focus visible (2.4.7) | One focus style everywhere: a white 3-pixel outline with an offset. Controls drawn with cut corners keep the outline on an element that is not clipped. |
| Focus order and screen changes (2.4.3) | When the player moves to another screen, focus goes to its `<h1>` and the document title changes. The first screen is left alone, so the first Tab reaches the skip link. |
| Bypass blocks (2.4.1) | "Skip to main content" is the first Tab stop. |
| Contrast (1.4.3, 1.4.11) | Text and control colours are tokens in `apps/web/src/styles/index.css`, chosen against the panel fill. Panels have an opaque fill. The only text outside a panel is the header, at the top of the page, where the backdrop is at its darkest; captions over the canvas have a dark plate of their own. |
| Colour is not the only cue (1.4.1) | Over budget, over capacity, passed and failed all carry an icon and words. The two stages in the delta-v chart are named in a legend and labelled with their amounts; their colours were checked for colour-blind separation. |
| Reflow (1.4.10) | Every screen fits a 320-pixel-wide screen without scrolling sideways. A test checks it. |
| Label in name (2.5.3) | The accessible name of each control contains its visible text. |
| Target size | Buttons, step links and "Change" links are at least 44 pixels high. |
| Status messages (4.1.3) | The over-budget alert is an alert region. Totals, readiness and the verdict of the flight are status regions. |
| Language | `lang="en"` on the page. All text is in English. |

## What the automated checks cover

`npm run test:e2e` runs axe with the WCAG 2.0 and 2.1 A and AA rules on: the title screen; each of the five steps, empty and filled in; the summary with nothing chosen; the over-budget alert and its dialog; the launch as a list of steps; the animated launch, paused; the debrief after a success and after a failure; the page for an unknown address; and the debrief at 320 pixels. Since 2026-11-14 it also covers free exploration: the payload step with the cost in the header, step 1 with the free exploration card selected, the summary, the debrief, and step 1 at 320 pixels.

The same run plays the level with the keyboard alone, enters free exploration with the keyboard and moves between it and the contracts with the arrow keys, checks the dialog focus trap and checks reflow at 320 pixels on every screen. The decisions about the accessibility of free exploration are in [free_exploration.md](free_exploration.md).

Two findings of that work were fixed on the way: the link in the header had a name that did not contain its visible text, and the first screen took focus away from the skip link.

## What a person still has to check

Automated checks find only part of the problems.

- A pass with a screen reader (NVDA or VoiceOver) over the whole level, listening to how the option cards, the event log and the debrief read.
- Contrast of text over gradients, which axe cannot measure. The gradients used are all darker than the panel fill the colours were chosen against.
- Zoom to 200% and text spacing overrides.
- Whether the animation is comfortable to watch, for people who do not set reduced motion.

## Two deliberate exceptions to the lint rules

- The warning dialog opens with focus on "Review my choices" (`autoFocus`). An alert dialog should start on its safest action.
- The event log has `tabIndex={0}` although it is not a control. It scrolls, so it must be reachable with the keyboard to be scrolled.

Both are marked in the code with the reason.
