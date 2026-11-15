import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ErrorScreen } from '../screens/ErrorScreen.tsx';
import { HowToPlayScreen } from '../screens/HowToPlayScreen.tsx';
import { MissionStep } from '../screens/MissionStep.tsx';
import { NotFoundScreen } from '../screens/NotFoundScreen.tsx';
import { OrbitStep } from '../screens/OrbitStep.tsx';
import { PayloadStep } from '../screens/PayloadStep.tsx';
import { RocketStep } from '../screens/RocketStep.tsx';
import { SummaryStep } from '../screens/SummaryStep.tsx';
import { WelcomeScreen } from '../screens/WelcomeScreen.tsx';
import { PlannerLayout } from './PlannerLayout.tsx';
import { RootLayout } from './RootLayout.tsx';

// The launch screen brings PixiJS with it, so it is loaded only when needed.
const LaunchScreen = lazy(() =>
  import('../screens/LaunchScreen.tsx').then((module) => ({ default: module.LaunchScreen })),
);
const DebriefScreen = lazy(() =>
  import('../screens/DebriefScreen.tsx').then((module) => ({ default: module.DebriefScreen })),
);

function Loading() {
  return (
    <main id="main" className="flex-1">
      <p role="status" className="display py-24 text-center text-2xl text-line-bright">
        Loading mission control…
      </p>
    </main>
  );
}

/**
 * Every screen has its own address, so the back button of the browser works.
 * A screen that cannot be shown is replaced by the error screen, inside the
 * layout shared by every screen.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: <ErrorScreen />,
        children: [
          { path: '/', element: <WelcomeScreen /> },
          { path: '/how-to-play', element: <HowToPlayScreen /> },
          {
            path: '/plan',
            element: <PlannerLayout />,
            children: [
              { index: true, element: <Navigate to="/plan/mission" replace /> },
              { path: 'mission', element: <MissionStep /> },
              { path: 'payload', element: <PayloadStep /> },
              { path: 'orbit', element: <OrbitStep /> },
              { path: 'rocket', element: <RocketStep /> },
              { path: 'summary', element: <SummaryStep /> },
            ],
          },
          {
            path: '/launch',
            element: (
              <Suspense fallback={<Loading />}>
                <LaunchScreen />
              </Suspense>
            ),
          },
          {
            path: '/debrief',
            element: (
              <Suspense fallback={<Loading />}>
                <DebriefScreen />
              </Suspense>
            ),
          },
          { path: '*', element: <NotFoundScreen /> },
        ],
      },
    ],
  },
]);
