/**
 * ThemeStore — Light Mode Only
 * Dark mode has been removed from this application.
 * This store is kept for compatibility with any remaining imports.
 */
export type ThemeMode = 'light';
export type ResolvedTheme = 'light';

export interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  initTheme: () => () => void;
}

const defaultState: ThemeStore = {
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  initTheme: () => () => {},
};

// Compatible with zustand selector pattern: useThemeStore(state => state.resolvedTheme)
export function useThemeStore<T = ThemeStore>(selector?: (state: ThemeStore) => T): T {
  if (selector) {
    return selector(defaultState);
  }
  return defaultState as unknown as T;
}

export function getSystemTheme(): ResolvedTheme {
  return 'light';
}

export function resolveTheme(_mode: ThemeMode): ResolvedTheme {
  return 'light';
}

export function applyThemeToDOM(_resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  document.documentElement.setAttribute('data-theme', 'light');
}
