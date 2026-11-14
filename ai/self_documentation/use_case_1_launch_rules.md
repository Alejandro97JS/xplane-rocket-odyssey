# Use case 1: decisions taken and questions for the owner

`ai/standards/use_case_1_launch.md` defines the levels, the tables, the rocket equation and the hints. While implementing it, some points turned out to be contradictory and others were not defined. This document lists what was decided in each case and why.

**None of these decisions has been approved by the owner yet**, except the rules of the score in section 5, which the owner set and which are in `ai/standards/use_case_1_score.md`. They are implemented so that the game can be played and judged. Each one the owner approves should be moved to `ai/standards` as a rule; each one the owner changes needs a change in `packages/game-core` and its tests.

## 1. The rocket equation is applied to each stage

**The problem.** The use case writes the equation once for the whole launcher:

```
delta-v = Isp × 9.81 × ln((payload + structure + propellant) / (payload + structure))
```

With the numbers of its own launcher table, that gives too little delta-v for almost every mission. Low orbit needs 9,300 m/s. Computed this way:

| Rocket | Empty | With 1,800 kg | With its maximum payload |
| --- | --- | --- | --- |
| Electron | 7,356 | 4,902 | 6,730 |
| Soyuz-2.1a | 8,145 | 7,920 | 7,313 |
| Falcon 9 | 9,257 | 9,065 | 7,472 |
| Ariane 6 | 8,560 | 8,425 | 7,858 |
| Starship | 9,337 | 9,321 | 8,248 |
| Ariane 5 | 10,188 | 10,054 | 8,949 |
| Saturn V | 11,663 | 11,614 | 9,111 |
| Space Shuttle | 8,012 | 7,990 | 7,722 |

Levels 1, 2, 3 and 5 could not be won by any design, and level 4 only with the test capsule on Ariane 5. No rocket could reach low orbit with the payload its own table says it can carry. The cause is physical: real launchers drop their empty first stage, and the equation above makes them carry it to the end.

**The decision.** The equation is kept, but applied to each stage in turn, which is how it is used for real launchers. Every launcher is modelled as two stages: the part dropped on the way up (boosters and first stage together) and the part that carries the payload to orbit. The delta-v of the mission is the sum of the two.

The use case gives totals for the whole launcher, so the split between stages had to be added. It follows three rules, checked by tests:

- The dry masses of the two stages add up to the dry mass of the table.
- The propellant masses of the two stages add up to the propellant mass of the table.
- The propellant-weighted average of the two specific impulses equals the specific impulse of the table (within 1 s).

| Rocket | Stage 1: dry / propellant / Isp | Stage 2: dry / propellant / Isp |
| --- | --- | --- |
| Electron | 1,000 / 9,150 / 315 | 200 / 2,150 / 343 |
| Soyuz-2.1a | 17,500 / 259,000 / 311 | 4,500 / 26,000 / 359 |
| Falcon 9 | 22,200 / 411,000 / 301 | 4,000 / 107,400 / 348 |
| Ariane 6 | 36,000 / 424,000 / 342 | 5,000 / 31,000 / 457 |
| Starship | 250,000 / 3,400,000 / 351 | 125,000 / 1,500,000 / 380 |
| Ariane 5 | 40,000 / 672,000 / 367 | 5,000 / 28,000 / 446 |
| Saturn V | 95,000 / 2,150,000 / 367 | 35,000 / 690,000 / 421 |
| Space Shuttle | 182,000 / 1,000,000 / 378 | 96,000 / 760,000 / 452 |

Masses are in kg and specific impulses in seconds. The values are close to the real vehicles, but they are a calibration, not manufacturer data. They were tuned for two results:

- Every rocket reaches low orbit with its maximum payload. Otherwise a player could choose a rocket whose capacity is enough and still fail for lack of delta-v in low orbit, which would look like a bug.
- The paths the use case lists as valid succeed wherever its own budgets allow.

The Soyuz split was chosen so that it cannot take the telecom satellite to geostationary or high elliptical orbit (it generates 11,323 m/s; those orbits need 12,000 and 11,500). The use case lists only Ariane 6 and Falcon 9 for that level, and this gives level 3 a cheap rocket that fails for lack of delta-v, which is where the player learns the concept.

The tests in `packages/game-core/test/physics.test.ts` record both facts: the one-equation version cannot reach low orbit, and the staged version lets every rocket do so with its maximum payload.

## 2. Rules the use case leaves open

| Point | Decision | Reason |
| --- | --- | --- |
| Radiation in geostationary orbit | Geostationary orbit is a radiation hazard, like medium and high elliptical orbit. | The hint names only MEO and HEO, but level 4 says to avoid "high orbits". A spacecraft crosses both belts to reach GEO. Without this, a standard capsule in GEO would win level 4. |
| Valid orbits of level 4 | Any orbit fulfils the objective. The radiation rule is what makes high orbits fail for capsules without shielding. | It is the literal reading of "avoid high orbits to prevent radiation failure unless using the shielded capsule". |
| "Inclined LEO" in level 2 | Mapped to Low Earth Orbit. | The orbit table has no inclined LEO. Low Earth Orbit is the closest entry. |
| Hardware of level 5 | The core module, plus a laboratory or a habitat, plus a crew capsule. | Reading of "Core Module + Laboratory or Habitat + Manned Capsule". |
| Extra payloads | Allowed. The objective only asks for the hardware the contract needs. | The use case lets the player combine items "as long as it doesn't break level logic". Budget, mass and delta-v already punish extras. |
| Right hardware, wrong orbit | It is an "unfulfilled objective" failure with its own hint. | The use case gives valid orbits per level, but its fifth hint only mentions hardware. The new hint is in `packages/game-core/src/hints.ts`. The five hints of the use case are used word for word. |
| Over budget | The header alert appears at once. Pressing Next opens a warning dialog, which the player may dismiss; it shows again when the cost changes. A launch over budget is scrubbed on the pad before ignition. | The use case asks for an immediate alert and a warning "before allowing them to move forward", and lists the budget hint among the failures shown when pressing Launch. |
| Payload over the capacity of the rocket | The vehicle breaks apart at Max-Q, about a minute after liftoff. | The capacity is treated as a structural rating, so it stays a different rule from delta-v. |
| Short of delta-v | If the rocket cannot reach its first orbit it falls back and burns up. If it reaches a low orbit but cannot finish the transfer, it is left stranded there. | The use case says "re-enters or fails to reach orbit". Both are the same failure with the same hint. |
| Several failed rules at once | The first one in flight order ends the mission: budget, mass, delta-v, radiation, objective. The debrief lists all five rules with their result. | The animation can only show one ending. Showing every rule saves the player from fixing one problem per launch. |
| Crew in a failed flight | The texts say that the crew is safe: escape system, capsule landing or return on its own engines. | A failed design should teach, not show a tragedy. |
| Score | Measured against the optimal design of the level. See section 5. | The brief asks for a mission score that rewards resource efficiency. The use case defines no score. |

## 3. Differences from the mockups

- **Emblem.** The mockups show the logo of a real space agency, which is a registered mark. The game uses an emblem of its own.
- **Language.** One mockup has a button in Spanish. Everything in the game is in English, as the standards ask; the button says "Launch!".
- **Contents.** The mockups use sample contents (lunar and Martian missions, a rover, a lunar insertion orbit). The game uses the levels and tables of the use case.
- **First step.** The mockups call the first step "Mission type". It is the level selector the use case asks for, with its five levels.
- **Rocket cards.** The mockups show "reliability" and "payload cost" labels. The use case has no data for them and the simulation has no chance in it, so the cards show capacity, launch cost, propellant, dry mass, specific impulse and height.
- **Orbit and rocket cards.** The mockups draw them with tick boxes although only one can be chosen. They keep that look, but they are radio buttons for keyboards and screen readers.
- **Payload load.** The rocket and summary steps show how much of the capacity of the rocket the payload uses. It is not in the mockups; mass is one of the resources the brief asks the player to balance.
- **Wording of categories.** The payload table says "Manned"; the cards say "Crewed". The hints keep the original wording.

## 4. Inconsistencies in the use case, for the owner to resolve

These were implemented as written. They do not stop the game from working, but they contradict the guidelines of the use case itself.

1. **Level 2 has one winning payload and one winning rocket.** The statement points to the radar ("the area is often cloud-covered"), but radar ($40M) plus Soyuz ($50M) costs $90M and the budget is $85M. The optical pack on Falcon 9 costs $97M. Only the optical pack on Soyuz fits, in either valid orbit. A budget of $100M would allow radar on Soyuz and the optical pack on Falcon 9, which is what "tightly budgeting" suggests.
2. **Level 5 lists Ariane 6 as valid, but it cannot carry a station.** Its capacity is 10,350 kg and the lightest valid station weighs 14,100 kg.
3. **Level 4 mentions the shielded capsule, but it cannot be afforded.** It costs $350M and the budget is $300M.
4. **Level 1 has exactly one winning design**, although the use case says each level has several valid paths. With that budget and those tables, nothing else fits.
5. **`our_intention.md` asks for a level selection screen with a single level; the use case asks for five.** The five were built, since the use case is more recent and more specific.

Winning designs per level with the current rules, counting every set of payloads: 1 in level 1, 2 in level 2, 18 in level 3, 269 in level 4 and 73 in level 5. The test "level N can be won, and only its optimal design scores 100" in `packages/game-core/test/rules.test.ts` guards that every level stays winnable.

## 5. Score

The owner set the rules of the score on 2026-11-14, and they are in `ai/standards/use_case_1_score.md`: the optimal design of each mission scores 100, every other winning design scores less, and the total is rounded to the nearest integer but a design that is not optimal shows 99 at most. This section describes how they are implemented. **What makes a design optimal, and how the points are split, are not approved yet.**

**Before.** The first score gave 60 points for the contract, up to 25 for unspent budget (all of them at 30% unspent) and up to 15 for delta-v in reserve (all of them at 10% above the required). It broke the owner's rule in every level: the only winning design of level 1 scored 95, levels 2 and 3 had two designs tied at the top, level 4 had 58 designs with 100, and the best design of level 5 scored 98.

**Optimal design.** Of all the designs that fulfil the contract, the cheapest. Between designs of the same cost, the one with the most delta-v left over, as a share of the delta-v the orbit needs. `findOptimalDesign` in `packages/game-core/src/score.ts` finds it by trying every set of payloads with every orbit and rocket, skipping sets that leave no money for the cheapest rocket, and keeps the result after the first call. Level 5, the slowest, takes about 75 ms on the development machine.

**Points.**

| Part | Points | How they are earned |
| --- | --- | --- |
| Contract fulfilled | 60 | Every successful mission. |
| Budget saved | Up to 25 | Money left unspent, as a share of the money the optimal design leaves unspent. |
| Propellant reserve | Up to 15 | Delta-v reserve, as a share of the reserve of the optimal design. A larger reserve than the optimal design's earns every point. |

The optimal design earns every point. Any other design either costs more, so it loses budget points, or costs the same and keeps less reserve, so it loses reserve points. The total is the exact sum of the parts rounded to the nearest integer, and 99 at most for a design that is not optimal. The parts are shown with one decimal, and a part short of its maximum never shows the maximum. The stars did not change: three from 80 points, two from 65.

**Result**, counting every set of payloads:

| Level | Optimal design | Cost | Reserve | Next best |
| --- | --- | --- | --- | --- |
| 1 | CubeSat on Electron, low orbit | $26.5M | 15.8% | None: it is the only winning design. |
| 2 | Optical pack on Soyuz, low orbit | $77M | 30.0% | 97: the same in sun-synchronous orbit. |
| 3 | Telecom satellite on Falcon 9, high elliptical orbit | $145M | 24.0% | 97: the same in geostationary orbit. |
| 4 | Test capsule on Soyuz, low orbit | $115M | 24.0% | 97: several designs, such as the same on Falcon 9. |
| 5 | Core, laboratory and test capsule on Falcon 9, low orbit | $375M | 13.3% | 97: the same plus the CubeSat. |

No design adds up to 99.5 or more with the current tables, so the cap at 99 never shows in play. A unit test of `roundTotal` checks it.

**For the owner to decide.** The optimal design follows only from cost and reserve, and in some levels that goes against the contract text:

1. Level 3 asks for "zero signal interruptions". Geostationary orbit gives one satellite continuous coverage; in a high elliptical orbit one satellite serves the region for some hours of each orbit. On Falcon 9 both cost the same, and the high elliptical orbit wins because it needs less delta-v.
2. In level 2 the sun-synchronous orbit is the one the orbit table calls "ideal for global observation", but low orbit wins for the same reason.
3. Levels 4 and 5 are won best with the one-seat test capsule, although level 4 asks to keep astronauts "operating for several days" and level 5 asks for a place where a crew can live.

Points for a preferred orbit or capsule in each level would make the optimal design match the contract. That was not done, because it changes what the levels ask for.
