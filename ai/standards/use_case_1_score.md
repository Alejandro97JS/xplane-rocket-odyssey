# Use case 1: mission score

The project owner set these rules on 2026-11-14. Follow them. Changing them needs the owner's approval.

## Rules

1. A failed mission has no score.
2. In each mission, the optimal design among all the designs that fulfil the contract gets the maximum total score: 100.
3. Every other design that fulfils the contract gets less than 100.
4. The total is rounded to the nearest integer. A design that is not optimal and adds up to 99.5 or more shows 99, never 100.

## Keeping the rules true

Changing a level, a table or a launch rule can change which design is optimal, or leave two designs tied. Run `npm test` after any such change. The test "level N can be won, and only its optimal design scores 100" in `packages/game-core/test/rules.test.ts` tries every design of every level and fails if a level has no single 100.

## Not approved yet

What makes a design optimal, and how the points are split, are proposals that the owner has not approved. They are described in `ai/self_documentation/use_case_1_launch_rules.md`, section "Score".
