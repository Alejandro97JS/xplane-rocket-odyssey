import { useEffect, useRef, type RefObject } from 'react';

const APP_NAME = 'Rocket Odyssey';

/**
 * Sets the document title and moves focus to the main heading when a screen
 * opens. Without this, a keyboard or screen reader user would stay on the
 * button they pressed, with no sign that the screen has changed.
 *
 * Returns the ref to put on the `<h1>`, which also needs `tabIndex={-1}`.
 */
export function usePageHeading(title: string): RefObject<HTMLHeadingElement | null> {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, []);

  return ref;
}
