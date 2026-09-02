# Milestone 1: Packages and Dependencies Implementation Guide

## 1. Observation

### 1.1 Existing Project Environment (`package.json`)
File inspected: `d:\Sana Soft2\PRoject Code\PPE-FINAL\package.json` (lines 25-74)
- **React & React DOM**: `"react": "^19.0.1"`, `"react-dom": "^19.0.1"`
- **TypeScript**: `"typescript": "~5.8.2"`
- **Vite & Tailwind Architecture**:
  - `"vite": "^6.2.3"`
  - `"@tailwindcss/vite": "^4.1.14"` and `"tailwindcss": "^4.1.14"`
  - Native Tailwind CSS v4 configured via `@import "tailwindcss";` in `src/index.css`.
- **Target UI Packages Status**:
  - `@mantine/core`: **Missing** (Not installed)
  - `@mantine/hooks`: **Missing** (Not installed)
  - `@mantine/dates`: **Missing** (Not installed)
  - `dayjs`: **Missing** (Not installed)
  - `@tippyjs/react`: **Missing** (Not installed)
  - `tippy.js`: **Missing** (Not installed)
  - `sweetalert2`: **Missing** (Not installed)
  - `react-flatpickr`: **Missing** (Not installed)
  - `flatpickr`: **Missing** (Not installed)
  - `@types/react-flatpickr`: **Missing** (Not installed)

### 1.2 Package Metadata & React 19 Peer Dependency Resolutions
Queried via `npm info` commands:
1. **`@mantine/core@8.2.4`**:
   - `npm info @mantine/core@8.2.4 peerDependencies`:
     ```json
     {
       "react": "^18.x || ^19.x",
       "react-dom": "^18.x || ^19.x",
       "@mantine/hooks": "8.2.4"
     }
     ```
   - *Observation*: Explicitly supports React 19; strictly requires `@mantine/hooks@8.2.4`.
2. **`@mantine/dates@8.2.4`**:
   - `npm info @mantine/dates@8.2.4 peerDependencies`:
     ```json
     {
       "dayjs": ">=1.0.0",
       "react": "^18.x || ^19.x",
       "react-dom": "^18.x || ^19.x",
       "@mantine/core": "8.2.4",
       "@mantine/hooks": "8.2.4"
     }
     ```
   - *Observation*: Explicitly supports React 19; strictly requires `dayjs: >=1.0.0`.
3. **`@tippyjs/react@4.2.6`**:
   - `npm info @tippyjs/react@4.2.6 peerDependencies`:
     ```json
     {
       "react": ">=16.8",
       "react-dom": ">=16.8"
     }
     ```
   - `npm info @tippyjs/react@4.2.6 dependencies`:
     ```json
     {
       "tippy.js": "^6.3.1"
     }
     ```
   - *Observation*: Open-ended React version constraint (`>=16.8`) natively encompasses React 19. Depends directly on `tippy.js`.
4. **`sweetalert2@11.26.25`**:
   - `npm info sweetalert2@11.26.25 main module`:
     ```json
     {
       "main": "dist/sweetalert2.all.js",
       "module": "dist/sweetalert2.esm.all.js"
     }
     ```
   - *Observation*: Framework-agnostic vanilla library; zero React peer dependencies; bundles self-injecting CSS inside `sweetalert2.all.js`.
5. **`react-flatpickr@^4.0.11`**:
   - `npm info react-flatpickr@^4.0.11 peerDependencies dependencies`:
     ```json
     {
       "peerDependencies": {
         "react": ">= 16 <= 19"
       },
       "dependencies": {
         "flatpickr": "^4.6.13"
       }
     }
     ```
   - *Observation*: `DESIGN_SYSTEM.md` cited `react-flatpickr@^3.10.13`, which had peer dependency `react: "<=18"`. In contrast, `react-flatpickr@^4.0.11` explicitly declares `"react": ">= 16 <= 19"` and installs cleanly with React 19 without any peer dependency conflicts.
6. **`@types/react-flatpickr`**:
   - Latest published version is `3.8.11`.
   - `peerDependencies: { "@types/react": "*", "flatpickr": "^4.0.6" }`.

### 1.3 Dry-Run Package Installation Test
Command executed:
```powershell
npm install --dry-run @mantine/core@8.2.4 @mantine/hooks@8.2.4 @mantine/dates@8.2.4 dayjs @tippyjs/react@4.2.6 tippy.js sweetalert2@11.26.25 react-flatpickr@^4.0.11 flatpickr -D @types/react-flatpickr@^3.8.11
```
Result verbatim:
```
Command exited with code 0.
Command output:
add ...
added 126 packages in 16s
```
*Observation*: Resolved without any `--legacy-peer-deps` or `--force` flags. Zero peer dependency warnings.

### 1.4 Entrypoint & Styling Architecture
- **`src/main.tsx`** (lines 1-10):
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
  *Observation*: Currently has no `<MantineProvider>`. Mantine 8 components throw a fatal runtime error if rendered without `<MantineProvider>` mounted above them.
- **`src/index.css`** (lines 1-18):
  - Starts with `@import "tailwindcss";` and `@variant dark (&:where(.dark, .dark *));`.
  - No third-party stylesheet imports currently exist.

### 1.5 TypeScript Configuration (`tsconfig.json`)
File inspected: `d:\Sana Soft2\PRoject Code\PPE-FINAL\tsconfig.json` (lines 1-28)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "dist-server", "prisma", "server"]
}
```
- *Observation*: `"skipLibCheck": true` is enabled, ensuring TypeScript will not fail on external declaration file discrepancies.
- *Observation*: `"moduleResolution": "bundler"` is enabled, correctly resolving modern package exports.
- *Observation*: There is currently no `src/vite-env.d.ts` in the project.

---

## 2. Logic Chain

1. **Dependency Compatibility Chain**:
   - The project runs React 19 (`^19.0.1`).
   - From Observation 1.2: `@mantine/core@8.2.4`, `@mantine/dates@8.2.4`, and `@mantine/hooks@8.2.4` were specifically released with React 19 support (`"react": "^18.x || ^19.x"`).
   - `@mantine/dates` requires `dayjs`.
   - `@tippyjs/react@4.2.6` declares `"react": ">=16.8"`, covering React 19 cleanly.
   - `react-flatpickr@^4.0.11` supports React 19 (`>= 16 <= 19`), whereas older v3 versions (`3.10.13`) fail on React 19.
   - `sweetalert2@11.26.25` is framework-agnostic.
   - Therefore, installing this specific package manifest resolves without conflicts, as proven by the 0-error dry run in Observation 1.3.

2. **CSS Cascade & Import Order Chain**:
   - Mantine components (`Select`, `Modal`, `Accordion`, etc.) and Flatpickr render their own DOM structures styled by external CSS files:
     - `@mantine/core/styles.css`
     - `@mantine/dates/styles.css`
     - `flatpickr/dist/flatpickr.css`
     - `tippy.js/dist/tippy.css`
   - In Tailwind CSS v4 with Vite, if third-party CSS is imported in `src/main.tsx` *before* `./index.css`, the browser cascades them in exact DOM sequence: Third-Party Base Styles -> Tailwind Base & `@theme` -> Tailwind Component Layers (`.form-input`, `!h-[40px]`, `!rounded-xl`, `!border-[#E2E8F0]`) -> Tailwind Utilities.
   - This ensures that design system tokens and custom Tailwind class overrides take precedence over Mantine and Flatpickr defaults without fighting CSS specificity.

3. **Provider Architecture Chain**:
   - Observation 1.4 noted that `src/main.tsx` directly renders `<App />` without any provider.
   - Mantine components throw runtime exceptions if rendered outside a `<MantineProvider>`.
   - Furthermore, `DESIGN_SYSTEM.md §1.6` defines dark theme surfaces (`#0e1726`, `#121e32`, `#17263c`).
   - Mantine 8 manages dark mode through the `data-mantine-color-scheme="dark" | "light"` attribute on `document.documentElement`.
   - Therefore, wrapping `<App />` with `<MantineProvider defaultColorScheme="light">` in `src/main.tsx` and synchronizing the attribute upon theme change is necessary for both runtime stability and visual theme parity.

4. **TypeScript Safety Chain**:
   - With `"skipLibCheck": true` and `"moduleResolution": "bundler"` in `tsconfig.json`, all imported packages will resolve their types.
   - Adding `src/vite-env.d.ts` with `/// <reference types="vite/client" />` equips TypeScript with native awareness of CSS imports (`import '...css'`).
   - For `react-flatpickr`, because React 19 changed `JSX.Element` typing for legacy class components, using a component type assertion in the wrapping `DatePicker.tsx` (`Flatpickr as unknown as React.ComponentType<any>`) or a custom declaration guarantees zero compilation errors during `npm run lint` (`tsc --noEmit`).

---

## 3. Caveats

1. **Powershell Command Separators on Windows**:
   - In standard Windows PowerShell (5.1), `&&` can throw a syntax error (`The token '&&' is not a valid statement separator`).
   - Therefore, run `npm install` for dependencies and devDependencies as two separate commands, or separated by a semicolon (`;`).
2. **Flatpickr Arabic Locale**:
   - `DESIGN_SYSTEM.md` requires Arabic (RTL) support. Flatpickr includes Arabic locale at `flatpickr/dist/l10n/ar.js`. When implementing `DatePicker.tsx` in Milestone 2, import `Arabic` from `flatpickr/dist/l10n/ar.js` when the app language is `'ar'`.
3. **SweetAlert2 Built-in Styles**:
   - SweetAlert2 imports its own styles via `sweetalert2.all.js`. Do not import `sweetalert2/dist/sweetalert2.css` manually unless customizing the raw CSS, as it would cause duplicate styles. Use `Swal.mixin({ customClass: { ... }, buttonsStyling: false })` as specified in `PROJECT.md`.
4. **Dayjs Locales**:
   - Dayjs supports locales via `import 'dayjs/locale/ar'` and `import 'dayjs/locale/en'`. When formatting dates in Mantine or custom formatters, `dayjs.locale(currentLang)` should be set.

---

## 4. Conclusion & Actionable Implementation Plan

### 4.1 Exact Package Names & Version Ranges

#### Production Dependencies (`dependencies` in `package.json`):
| Package Name | Exact Version / Range | Peer / Sub-Dependencies | Purpose in Design System |
| :--- | :--- | :--- | :--- |
| `@mantine/core` | `8.2.4` | `@mantine/hooks@8.2.4`, `react@^19.0.1` | Form inputs (`Select`, `MultiSelect`, `Switch`), `Modal`, `Accordion`, `Pagination` |
| `@mantine/hooks` | `8.2.4` | `react@^19.0.1` | Reactive Mantine hooks (`useDisclosure`, `useMediaQuery`) |
| `@mantine/dates` | `8.2.4` | `dayjs@>=1.0.0`, `@mantine/core@8.2.4` | Date picker integration components |
| `dayjs` | `^1.11.13` | None | Mandatory datetime engine for Mantine Dates |
| `@tippyjs/react` | `4.2.6` | `tippy.js@^6.3.1`, `react@^19.0.1` | Action button tooltips in tables and icon buttons |
| `tippy.js` | `^6.3.7` | `@popperjs/core` | Core tooltip engine and stylesheet provider |
| `sweetalert2` | `11.26.25` | None | Confirmation dialogs, delete reasons, toasts |
| `react-flatpickr` | `^4.0.11` | `flatpickr@^4.6.13`, `react@^19.0.1` | React wrapper for Flatpickr date/time input |
| `flatpickr` | `^4.6.13` | None | Core Flatpickr calendar and stylesheet provider |

#### Development Dependencies (`devDependencies` in `package.json`):
| Package Name | Exact Version / Range | Purpose |
| :--- | :--- | :--- |
| `@types/react-flatpickr` | `^3.8.11` | TypeScript definitions for `react-flatpickr` |

---

### 4.2 Exact Installation Commands

Execute these two commands in the workspace root:

```powershell
# Step 1: Install production UI libraries
npm install @mantine/core@8.2.4 @mantine/hooks@8.2.4 @mantine/dates@8.2.4 dayjs@^1.11.13 @tippyjs/react@4.2.6 tippy.js@^6.3.7 sweetalert2@11.26.25 react-flatpickr@^4.0.11 flatpickr@^4.6.13

# Step 2: Install dev types
npm install -D @types/react-flatpickr@^3.8.11
```

*Flags*: No `--force` or `--legacy-peer-deps` required. The resolution is 100% clean.

---

### 4.3 Import & CSS Requirements

#### A. Primary Import Location: `src/main.tsx`
Update `src/main.tsx` to import third-party CSS before `./index.css` and mount `<MantineProvider>`:

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

// 1. Third-party UI Styles (Imported first so Tailwind overrides apply cleanly)
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'flatpickr/dist/flatpickr.css';
import 'tippy.js/dist/tippy.css';

// 2. Application Global Styles & Tailwind CSS v4 Theme
import './index.css';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
);
```

#### B. CSS Cascade Order in `src/index.css`
In `src/index.css`, Mantine and third-party classes will be overridden by Tailwind's `@layer components` and `@layer utilities`:
```css
/* src/index.css */
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

@theme {
  /* HSE Design System Tokens from DESIGN_SYSTEM.md */
  --color-primary: #212B59;
  --color-primary-light: #eaf1ff;
  --color-primary-dark-light: rgba(67, 97, 238, 0.15);
  --color-secondary: #805dca;
  --color-secondary-light: #ebe4f7;
  --color-success: #00ab55;
  --color-danger: #e7515a;
  --color-warning: #e2a03f;
  --color-info: #2196f3;
  --color-dark: #3b3f5c;
  --color-black: #0e1726;
  --color-white-light: #e0e6ed;
  --color-white-dark: #888ea8;
  --color-canvas: #F5F6FD;
  --color-border-slate: #E2E8F0;

  --font-Almarai: 'Almarai', sans-serif;
  --font-sans: 'Almarai', sans-serif;
}
```

#### C. Dark Mode Synchronization with Mantine
When switching themes in `src/store/themeStore.ts` or `src/components/layout/Layout.tsx`:
```typescript
// Synchronize both standard dark class and Mantine data attribute:
if (isDark) {
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
} else {
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
}
```

---

### 4.4 TypeScript Compilation & Tsconfig Adjustments

1. **Create `src/vite-env.d.ts`**:
   Add this file to ensure clean TypeScript recognition of CSS and Vite client assets:
   ```typescript
   /// <reference types="vite/client" />
   ```

2. **React 19 Safe Typing for `react-flatpickr`**:
   When implementing `src/components/ui/DatePicker.tsx` (or form wrappers), use this casting pattern to guarantee compatibility with React 19's `JSX.Element` typing:
   ```typescript
   import Flatpickr from 'react-flatpickr';
   import type { ComponentProps } from 'react';

   // Type guard for React 19 JSX element compatibility
   const FlatpickrComponent = Flatpickr as unknown as React.ComponentType<any>;

   export const DatePicker = (props: any) => {
     return <FlatpickrComponent {...props} />;
   };
   ```

3. **Verify `tsconfig.json`**:
   Keep `"skipLibCheck": true` and `"moduleResolution": "bundler"`. No modifications to `compilerOptions` are required.

---

## 5. Verification Method

To independently verify the implementation, execute the following commands in the workspace root:

1. **Verify Package Installation & Dependency Tree**:
   ```powershell
   npm ls @mantine/core @mantine/dates @mantine/hooks dayjs @tippyjs/react tippy.js sweetalert2 react-flatpickr flatpickr
   ```
   *Expected outcome*: Exits `0`, displaying the exact installed versions without `UNMET PEER DEPENDENCY` errors.

2. **Verify TypeScript Compilation (Zero Errors)**:
   ```powershell
   npm run lint
   ```
   *Expected outcome*: `tsc --noEmit` exits with code `0` and 0 errors.

3. **Verify Client Production Bundle Build**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: `vite build` completes successfully with code `0`, generating production chunks in `dist/`.

4. **Verify Server Build**:
   ```powershell
   npm run build:server
   ```
   *Expected outcome*: `tsc -p tsconfig.server.json` completes with code `0`.

5. **Verify Automated Tests**:
   ```powershell
   npm run test:e2e
   ```
   *Expected outcome*: E2E suite passes without regression.

*Invalidation Conditions*:
- If `npm install` prompts for peer resolution flags, verify that `react-flatpickr` is version `^4.0.11` (not `3.10.13`) and `@mantine/core` is `8.2.4`.
- If Mantine throws `MantineProvider was not found in the component tree` at runtime, verify `<MantineProvider>` is mounted in `src/main.tsx`.
- If CSS styling appears unstyled or overridden improperly, verify that stylesheets in `src/main.tsx` are imported before `./index.css`.
