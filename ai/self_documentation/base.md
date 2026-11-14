# Self documentation index

This folder records what happens in this repository. This file is the index; update it in the same session as each change.

Approved decisions that later work must follow are written as rules in `ai/standards`. This folder keeps the record behind them: the reasons, the checks and the history.

## Current state

The tech stack is approved and defined in `ai/standards/tech_stack.md`. No code has been written yet. Before the first level can be implemented, the launch rules in `ai/standards/use_case_1_launch.md` must be defined; see the open points in [tech_stack.md](tech_stack.md).

## Documents

| Document | Contents |
| --- | --- |
| [tech_stack.md](tech_stack.md) | Decision record for the tech stack: reasons for each choice, version check, development machine check, alternatives considered and open points. The stack itself is in `ai/standards/tech_stack.md`. |

## Log

| Date | Change |
| --- | --- |
| 2026-11-14 | Read the standards and proposed a tech stack. No code yet. Found that `ai/standards/use_case_1_launch.md` is empty and `ai/ui_mockups` does not exist. |
| 2026-11-14 | Checked the development machine and the package versions on npm. Nothing needs installing. Pinned TypeScript to 6.0.x and ESLint to 9.x for compatibility. Railway login has expired. |
| 2026-11-14 | The project owner approved the tech stack. |
| 2026-11-14 | At the owner's request, moved the stack and its rules into the standards: created `ai/standards/tech_stack.md` and made it mandatory reading in `ai/standards/standards.md`. `tech_stack.md` in this folder became the decision record. |
