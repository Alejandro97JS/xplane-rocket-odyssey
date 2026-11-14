import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './app/router.tsx';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('The page has no #root element.');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
