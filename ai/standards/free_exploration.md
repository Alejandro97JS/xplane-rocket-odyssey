# Free exploration mode

The project owner asked for this mode on 2026-11-14. Follow it. Changing it needs the owner's approval.

## Rules

1. Besides the contracts, the game has a free exploration mode.
2. Free exploration has no budget. The player can choose any payloads, orbit and rocket they want, whatever they cost.
3. In free exploration the cost of a design never blocks it, never warns about it and never makes it fail.

This brings into scope the sandbox mode that `ai/standards/our_intention.md` leaves out of the first version.

## Not approved yet

How the mode works beyond these three rules was decided while building it, with the interface and the experience of the player in mind. The owner has not approved it yet. It is described, with the reasons, in `ai/self_documentation/free_exploration.md`. In short:

- There is no contract either, so there is no objective to meet.
- Physics still applies: payload mass, delta-v and radiation can still make a flight fail.
- A flight in free exploration has no score and counts for no record.
- The cost is still shown, but never measured against a limit.
