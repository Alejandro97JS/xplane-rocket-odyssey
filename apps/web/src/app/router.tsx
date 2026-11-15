import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
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
    <p role="status" className="display py-24 text-center text-2xl text-line-bright">
      Loading mission control…
    </p>
  );
}

/** Every screen has its own address, so the back button of the browser works. */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
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
]);
