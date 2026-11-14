import type { ReactNode } from 'react';
import { usePageHeading } from '../lib/usePageHeading.ts';
import { Frame } from './Frame.tsx';

interface StepPanelProps {
  /** The number in the round badge, or a short mark such as an icon. */
  badge: ReactNode;
  title: string;
  subtitle: string;
  /** Title of the browser tab. Defaults to `title`. */
  pageTitle?: string;
  children: ReactNode;
}

/**
 * The main panel of a screen: a round badge, an italic title and the content,
 * as in the mockups. It holds the only `<h1>` of the screen, which receives
 * focus when the screen opens.
 */
export function StepPanel({ badge, title, subtitle, pageTitle, children }: StepPanelProps) {
  const headingRef = usePageHeading(pageTitle ?? title);
  return (
    <Frame as="section" tone="panel" className="fade-in px-4 py-5 sm:px-7 sm:py-6">
      <header className="mb-5 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 flex-none place-items-center rounded-full border-[3px] border-line bg-space-700 text-2xl font-bold text-ink shadow-[0_0_16px_2px_rgb(56_189_248/0.55)]"
        >
          {badge}
        </span>
        <div className="min-w-0">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="display text-shadow-glow text-2xl text-line-bright sm:text-3xl"
          >
            {title}
          </h1>
          <p className="mt-1 text-base text-ink-soft sm:text-lg">{subtitle}</p>
        </div>
      </header>
      {children}
    </Frame>
  );
}
