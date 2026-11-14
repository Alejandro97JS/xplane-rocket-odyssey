import type { Flight, OrbitSpec, TelemetrySample } from '@rocket-odyssey/game-core';
import { useId, useMemo } from 'react';
import { Frame } from '../components/Frame.tsx';

const SIZE = 240;
const CENTRE = SIZE / 2;
const EARTH_RADIUS = 34;

/**
 * Distance from the centre of the map for an altitude. The scale is
 * compressed: drawn to scale, a low orbit would hide in the outline of the
 * Earth and a geostationary one would need a map six times larger.
 */
function mapRadius(altitudeKm: number): number {
  const compressed = Math.log(1 + Math.max(0, altitudeKm) / 300) / Math.log(1 + 36_000 / 300);
  return EARTH_RADIUS * (1 + 1.9 * compressed);
}

function mapPoint(altitudeKm: number, downrangeDeg: number): { x: number; y: number } {
  const radius = mapRadius(altitudeKm);
  const angle = (downrangeDeg * Math.PI) / 180;
  // The launch site is at the top; the vehicle flies clockwise.
  return { x: CENTRE + radius * Math.sin(angle), y: CENTRE - radius * Math.cos(angle) };
}

interface TrajectoryMapProps {
  flight: Flight;
  orbit: OrbitSpec;
  /** Mission time, in seconds. */
  t: number;
  telemetry: TelemetrySample;
}

/**
 * A schematic map of the trajectory: the Earth, the radiation belts, the
 * target orbit and the path flown so far. Decorative: the telemetry gives the
 * altitude as text and the event log tells what happens.
 */
export function TrajectoryMap({ flight, orbit, t, telemetry }: TrajectoryMapProps) {
  const id = useId();
  const path = useMemo(
    () =>
      flight.telemetry.map((sample) => ({
        t: sample.t,
        ...mapPoint(sample.altitudeKm, sample.downrangeDeg),
      })),
    [flight],
  );

  const flown = path.filter((point) => point.t <= t);
  const here = mapPoint(telemetry.altitudeKm, telemetry.downrangeDeg);
  const points = [...flown, here].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const plan = orbit.flightPlan;
  const targetAltitudeKm = plan.transfer
    ? plan.transfer.apogeeAltitudeKm
    : plan.insertionAltitudeKm;
  const targetRadius = mapRadius(targetAltitudeKm);

  return (
    <Frame as="section" tone="default" aria-labelledby="map-heading" className="px-4 py-4">
      <h2 id="map-heading" className="label !text-line-bright">
        Trajectory
      </h2>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto mt-1 block w-full max-w-64"
      >
        <defs>
          <radialGradient id={`${id}-earth`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#4aa3f5" />
            <stop offset="55%" stopColor="#1c63c4" />
            <stop offset="100%" stopColor="#0a2a6e" />
          </radialGradient>
        </defs>

        {/* Van Allen belts: 1,000 to 6,000 km and 13,000 to 40,000 km */}
        <Belt inner={mapRadius(13_000)} outer={mapRadius(40_000)} opacity={0.2} />
        <Belt inner={mapRadius(1_000)} outer={mapRadius(6_000)} opacity={0.3} />

        {/* Target orbit */}
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={targetRadius}
          fill="none"
          stroke="#ffdc6b"
          strokeWidth="1.4"
          strokeDasharray="4 4"
        />

        <circle cx={CENTRE} cy={CENTRE} r={EARTH_RADIUS + 2.5} fill="#38bdf8" opacity="0.25" />
        <circle cx={CENTRE} cy={CENTRE} r={EARTH_RADIUS} fill={`url(#${id}-earth)`} />
        <g fill="#3aa876" opacity="0.9">
          <ellipse
            cx={CENTRE - 9}
            cy={CENTRE - 8}
            rx="9"
            ry="13"
            transform={`rotate(-20 ${CENTRE - 9} ${CENTRE - 8})`}
          />
          <ellipse
            cx={CENTRE + 13}
            cy={CENTRE + 6}
            rx="7"
            ry="11"
            transform={`rotate(24 ${CENTRE + 13} ${CENTRE + 6})`}
          />
          <ellipse cx={CENTRE - 4} cy={CENTRE + 19} rx="8" ry="4" />
        </g>

        {/* Launch site */}
        <path d={`M${CENTRE} ${CENTRE - EARTH_RADIUS - 6}l-4 -7h8z`} fill="#f1f7ff" />

        {/* Path flown so far and the vehicle */}
        <polyline
          points={points}
          fill="none"
          stroke="#9be5ff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={here.x} cy={here.y} r="7" fill="#ffffff" opacity="0.25" />
        <circle cx={here.x} cy={here.y} r="3.5" fill="#ffffff" />
      </svg>
      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 flex-none bg-line-bright" />
          Path flown
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-0 w-5 flex-none border-t-2 border-dashed border-gold-bright"
          />
          Target: {orbit.shortName}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 flex-none rounded-full bg-[#a855f7]/60" />
          Van Allen radiation belts
        </li>
      </ul>
      <p className="mt-1 text-sm text-ink-mute">Map not to scale.</p>
    </Frame>
  );
}

function Belt({ inner, outer, opacity }: { inner: number; outer: number; opacity: number }) {
  return (
    <circle
      cx={CENTRE}
      cy={CENTRE}
      r={(inner + outer) / 2}
      fill="none"
      stroke="#a855f7"
      strokeWidth={outer - inner}
      opacity={opacity}
    />
  );
}
