# README and screenshots

The `README.md` at the root is the page of the repository on GitHub. It was rewritten on 2026-11-15 at the owner's request. The owner's rules for keeping it up to date are in `ai/standards/readme.md`.

## What the README contains

A header with badges and the link to the deployed game, an animation of a launch, the highlights, the five planning steps with a screenshot each, the debrief after a success and after a failure, the table of missions, free exploration, the physics and the table of orbits, accessibility with screens on a phone, the stack, an architecture diagram in Mermaid, how to run it, the commands, the structure, deployment, the roadmap and the documentation.

Besides the screens, the README repeats facts that live in `packages/game-core`: the five missions with their goals and budgets, the five orbits with their altitude, required delta-v and whether they cross the Van Allen belts, the number of payloads (12), orbits (5) and rockets (8), the five rules of the flight review and the rocket equation applied per stage. The owner's rule covers changes to the screens; a change to those tables or rules should also be checked against the README.

## The images

All images are in `docs/screenshots`. They were captured in the dark colour scheme, with Playwright driving the Chrome installed on the machine (`channel: 'chrome'`, headless), against the production build served locally (`npm run build`, then `npm start` with `PORT=3200`). Each design was chosen by clicking the option cards, as a player does.

| File | Screen | Design and moment | Viewport |
| --- | --- | --- | --- |
| `title.webp` | Title screen | Fresh session, nothing completed, with the "How to play" button and the credits banner. Captured again on 2026-11-15 | 1440 × 900 |
| `step-mission.webp` | Step 1, Mission | Mission 3 selected | 1440 × 900 |
| `step-payload.webp` | Step 2, Equipment & payload | Mission 3, Telecommunications Satellite | 1440 × 900 |
| `step-orbit.webp` | Step 3, Orbit | Same, Geostationary Orbit | 1440 × 900 |
| `step-rocket.webp` | Step 4, Rocket | Same, Ariane 6 | 1440 × 900 |
| `step-summary.webp` | Step 5, Summary | Same design, ready for launch | 1440 × 900 |
| `launch.webp` | Launch | Same design, about 50 seconds into the animation, after "Mission accomplished", with the transfer on the trajectory map | 1440 × 1160 |
| `debrief-success.webp` | Debrief, success | Same design, score 88 | 1440 wide, grown to the height of the page |
| `debrief-failure.webp` | Debrief, failure | Mission 4, Classic Orbital Capsule, Geostationary Orbit, Falcon 9: crew exposed to radiation. Animation skipped | 1440 wide, grown to the height of the page |
| `free-exploration.webp` | Launch in free exploration | Heavy Shielded Capsule, Docking & Power Module, Scientific Laboratory Module and Habitat Module, Low Earth Orbit, Starship; about 40 seconds into the animation, after the deployment | 1440 × 1160, cropped to the top 1046 pixels |
| `phone-title.webp` | Title screen on a phone | Fresh session, with the "How to play" button. Captured again on 2026-11-15 | 390 × 844, device scale 2, mobile and touch |
| `phone-orbit.webp` | Step 3 on a phone | Mission 4, Medium Earth Orbit selected, scrolled to the top | 390 × 844, device scale 2 |
| `phone-launch.webp` | Launch on a phone | Mission 2, Earth Observation Pack, Polar LEO / SSO, Soyuz; about 7 seconds into the animation, at liftoff | 390 × 844, device scale 2 |
| `launch.gif` | Launch canvas, animated | Mission 2, Earth Observation Pack, Polar LEO / SSO, Soyuz; the whole flight | 1440 × 900, cropped to the canvas |

"Grown to the height of the page" means the viewport was set to the height of the document before the screenshot, instead of a full-page screenshot, so the fixed backdrop covers the whole image.

The screenshots were saved as PNG and converted to WebP with Pillow, quality 90 and method 6; together they weigh about 1.2 MB.

The GIF was made from the frames of the Chrome screencast (`Page.startScreencast` over CDP, JPEG quality 95), because the video recording of Playwright needs an ffmpeg of its own that is not installed. The frames were joined with the ffmpeg of the machine using their real timestamps, cropped to the canvas (680 × 382 pixels at 199, 227), trimmed of the first 2.5 seconds of the countdown, sped up 1.35 times, reduced to 15 frames per second and 640 pixels wide, and encoded with a palette of 128 colours and Bayer dithering. It lasts about 24 seconds and weighs 4.2 MB. An animated WebP of the same flight weighed 1.4 MB, but GIF was kept because every viewer shows it.

The capture scripts were written for that session and are not in the repository.

## Captured again

| Date | Images | Why |
| --- | --- | --- |
| 2026-11-15 | `title.webp`, `phone-title.webp` | The "Free exploration" button was removed from the title screen. Captured as above, after the fonts loaded and 1.5 seconds for the entrance fade. The alt text of `title.webp` and the text of step 1 and of free exploration in the README were updated to match. The other images do not show the title screen and were kept. |
| 2026-11-15 | `debrief-success.webp`, `debrief-failure.webp` | The credits banner was added at the bottom of every screen. Captured as above, 1.5 seconds after the debrief opened; each is now 37 pixels taller (1440 × 1591 and 1440 × 1301). The banner also shows in the bottom of `title.webp`, which is captured again with the "How to play" change to the title screen. The other images end above the bottom of the page and were kept; the positions measured are in [credits_banner.md](credits_banner.md). |
| 2026-11-15 | `title.webp`, `phone-title.webp` | A "How to play" button was added next to "Start mission" on the title screen, and the caption moved under both buttons. Captured as above, after the fonts loaded and 1.5 seconds for the entrance fade, from the production build of commit `5e5d7a0` with the "How to play" changes, served on another port (3217) because another session was using 3200. `title.webp` now also shows the credits banner at its bottom; on the phone the banner is below the fold. The alt text of `title.webp` in the README was updated, and the README mentions the guide. The guide itself has no screenshot in the README. The other images do not show the title screen and were kept. |

## Checks

The README was rendered locally to check the layout of the images and tables. The formula and the Mermaid diagram are drawn only by GitHub and were not seen rendered. Prettier formats the README.
