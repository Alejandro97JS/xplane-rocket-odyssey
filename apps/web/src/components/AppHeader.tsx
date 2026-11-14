import type { ReactNode } from 'react';
import { Link } from 'react-aria-components';
import { Logo } from './Logo.tsx';

interface AppHeaderProps {
  tagline?: string;
  /** Shown on the right: the budget meter on the planning screens. */
  children?: ReactNode;
}

/** The header of the mockups: emblem, name of the planner and, on the right, the budget. */
export function AppHeader({
  tagline = 'Plan your mission. Explore the universe.',
  children,
}: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5">
      <Link
        href="/"
        aria-label="Rocket Odyssey, back to the title screen"
        className="flex items-center gap-4 rounded-xl no-underline"
      >
        <Logo size={64} className="flex-none drop-shadow-[0_0_10px_rgb(56_189_248/0.5)]" />
        <span aria-hidden="true" className="h-12 w-px bg-line-dim max-xs:hidden" />
        <span className="min-w-0">
          <span className="display block text-xl text-ink sm:text-2xl">Space Mission Planner</span>
          <span className="block text-sm text-ink-soft sm:text-base">{tagline}</span>
        </span>
      </Link>
      {children}
    </header>
  );
}
