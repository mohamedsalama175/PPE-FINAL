import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { mantineTheme } from './theme/mantineTheme';
import App from './App.tsx';

// 1. Library CSS in exact cascade order
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'tippy.js/dist/tippy.css';
import 'flatpickr/dist/flatpickr.css';

// 2. Application Tailwind v4 tokens & global CSS
import './index.css';

function AppRoot() {
  return (
    <MantineProvider
      theme={mantineTheme}
      forceColorScheme="light"
      defaultColorScheme="light"
    >
      <App />
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
