We want to build an interactive game playable from the browser, solving ai/standards/statement.md. We want to deploy it and make it available via Railway. You can choose the stack you want, the best possible for the case. I also want a configuration setup for local development, so we can test the game in localhost.

For example, in the use case 1 we want to focus on the launch of a rocket. There are a few initial steps (screens) where the user interacts adapting the input parameters. Then, there is a final step that is "Launch!", where a simulation of the launch is run according to the aim of the mission and according to the parameters given by the user. We want the simulation to be realistic, failing if the parameters were wrong and succeeding if they were ok. After the simulation, explain why it succeeded or failed.

## Scope of the first version (MVP)
- Single player, in the browser, no accounts and no saved data.
- A title screen, then a level selection screen with a single level (use case 1).
- Out of scope for now: multiplayer, roles, leaderboards, sandbox mode, saving or sharing designs.
- Persistence (a database) may be added soon. Keep game logic separate from the UI and the game state serializable, but do not build it yet.

## Simulation realism
The launch must look credible, not be a real physics simulation. However, the outcome must depend on the player's parameters through simple deterministic rules (see ai/standards/use_case_1_launch.md), and the animation must show that outcome.