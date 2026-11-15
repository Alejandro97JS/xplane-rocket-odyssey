/**
 * Number formatting shared by the explanations built here and by the UI, so
 * the same figure always reads the same way.
 */

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/** 8500000 -> "$8.5M", 1200000000 -> "$1,200M". */
export function formatUsd(usd: number): string {
  const sign = usd < 0 ? '-' : '';
  return `${sign}$${oneDecimal.format(Math.abs(usd) / 1_000_000)}M`;
}

/** 12500 -> "12,500 kg". */
export function formatMass(kg: number): string {
  return `${integer.format(kg)} kg`;
}

/** 9300.4 -> "9,300 m/s". */
export function formatSpeed(ms: number): string {
  return `${integer.format(ms)} m/s`;
}

/** 9300 -> "9.3 km/s". */
export function formatSpeedKms(ms: number): string {
  return `${oneDecimal.format(ms / 1000)} km/s`;
}

/** 35786 -> "35,786 km". */
export function formatAltitude(km: number): string {
  return `${integer.format(km)} km`;
}

export function formatInteger(value: number): string {
  return integer.format(value);
}

/** 0.1332 -> "13%", or "13.3%" with one decimal. */
export function formatPercent(fraction: number, decimals: 0 | 1 = 0): string {
  return `${(decimals === 1 ? oneDecimal : integer).format(fraction * 100)}%`;
}

/** 5400 -> "1 h 30 min", 95 -> "1 min 35 s". */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

/** Mission clock: -10 -> "T-00:10", 4000 -> "T+01:06:40". */
export function formatMissionClock(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const total = Math.floor(Math.abs(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `T${sign}${pad(h)}:${pad(m)}:${pad(s)}` : `T${sign}${pad(m)}:${pad(s)}`;
}

/** ["a"] -> "a", ["a","b"] -> "a and b", ["a","b","c"] -> "a, b and c". */
export function formatList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * The form that agrees with a subject of `count` things, so a sentence about
 * several payloads reads "the core module and laboratory module separate".
 */
export function agree(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Who was on board: "the astronaut" for one, "the crew of 4" for more. */
export function crewOf(count: number): string {
  return count === 1 ? 'the astronaut' : `the crew of ${count}`;
}

/**
 * Lowercases the first letter so a name can be used in the middle of a
 * sentence. Acronyms such as "SAR" are left alone.
 */
export function lowerFirst(text: string): string {
  const first = text.charAt(0);
  const second = text.charAt(1);
  if (second !== '' && second === second.toUpperCase() && second !== second.toLowerCase()) {
    return text;
  }
  return first.toLowerCase() + text.slice(1);
}

/** Uppercases the first letter, so a phrase can start a sentence. */
export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
