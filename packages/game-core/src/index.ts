/**
 * Game rules, state and launch simulation of Rocket Odyssey.
 *
 * This package has no UI dependencies: no React, no DOM, no PixiJS, no server.
 * State changes only through `reduce`, and a launch is computed by `simulate`
 * before anything is animated.
 */
export * from './ids.ts';
export * from './catalog/levels.ts';
export * from './catalog/orbits.ts';
export * from './catalog/payloads.ts';
export * from './catalog/rockets.ts';
export * from './design.ts';
export * from './flight.ts';
export * from './format.ts';
export * from './hints.ts';
export * from './physics.ts';
export * from './reducer.ts';
export * from './report.ts';
export * from './rules.ts';
export * from './score.ts';
export * from './simulate.ts';
export * from './state.ts';
