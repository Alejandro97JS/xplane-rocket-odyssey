import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router';

const APP_NAME = 'Rocket Odyssey';
/** The key React Router gives to the address the page was opened with. */
const FIRST_LOCATION_KEY = 'default';

/**
 * Sets the document title and, when the player moves to a new screen, puts
 * focus on its main heading. Without this, a keyboard or screen reader user
 * would stay on the button they pressed, with no sign that the screen has
 * changed.
 *
 * The screen the page opens with is left alone: the browser starts at the top
 * of the document, where the skip link is.
 *
 * Returns the ref to put on the `<h1>`, which also needs `tabIndex={-1}`.
 */
export function usePageHeading(title: string): RefObject<HTMLHeadingElement | null> {
  const ref = useRef<HTMLHeadingElement>(null);
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  useEffect(() => {
    if (location.key === FIRST_LOCATION_KEY) return;
    ref.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.key]);

  return ref;
}
