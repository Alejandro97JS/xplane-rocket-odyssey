import { RouterProvider } from 'react-aria-components';
import { Outlet, useHref, useNavigate } from 'react-router';
import { Backdrop } from '../components/Backdrop.tsx';

/**
 * Shared by every screen: the space backdrop, a skip link and the bridge that
 * lets React Aria links navigate through the client-side router.
 */
export function RootLayout() {
  const navigate = useNavigate();
  return (
    <RouterProvider navigate={(path) => void navigate(path)} useHref={useHref}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-space-800 focus:px-4 focus:py-3 focus:font-bold focus:text-ink"
      >
        Skip to main content
      </a>
      <Backdrop />
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <Outlet />
      </div>
    </RouterProvider>
  );
}
