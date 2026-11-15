/**
 * The thin banner at the bottom of every screen: who made the game and the
 * challenge it takes part in. It closes the page instead of being fixed to the
 * window, so it never covers a control or the launch, least of all on a phone.
 * Its fill is opaque because it sits over the glowing rim of the Earth.
 */
export function CreditsBanner() {
  return (
    <footer className="border-t border-line-dim bg-space-950">
      <p className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 px-4 py-2 text-center text-sm text-ink-soft sm:px-6">
        <span>
          Made by the <strong className="font-bold text-ink">XPlane team</strong>
          {/* A pause for screen readers, which skip the dot between the two parts. */}
          <span className="sr-only">.</span>
        </span>
        <span aria-hidden="true" className="text-line max-sm:hidden">
          ·
        </span>
        <span>
          Taking part in the{' '}
          <strong className="font-bold text-ink">NASA Space Apps Challenge</strong>, Salamanca
          (Spain) local event
        </span>
      </p>
    </footer>
  );
}
