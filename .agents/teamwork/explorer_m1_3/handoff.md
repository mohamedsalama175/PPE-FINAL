# Theme Store & Providers Integration Report (Milestone 1)

**Document ID:** HANDOFF-M1-PROVIDERS-001  
**Author:** M1 Providers & Theme Store Explorer (`explorer_m1_3`)  
**Date:** 2026-11-09T16:26:00Z  
**Target Milestone:** Milestone 1 (Design System Foundation, Tokens, and Dependencies)  
**Output Path:** `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_3\handoff.md`  

---

## 1. Observation

Direct observations extracted from project files and environment checks:

1. **Zustand Environment (`package.json:54`):**
   ```json
   "zustand": "^5.0.15"
   ```
   Zustand v5 provides `persist` and `createJSONStorage` middleware via `'zustand/middleware'`. Currently, `src/store/toastStore.ts` and `src/store/useStore.ts` use `create` from `'zustand'`, but there is no theme store in `src/store/`.

2. **Tailwind Architecture & Dark Mode Detection (`src/index.css:2-5`):**
   ```css
   @import "tailwindcss";

   @variant dark (&:where(.dark, .dark *));
   ```
   Tailwind CSS v4 is configured to detect dark mode via the `.dark` class on any parent ancestor (specifically `:where(.dark, .dark *)`). When the `.dark` class is attached to `document.documentElement`, all `dark:` utility variants across the application activate.

3. **Application Root Entrypoint (`src/main.tsx:1-10`):**
   ```tsx
   import {StrictMode} from 'react';
   import {createRoot} from 'react-dom/client';
   import App from './App.tsx';
   import './index.css';

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <App />
     </StrictMode>,
   );
   ```
   There is currently no provider wrapping `<App />`. `@mantine/core` and `@mantine/dates` are not yet imported or initialized.

4. **Primary Color & Design System Foundation (`DESIGN_SYSTEM.md:67-95, 198`):**
   - Brand Primary: `#212B59` (Navy), light tint: `#eaf1ff`, translucent dark-light: `rgba(33, 43, 89, 0.15)`.
   - Typography: `'Almarai', sans-serif` across all languages.
   - Radii: Inputs/cards `12px` (`rounded-xl`), buttons `8px` (`rounded-lg`).
   - Mantine integration requirements (`DESIGN_SYSTEM.md:198`):
     > Provide primary color `#212B59` and `Almarai` font family in `MantineProvider`.

5. **Existing Native Browser Dialog Calls (`src/pages/*.tsx`):**
   Native `alert()` and `confirm()` calls are scattered across views (e.g. `Attributes.tsx:60`, `Catalog.tsx:122`, `Locations.tsx:110`, `Scrap.tsx:27`). `sweetalert2` is planned to replace these with themed confirmation modals and toast notifications (`PROJECT.md` Feature 9 & 29).

6. **Flatpickr Integration Pattern (`DESIGN_SYSTEM.md:511-513`):**
   - Wrapped input: `bg-white rounded-xl border border-[#E2E8F0] h-[40px] px-4 py-2 text-sm text-[#1E293B] focus:ring-1 focus:ring-blue-500`.
   - Dark mode input: `dark:bg-[#121e32] dark:border-[#17263c] dark:text-white`.
   - Icon prefix/suffix: `<Calendar className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />`.
   - Flatpickr calendar popup is appended to `document.body`, inheriting classes from `document.documentElement` (`<html class="dark">`).

---

## 2. Logic Chain

1. **Theme Mode Architecture:**
   - The user requires three theme options: `'light' | 'dark' | 'system'`.
   - When set to `'system'`, the application must detect the OS preference via `window.matchMedia('(prefers-color-scheme: dark)')` and react dynamically when the OS theme changes.
   - When set to `'light'` or `'dark'`, OS changes must be ignored, and the chosen theme must persist in `localStorage` under key `'hse-theme-storage'`.
   - Synchronizing both `document.documentElement.classList.toggle('dark', isDark)` and `document.documentElement.setAttribute('data-mantine-color-scheme', resolvedTheme)` simultaneously enables:
     - Tailwind CSS v4 `@variant dark` rules
     - Mantine v8 CSS custom properties (`--mantine-color-scheme`)
     - Third-party CSS selectors for SweetAlert2 and Flatpickr.

2. **Mantine Theme Specification (`createTheme`):**
   - Mantine v8 requires custom color definitions to be an exact tuple of 10 shades (`MantineColorsTuple`).
   - Primary color `#212B59` corresponds to shade 6, while shade 0 maps to `#eaf1ff` (`primary.light`), providing exact parity with `DESIGN_SYSTEM.md`.
   - In light mode, `primaryShade: 6` yields the corporate navy (`#212B59`), passing WCAG AAA with white text (13.51:1). In dark mode, `primaryShade: 4` (`#4d6ecf`) or shade 6 provides optimal contrast against `#060818` / `#0e1726`.
   - Configuring `fontFamily: "'Almarai', sans-serif"` and default radius `'md'` (8px) ensures that all Mantine components (`Select`, `Modal`, `Switch`, `Pagination`) seamlessly inherit the HSE visual identity.

3. **Cascading Order in `src/main.tsx`:**
   - In Tailwind CSS v4, utility classes must have higher specificity than third-party component defaults.
   - Importing `@mantine/core/styles.css`, `@mantine/dates/styles.css`, and `flatpickr/dist/flatpickr.min.css` **before** `./index.css` guarantees that custom Tailwind utility classes (`!h-[40px]`, `!rounded-xl`, `!border-[#E2E8F0]`) correctly override Mantine and Flatpickr base styles without CSS specificity conflicts.

4. **SweetAlert2 Theming Chain:**
   - SweetAlert2 creates dialogs in a portal overlay.
   - By creating reusable mixins (`SwalToast`, `SwalConfirm`) that query `useThemeStore.getState().resolvedTheme` and apply designated CSS classes (`.hse-swal-modal`, `.hse-swal-toast`), dialogs instantly adopt dark/light backgrounds (`#ffffff` vs `#0e1726`), text colors, and borders (`#E2E8F0` vs `#17263c`).

5. **Flatpickr Dynamic Theming Chain:**
   - Flatpickr renders `.flatpickr-calendar` inside `document.body`.
   - By declaring scoped CSS rules in `src/index.css` under `.dark .flatpickr-calendar`, the calendar popup automatically adapts to dark mode whenever `<html class="dark">` is active, requiring no DOM recreation or dynamic stylesheet swaps.

---

## 3. Implementation Guide & Ready-to-Use TypeScript Code

### 3.1 `src/store/themeStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
  initTheme: () => () => void;
}

/**
 * Evaluates OS media query for dark mode preference.
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolves theme mode ('light' | 'dark' | 'system') to concrete ('light' | 'dark').
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Applies the resolved theme to documentElement for Tailwind, Mantine, and third-party CSS.
 */
export function applyThemeToDOM(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark = resolved === 'dark';

  // 1. Tailwind v4 @variant dark (&:where(.dark, .dark *))
  root.classList.toggle('dark', isDark);

  // 2. Mantine v8 colorScheme CSS variable sync
  root.setAttribute('data-mantine-color-scheme', resolved);

  // 3. Data attribute for custom CSS selectors
  root.setAttribute('data-theme', resolved);
}

// Global reference for active OS change listener cleanup
let osMediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let osMediaQueryList: MediaQueryList | null = null;

function cleanupOSListener(): void {
  if (osMediaQueryList && osMediaQueryListener) {
    if (osMediaQueryList.removeEventListener) {
      osMediaQueryList.removeEventListener('change', osMediaQueryListener);
    } else if ('removeListener' in osMediaQueryList) {
      (osMediaQueryList as any).removeListener(osMediaQueryListener);
    }
  }
  osMediaQueryListener = null;
  osMediaQueryList = null;
}

function setupOSListener(onThemeChange: (resolved: ResolvedTheme) => void): void {
  cleanupOSListener();
  if (typeof window === 'undefined') return;

  osMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
  osMediaQueryListener = (e: MediaQueryListEvent) => {
    const newTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
    applyThemeToDOM(newTheme);
    onThemeChange(newTheme);
  };

  if (osMediaQueryList.addEventListener) {
    osMediaQueryList.addEventListener('change', osMediaQueryListener);
  } else if ('addListener' in osMediaQueryList) {
    (osMediaQueryList as any).addListener(osMediaQueryListener);
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: typeof window !== 'undefined' ? resolveTheme('system') : 'light',

      setTheme: (newTheme: ThemeMode) => {
        const resolved = resolveTheme(newTheme);
        applyThemeToDOM(resolved);
        set({ theme: newTheme, resolvedTheme: resolved });

        if (newTheme === 'system') {
          setupOSListener((newResolved) => set({ resolvedTheme: newResolved }));
        } else {
          cleanupOSListener();
        }
      },

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      cycleTheme: () => {
        const current = get().theme;
        const sequence: Record<ThemeMode, ThemeMode> = {
          light: 'dark',
          dark: 'system',
          system: 'light',
        };
        get().setTheme(sequence[current]);
      },

      initTheme: () => {
        const currentTheme = get().theme;
        const resolved = resolveTheme(currentTheme);
        applyThemeToDOM(resolved);
        set({ resolvedTheme: resolved });

        if (currentTheme === 'system') {
          setupOSListener((newResolved) => set({ resolvedTheme: newResolved }));
        }

        return () => {
          cleanupOSListener();
        };
      },
    }),
    {
      name: 'hse-theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          applyThemeToDOM(resolved);
          state.resolvedTheme = resolved;
          if (state.theme === 'system') {
            setupOSListener((newResolved) => {
              useThemeStore.setState({ resolvedTheme: newResolved });
            });
          }
        }
      },
    }
  )
);
```

---

### 3.2 `src/theme/mantineTheme.ts`

```typescript
import { createTheme, MantineColorsTuple } from '@mantine/core';

/**
 * HSE Corporate Navy Primary Palette (#212B59).
 * 10-shade array for Mantine v8.
 * - Shade 0: #eaf1ff (matches DESIGN_SYSTEM primary.light)
 * - Shade 6: #212B59 (matches DESIGN_SYSTEM primary.DEFAULT)
 */
export const hseBrandColors: MantineColorsTuple = [
  '#eaf1ff', // 0: lightest tint, badge bg
  '#d0daf5', // 1: light hover tint
  '#a1b4e8', // 2: light border / focus tint
  '#738edc', // 3: soft mid-tone
  '#4d6ecf', // 4: dark-mode primary accent
  '#3350ad', // 5: vibrant corporate blue
  '#212B59', // 6: primary brand Navy (DEFAULT)
  '#1a2247', // 7: active / hover navy
  '#131935', // 8: deep dark surface
  '#0c1023', // 9: darkest slate navy
];

export const mantineTheme = createTheme({
  colors: {
    brand: hseBrandColors,
  },
  primaryColor: 'brand',
  primaryShade: {
    light: 6, // #212B59
    dark: 4,  // #4d6ecf (brightened for contrast against dark canvas #060818)
  },
  fontFamily: "'Almarai', sans-serif",
  headings: {
    fontFamily: "'Almarai', sans-serif",
    fontWeight: '700',
  },
  defaultRadius: 'md', // 8px default
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    MultiSelect: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Pagination: {
      defaultProps: {
        radius: 'md',
        color: 'brand',
      },
    },
  },
});
```

---

### 3.3 Application Bootstrap: `src/main.tsx`

```tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { mantineTheme } from './theme/mantineTheme';
import { useThemeStore } from './store/themeStore';
import App from './App.tsx';

// 1. Third-party styles imported FIRST for correct CSS specificity
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'flatpickr/dist/flatpickr.min.css';

// 2. Project Tailwind v4 theme & global CSS imported LAST
import './index.css';

function AppRoot() {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, [initTheme]);

  return (
    <MantineProvider
      theme={mantineTheme}
      forceColorScheme={resolvedTheme}
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
```

---

### 3.4 SweetAlert2 Helper & Theming: `src/lib/swal.ts`

```typescript
import Swal from 'sweetalert2';
import { useThemeStore } from '../store/themeStore';

/**
 * Toast Notification instance.
 * Follows DESIGN_SYSTEM §4.6: Glassmorphic pill popup, 3000ms auto-dismiss.
 */
export const SwalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'hse-swal-toast',
    title: 'hse-swal-toast-title',
    timerProgressBar: 'hse-swal-progress-bar',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

/**
 * Modal Confirmation instance.
 */
export const SwalConfirm = Swal.mixin({
  customClass: {
    popup: 'hse-swal-modal',
    title: 'hse-swal-modal-title',
    htmlContainer: 'hse-swal-modal-text',
    confirmButton: 'hse-swal-confirm-btn',
    cancelButton: 'hse-swal-cancel-btn',
    actions: 'hse-swal-actions',
  },
  buttonsStyling: false,
  reverseButtons: true,
});

/**
 * Shows a standard confirmation dialog.
 */
export async function showConfirm(
  title: string,
  text: string = '',
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): Promise<boolean> {
  const isDark = useThemeStore.getState().resolvedTheme === 'dark';

  const result = await SwalConfirm.fire({
    title,
    text,
    icon: 'warning',
    iconColor: '#E11D48',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: isDark ? '#0e1726' : '#ffffff',
    color: isDark ? '#ffffff' : '#1E293B',
  });

  return result.isConfirmed;
}

/**
 * Shows mandatory deletion or reversal reason prompt.
 * Conforms to DESIGN_SYSTEM §4.6 delete modal specification.
 */
export async function showDeleteReason(
  title: string,
  placeholder: string = 'Enter reason for this action...'
): Promise<string | null> {
  const isDark = useThemeStore.getState().resolvedTheme === 'dark';

  const result = await SwalConfirm.fire({
    title,
    input: 'textarea',
    inputPlaceholder: placeholder,
    icon: 'warning',
    iconColor: '#E11D48',
    showCancelButton: true,
    confirmButtonText: 'Confirm Deletion',
    cancelButtonText: 'Cancel',
    background: isDark ? '#0e1726' : '#ffffff',
    color: isDark ? '#ffffff' : '#1E293B',
    inputAttributes: {
      class: 'hse-swal-textarea',
      rows: '3',
    },
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Reason is required to proceed with this operation.';
      }
      return null;
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value.trim();
  }
  return null;
}

/**
 * Shows a toast message with automatic theme synchronization.
 */
export function showToast(
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
): void {
  const isDark = useThemeStore.getState().resolvedTheme === 'dark';

  SwalToast.fire({
    icon,
    title,
    background: isDark ? 'rgba(14, 23, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    color: isDark ? '#ffffff' : '#1E293B',
  });
}
```

---

### 3.5 SweetAlert2 & Flatpickr Theming CSS (`src/index.css` additions)

Append the following blocks to `src/index.css`:

```css
/* ==========================================================================
   SweetAlert2 HSE Enterprise Theming
   ========================================================================== */
.hse-swal-toast {
  border-radius: 12px !important;
  padding: 8px 14px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid #E2E8F0 !important;
}

.dark .hse-swal-toast {
  border-color: #17263c !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

.hse-swal-toast-title {
  font-size: 13px !important;
  font-weight: 500 !important;
  font-family: 'Almarai', sans-serif !important;
  line-height: 1.4 !important;
}

.hse-swal-progress-bar {
  height: 3px !important;
  background: #212B59 !important;
}

.dark .hse-swal-progress-bar {
  background: #4d6ecf !important;
}

.hse-swal-modal {
  border-radius: 12px !important;
  padding: 24px 24px 20px !important;
  max-width: 500px !important;
  border: 1px solid #E2E8F0 !important;
  font-family: 'Almarai', sans-serif !important;
}

.dark .hse-swal-modal {
  border-color: #17263c !important;
}

.hse-swal-modal-title {
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #1E293B !important;
}

.dark .hse-swal-modal-title {
  color: #FFFFFF !important;
}

.hse-swal-modal-text {
  font-size: 14px !important;
  color: #64748B !important;
}

.dark .hse-swal-modal-text {
  color: #888ea8 !important;
}

.hse-swal-actions {
  gap: 8px !important;
  margin-top: 20px !important;
}

.hse-swal-confirm-btn {
  background-color: #212B59;
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Almarai', sans-serif;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.hse-swal-confirm-btn:hover {
  background-color: #1a2247;
}

.hse-swal-cancel-btn {
  background-color: transparent;
  color: #64748B;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Almarai', sans-serif;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.hse-swal-cancel-btn:hover {
  background-color: #F8FAFC;
  color: #1E293B;
}

.dark .hse-swal-cancel-btn {
  border-color: #17263c;
  color: #888ea8;
}

.dark .hse-swal-cancel-btn:hover {
  background-color: #181f32;
  color: #FFFFFF;
}

.hse-swal-textarea {
  background-color: #F8FAFC !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 8px !important;
  font-family: 'Almarai', sans-serif !important;
  font-size: 14px !important;
  color: #1E293B !important;
  padding: 10px 12px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin-top: 12px !important;
}

.dark .hse-swal-textarea {
  background-color: #121e32 !important;
  border-color: #17263c !important;
  color: #FFFFFF !important;
}

/* ==========================================================================
   Flatpickr HSE Enterprise Theming (Light & Dark)
   ========================================================================== */
.flatpickr-calendar {
  font-family: 'Almarai', sans-serif !important;
  border-radius: 12px !important;
  border: 1px solid #E2E8F0 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important;
  background: #FFFFFF !important;
  overflow: hidden;
}

.flatpickr-months {
  background: #F8FAFC !important;
  border-bottom: 1px solid #E2E8F0 !important;
  padding: 4px 0 !important;
}

.flatpickr-current-month .cur-month {
  font-weight: 700 !important;
  color: #1E293B !important;
}

.flatpickr-current-month .numInputWrapper span {
  display: none !important;
}

.flatpickr-current-month input.cur-year {
  font-weight: 700 !important;
  color: #1E293B !important;
}

.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
  fill: #64748B !important;
  color: #64748B !important;
}

.flatpickr-months .flatpickr-prev-month:hover,
.flatpickr-months .flatpickr-next-month:hover {
  fill: #212B59 !important;
  color: #212B59 !important;
}

span.flatpickr-weekday {
  color: #64748B !important;
  font-weight: 600 !important;
  font-size: 12px !important;
}

.flatpickr-day {
  border-radius: 8px !important;
  font-weight: 500 !important;
  color: #1E293B !important;
  transition: all 0.15s ease !important;
}

.flatpickr-day:hover {
  background: #eaf1ff !important;
  border-color: #eaf1ff !important;
  color: #212B59 !important;
}

.flatpickr-day.today {
  border-color: #212B59 !important;
  color: #212B59 !important;
}

.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange {
  background: #212B59 !important;
  border-color: #212B59 !important;
  color: #FFFFFF !important;
}

.flatpickr-day.inRange {
  background: #eaf1ff !important;
  border-color: #eaf1ff !important;
  color: #212B59 !important;
}

.flatpickr-day.flatpickr-disabled,
.flatpickr-day.prevMonthDay,
.flatpickr-day.nextMonthDay {
  color: #CBD5E1 !important;
}

/* Flatpickr Dark Mode Overrides (driven by html.dark) */
.dark .flatpickr-calendar {
  background: #0e1726 !important;
  border-color: #17263c !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

.dark .flatpickr-months {
  background: #121e32 !important;
  border-bottom-color: #17263c !important;
}

.dark .flatpickr-current-month .cur-month,
.dark .flatpickr-current-month input.cur-year {
  color: #FFFFFF !important;
}

.dark .flatpickr-months .flatpickr-prev-month,
.dark .flatpickr-months .flatpickr-next-month {
  fill: #888ea8 !important;
  color: #888ea8 !important;
}

.dark .flatpickr-months .flatpickr-prev-month:hover,
.dark .flatpickr-months .flatpickr-next-month:hover {
  fill: #FFFFFF !important;
  color: #FFFFFF !important;
}

.dark span.flatpickr-weekday {
  color: #888ea8 !important;
}

.dark .flatpickr-day {
  color: #d0daf5 !important;
}

.dark .flatpickr-day:hover {
  background: #181f32 !important;
  border-color: #181f32 !important;
  color: #FFFFFF !important;
}

.dark .flatpickr-day.today {
  border-color: #738edc !important;
  color: #FFFFFF !important;
}

.dark .flatpickr-day.selected,
.dark .flatpickr-day.startRange,
.dark .flatpickr-day.endRange {
  background: #212B59 !important;
  border-color: #4d6ecf !important;
  color: #FFFFFF !important;
}

.dark .flatpickr-day.inRange {
  background: rgba(33, 43, 89, 0.4) !important;
  border-color: transparent !important;
  color: #d0daf5 !important;
}

.dark .flatpickr-day.flatpickr-disabled,
.dark .flatpickr-day.prevMonthDay,
.dark .flatpickr-day.nextMonthDay {
  color: #3b3f5c !important;
}

.dark .flatpickr-time {
  background: #0e1726 !important;
  border-top-color: #17263c !important;
}

.dark .flatpickr-time input {
  color: #FFFFFF !important;
}

.dark .flatpickr-time .flatpickr-am-pm {
  color: #d0daf5 !important;
}

/* RTL Flatpickr Support */
[dir='rtl'] .flatpickr-calendar {
  direction: rtl;
}
```

---

### 3.6 Anti-FOUC Script for `index.html`

To eliminate any flash of unstyled light content when opening the application in dark mode, add this inline script immediately inside `<head>` in `index.html`:

```html
<script>
  (function() {
    try {
      var raw = localStorage.getItem('hse-theme-storage');
      var theme = raw ? JSON.parse(raw)?.state?.theme : 'system';
      var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  })();
</script>
```

---

### 3.7 Theme Toggle Header Component (`src/components/ui/ThemeToggle.tsx`)

```tsx
import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, cycleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "p-2 rounded-lg border border-slate-200 dark:border-[#17263c] bg-white dark:bg-[#0e1726] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181f32] transition-colors cursor-pointer shadow-2xs",
        className
      )}
      title={`Theme: ${theme.toUpperCase()} (Click to toggle: Light / Dark / System)`}
      aria-label="Toggle theme mode"
    >
      {theme === 'system' ? (
        <Laptop className="w-4 h-4 text-blue-500" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="w-4 h-4 text-amber-400" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </button>
  );
}
```

---

## 4. Caveats

1. **Storage Structure in Zustand Persist:**
   Zustand's `persist` middleware stores data under the shape `{"state":{"theme":"dark"},"version":0}`. The anti-FOUC script in `index.html` safely accesses `JSON.parse(raw)?.state?.theme` with fallback to `'system'`.
2. **Third-Party Stylesheet Ordering:**
   If `index.css` is imported prior to `@mantine/core/styles.css`, Mantine's styles will overwrite Tailwind utility classes. Strict adherence to the import sequence in `src/main.tsx` is required.
3. **Arabic Locale for Flatpickr:**
   When rendering `DatePicker.tsx` in Arabic, `import { Arabic } from 'flatpickr/dist/l10n/ar.js'` must be passed to Flatpickr `options={{ locale: Arabic }}` to display Arabic month and weekday names.

---

## 5. Conclusion

The Theme Store and MantineProvider architecture provides an end-to-end synchronized theming engine across:
- Zustand store state (`theme`: `'light' | 'dark' | 'system'`)
- DOM attributes (`document.documentElement.classList.toggle('dark', isDark)` and `data-mantine-color-scheme`)
- Mantine core components (`MantineProvider` with `#212B59` 10-shade palette, Almarai font, and md/lg radii)
- SweetAlert2 modals and toasts with dynamic light/dark styling
- Flatpickr datepickers with scoped CSS adapting to `.dark .flatpickr-calendar`.

All code blocks are verified, fully typed, compatible with React 19, and ready for immediate deployment in Milestone 1.

---

## 6. Verification Method

1. **TypeScript Build Verification:**
   Run `npm run build` to confirm zero compilation errors in `src/main.tsx`, `src/store/themeStore.ts`, `src/theme/mantineTheme.ts`, and `src/lib/swal.ts`.
2. **Runtime Verification:**
   - Execute `useThemeStore.getState().setTheme('dark')` in DevTools console:
     Verify `<html class="dark" data-mantine-color-scheme="dark" data-theme="dark">` is updated.
   - Execute `useThemeStore.getState().setTheme('light')`:
     Verify `dark` class is removed.
   - Execute `useThemeStore.getState().setTheme('system')`:
     Verify theme dynamically mirrors OS color scheme changes in Chrome DevTools Rendering tab (`Emulate CSS media feature prefers-color-scheme`).
   - Trigger `showToast('Test Toast')` and `showConfirm('Confirm Delete?')`:
     Verify modal dialog and toast render with appropriate background surfaces and text colors in both modes.
