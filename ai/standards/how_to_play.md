# How to play

The project owner asked for this on 2026-11-15. Follow it. Changing it needs the owner's approval.

## Rules

1. The title screen has a way to information or help about the game.
2. That help tells how the game works and what its goal is.

The owner left the form, and what else the help should contain, to the best judgement for the experience and the interface of the player.

## Keeping the guide true

The guide repeats what the game does. Most of its numbers are read from `packages/game-core`, but its sentences are written by hand in `apps/web/src/screens/HowToPlayScreen.tsx`. When a rule of the flight, the score, a planning step, a control or free exploration changes, read the guide again and change what no longer holds.

## Not approved yet

The form and the content were decided while building it. The owner has not approved them yet. They are described, with the reasons, in `ai/self_documentation/how_to_play.md`. In short:

- A "How to play" button sits next to "Start mission" on the title screen and opens a screen of its own, `/how-to-play`, instead of a dialog.
- The guide has eight sections, with a list of contents: the goal, the steps of a mission, the five rules that decide a flight, the score, free exploration, the ideas a player without an aerospace background needs, the controls and accessibility, and tips for a first launch.
- The numbers it quotes (contracts, payloads, orbits, rockets, the points of the score, the stars) and the texts of free exploration come from `packages/game-core`, so the guide cannot drift from the rules.
- It explains free exploration but has no way into it: free exploration is chosen only in step 1 (rule 4 of `ai/standards/free_exploration.md`). Its way out opens step 1, or goes back to the title screen.
