# Milestone 1 Tokens & Typography Implementation Plan Report

**Document ID:** M1-TOK-PLAN-001  
**Author:** M1 Tokens & Typography Explorer (`explorer_m1_2`)  
**Target Milestone:** Milestone 1 (Design System Foundation, Tokens, and Dependencies)  
**Date:** 2026-11-09T16:24:00Z  

---

## 1. Observation

Direct observations extracted from project files and design specifications:

### 1.1 `index.html` Baseline vs Specification
- **Current `index.html`** (`d:\Sana Soft2\PRoject Code\PPE-FINAL\index.html:1-18`):
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>My Google AI Studio App</title>
      <meta name="description" content="An application built with Google AI Studio." />
      ...
  ```
  *Observed Defects*:
  1. No Google Fonts `<link rel="preconnect">` or stylesheet tags exist.
  2. The root tag `<html lang="en">` lacks an initial `dir="ltr"` attribute, risking layout shifts before client hydration.
  3. `<title>` is generic (`"My Google AI Studio App"`) and lacks HSE branding and operational metadata.
- **Authoritative Specification** (`DESIGN_SYSTEM.md:47, 203-207`, `PROJECT.md:8`, `ORIGINAL_REQUEST.md:25`):
  1. Google Fonts **Almarai** must be loaded globally across weights: `300;400;500;600;700;800`.
  2. `DESIGN_SYSTEM.md:210` observed: *“Google Fonts loads weights 300, 400, 700, 800. However, component code frequently uses font-medium (500) and font-semibold (600), triggering synthetic browser font scaling.”*
  3. Loading `wght@300;400;500;600;700;800&display=swap` resolves synthetic scaling permanently.

### 1.2 `src/index.css` Baseline vs Specification
- **Current `src/index.css`** (`d:\Sana Soft2\PRoject Code\PPE-FINAL\src\index.css:1-46`):
  ```css
  @import "tailwindcss";

  @variant dark (&:where(.dark, .dark *));

  @theme {
    --color-ink: #16181D;
    --color-body: #4B5058;
    --color-canvas: #FAFAF9;
    --color-surface: #FFFFFF;
    --color-border: #E4E4E1;
    --color-accent: #D97F1E;
    --color-accent-subtle: #FCEFDC;
    --color-safety-red: #C4392B;
    --color-safety-green: #2F7D5A;
    --color-safety-amber: #B8720B;

    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  ```
  *Observed Defects*:
  1. The project uses Tailwind CSS v4 (`@tailwindcss/vite: ^4.1.14` and `tailwindcss: ^4.1.14` in `package.json`).
  2. Tokens in `@theme` reflect an outdated prototype palette (`--color-accent: #D97F1E` orange, `--color-canvas: #FAFAF9`, `--font-sans: "Inter"`).
  3. None of the required HSE tokens exist: Primary `#212B59`, Canvas `#F5F6FD` / Dark `#060818`, Borders `#E2E8F0` / Dark `#17263c`, Secondary `#805dca`, or Status scales (`#00ab55`, `#e7515a`, `#e2a03f`, `#2196f3`).
  4. Border radius is not configured for `rounded-xl` (12px) or `rounded-lg` (8px).
  5. Shadows, z-index scales, and spacing tokens (`4.5` = `18px`, `sidebar` = `260px`, `header` = `70px`) are completely missing.
  6. No dark mode CSS variable mappings exist for automated theme switching.

---

## 2. Logic Chain

1. **Tailwind CSS v4 `@theme` Architecture**:
   - In Tailwind CSS v4, styling tokens are registered directly in CSS within `@theme { ... }`.
   - Variables prefixed with `--color-*` automatically generate utility classes for background (`bg-*`), text (`text-*`), border (`border-*`), ring (`ring-*`), and outline (`outline-*`).
   - Defining `--font-sans: 'Almarai', sans-serif;` overrides the default sans stack globally.
   - Defining `--font-Almarai: 'Almarai', sans-serif;` provides backwards-compatible `font-Almarai` classes used throughout Vristo and HSE components.

2. **Dual-Layer Theme Architecture (CSS Variables + Utility Aliases)**:
   - Modern enterprise dashboards require two modes of color application:
     a. **Automated semantic tokens** (e.g. `bg-canvas`, `bg-panel`, `border-border`, `text-text-primary`) that invert automatically when `.dark` is toggled on `document.documentElement` without requiring per-element `dark:` classes.
     b. **Explicit color utilities** (e.g. `bg-primary`, `bg-primary-light`, `bg-black`, `border-white-light`, `dark:bg-[#121e32]`) used in custom card, badge, and input micro-components.
   - To achieve 100% fidelity with `DESIGN_SYSTEM.md`, `:root` and `.dark` blocks in `@layer base` define semantic CSS variables (`--canvas`, `--panel`, `--border`, `--text-primary`), while `@theme` references them and defines fixed color values.

3. **Typography & Arabic RTL Integration**:
   - Google Fonts Almarai includes complete Latin glyph sets alongside Arabic glyphs, providing typographic balance across both languages.
   - Loading `wght@300;400;500;600;700;800&display=swap` ensures that `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), and `font-extrabold` (800) render with native OpenType hinted glyphs rather than synthetic browser skewing/bolding.
   - Setting `document.documentElement.dir = 'rtl'` and `lang = 'ar'` in `useTranslation.ts` pairs with `[dir='rtl']` CSS rules:
     - `[dir='rtl'] select` adjusts background chevron padding from right to left (`background-position: left 0.75rem center;`).
     - Numeric/telephonic elements and code snippets retain strictly LTR layout (`pre, code, [dir='ltr'] { direction: ltr; }`).

4. **Component Utility Classes (`@layer components`)**:
   - Defining foundational utility classes (`.panel`, `.form-input`, `.form-textarea`, `.btn`, `.btn-primary`, `.badge`, `.table-responsive`) in `src/index.css` directly provides the styling foundation needed by Milestones 2 and 3 without duplicating 15-class strings in every component file.

---

## 3. Caveats

1. **Third-Party Stylesheet Imports Order**:
   - When Milestone 1 installs `@mantine/core`, `@mantine/dates`, `flatpickr`, and `tippy.js`, their CSS files must be imported in `src/index.css`.
   - In Tailwind CSS v4, third-party vendor CSS must be placed **before** `@import "tailwindcss";` to allow Tailwind utility classes to override vendor styles with proper specificity.
   - *Crucial*: If vendor stylesheets are imported before packages are installed via `npm install`, Vite will fail compilation with `[vite] Internal server error: Failed to resolve import`. Therefore, the implementation plan specifies that package installation must precede adding vendor imports.
2. **Tailwind v4 Decimal Spacing Identifier**:
   - Tailwind v4 uses underscores for decimal values in CSS variable names (e.g. `--spacing-4_5: 18px;`), which maps to utility class `p-4.5`, `gap-4.5`, `w-4.5`.
3. **WCAG AA Compliance on Status Badges**:
   - `DESIGN_SYSTEM.md:95` notes that solid white text on `#00ab55` (success), `#e7515a` (danger), and `#e2a03f` (warning) has contrast ratios between 2.25:1 and 3.67:1 (failing normal text AA, passing large text/graphics).
   - For status badges, the design system recommends tinted backgrounds with dark text (`bg-success/10 text-success`, or Pharmacy scale `bg-emerald-50 text-emerald-700`) which achieves > 5:1 contrast.

---

## 4. Conclusion & Ready-to-Use Implementation Guide

### 4.1 Token Mapping Matrix

| Design Token | Light Value | Dark Value | Tailwind v4 Variable | Generated Utility Classes |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | `#212B59` | `#212B59` / `#eaf1ff` | `--color-primary` | `bg-primary`, `text-primary`, `border-primary` |
| **Primary Light** | `#eaf1ff` | `rgba(33,43,89,0.3)` | `--color-primary-light` | `bg-primary-light`, `text-primary-light` |
| **Primary Dark-Light** | `rgba(33,43,89,0.15)` | `rgba(234,241,255,0.15)` | `--color-primary-dark-light`| `bg-primary-dark-light` |
| **Secondary** | `#805dca` | `#805dca` | `--color-secondary` | `bg-secondary`, `text-secondary`, `border-secondary` |
| **Secondary Light**| `#ebe4f7` | `rgba(128,93,202,0.2)`| `--color-secondary-light` | `bg-secondary-light` |
| **Success** | `#00ab55` | `#00ab55` | `--color-success` | `bg-success`, `text-success`, `border-success` |
| **Danger** | `#e7515a` | `#e7515a` | `--color-danger` | `bg-danger`, `text-danger`, `border-danger` |
| **Warning** | `#e2a03f` | `#e2a03f` | `--color-warning` | `bg-warning`, `text-warning`, `border-warning` |
| **Info** | `#2196f3` | `#2196f3` | `--color-info` | `bg-info`, `text-info`, `border-info` |
| **Dark Neutral** | `#3b3f5c` | `#eaeaec` | `--color-dark` | `bg-dark`, `text-dark`, `border-dark` |
| **Dark Light** | `#eaeaec` | `#1b2e4b` | `--color-dark-light` | `bg-dark-light` |
| **Black Surface** | `#0e1726` | `#0e1726` | `--color-black` | `bg-black`, `dark:bg-black` |
| **White Surface** | `#ffffff` | `#ffffff` | `--color-white` | `bg-white`, `text-white` |
| **White Light** | `#e0e6ed` | `#191e3a` | `--color-white-light` | `border-white-light`, `bg-white-light/20` |
| **White Dark** | `#888ea8` | `#888ea8` | `--color-white-dark` | `text-white-dark`, `dark:text-white-dark` |
| **Canvas** | `#F5F6FD` | `#060818` | `--color-canvas: var(--canvas)` | `bg-canvas` (auto flips in dark mode) |
| **Panel / Surface**| `#FFFFFF` | `#0e1726` | `--color-panel: var(--panel)` | `bg-panel` (auto flips in dark mode) |
| **Elevated** | `#FFFFFF` | `#181f32` | `--color-elevated: var(--elevated)` | `bg-elevated` |
| **Dropdown** | `#FFFFFF` | `#1b2e4b` | `--color-dropdown: var(--dropdown)` | `bg-dropdown` |
| **Input Surface** | `#FFFFFF` | `#121e32` | `--color-input-dark: #121e32` | `dark:bg-input-dark`, `dark:bg-[#121e32]` |
| **Slate Border** | `#E2E8F0` | `#17263c` | `--color-border: var(--border)` | `border-border`, `dark:border-border-dark` |
| **Divider** | `#e0e6ed` | `#191e3a` | `--color-divider: var(--divider)` | `border-divider` |
| **Text Primary** | `#1E293B` | `#FFFFFF` | `--color-text-primary: var(--text-primary)` | `text-text-primary`, `text-ink` |
| **Text Secondary**| `#64748B` | `#888ea8` | `--color-text-secondary: var(--text-secondary)` | `text-text-secondary`, `text-body` |

---

### 4.2 Exact Replacement for `index.html`

File path: `d:\Sana Soft2\PRoject Code\PPE-FINAL\index.html`

```html
<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HSE Enterprise PPE Management System</title>
    <meta
      name="description"
      content="HSE Enterprise Personal Protective Equipment (PPE) Operations, Compliance, and Inventory Management Platform."
    />
    <meta property="og:title" content="HSE Enterprise PPE Management System" />
    <meta
      property="og:description"
      content="Enterprise PPE safety, compliance, and stock tracking management."
    />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Google Fonts Almarai (Weights 300, 400, 500, 600, 700, 800) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-canvas text-text-primary antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### 4.3 Exact Replacement for `src/index.css`

File path: `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\index.css`

```css
/* Third-Party UI Vendor Styles (Enable after 'npm install') */
/* @import "@mantine/core/styles.css"; */
/* @import "@mantine/dates/styles.css"; */
/* @import "flatpickr/dist/flatpickr.css"; */
/* @import "tippy.js/dist/tippy.css"; */

@import "tailwindcss";

/* Dark mode variant targeting .dark class */
@variant dark (&:where(.dark, .dark *));

@theme {
  /* =========================================================================
     1. Brand & Semantic Color Tokens (DESIGN_SYSTEM.md §1.1)
     ========================================================================= */
  --color-primary: #212B59;
  --color-primary-light: #eaf1ff;
  --color-primary-dark-light: rgba(33, 43, 89, 0.15);

  --color-secondary: #805dca;
  --color-secondary-light: #ebe4f7;
  --color-secondary-dark-light: rgba(128, 93, 202, 0.15);

  --color-success: #00ab55;
  --color-success-light: #ddf5f0;
  --color-success-dark-light: rgba(0, 171, 85, 0.15);

  --color-danger: #e7515a;
  --color-danger-light: #fff5f5;
  --color-danger-dark-light: rgba(231, 81, 90, 0.15);

  --color-warning: #e2a03f;
  --color-warning-light: #fff9ed;
  --color-warning-dark-light: rgba(226, 160, 63, 0.15);

  --color-info: #2196f3;
  --color-info-light: #e7f7ff;
  --color-info-dark-light: rgba(33, 150, 243, 0.15);

  --color-dark: #3b3f5c;
  --color-dark-light: #eaeaec;
  --color-dark-dark-light: rgba(59, 63, 92, 0.15);

  --color-black: #0e1726;
  --color-black-light: #e3e4eb;
  --color-black-dark-light: rgba(14, 23, 38, 0.15);

  --color-white: #ffffff;
  --color-white-light: #e0e6ed;
  --color-white-dark: #888ea8;

  /* Explicit Dark Token Aliases */
  --color-canvas-dark: #060818;
  --color-surface-dark: #0e1726;
  --color-panel-dark: #0e1726;
  --color-border-dark: #17263c;
  --color-divider-dark: #191e3a;
  --color-elevated-dark: #181f32;
  --color-dropdown-dark: #1b2e4b;
  --color-input-dark: #121e32;
  --color-table-header-dark: #1a2941;

  /* =========================================================================
     2. Dynamic Semantic Tokens (Bound to CSS variables)
     ========================================================================= */
  --color-canvas: var(--canvas);
  --color-surface: var(--panel);
  --color-panel: var(--panel);
  --color-elevated: var(--elevated);
  --color-dropdown: var(--dropdown);
  --color-border: var(--border-hairline);
  --color-divider: var(--divider);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-placeholder: var(--text-placeholder);

  /* Backwards compatibility aliases for existing views */
  --color-ink: var(--text-primary);
  --color-body: var(--text-secondary);
  --color-accent: #212B59;
  --color-accent-subtle: #eaf1ff;
  --color-safety-red: #e7515a;
  --color-safety-green: #00ab55;
  --color-safety-amber: #e2a03f;

  /* =========================================================================
     3. Typography Tokens (DESIGN_SYSTEM.md §2)
     ========================================================================= */
  --font-sans: 'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-Almarai: 'Almarai', sans-serif;

  /* =========================================================================
     4. Geometry, Spacing & Border Radii (DESIGN_SYSTEM.md §3)
     ========================================================================= */
  --radius-xs: 4px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-full: 9999px;

  --spacing-4_5: 18px;
  --spacing-header: 70px;
  --spacing-sidebar: 260px;
  --spacing-sidebar-collapsed: 70px;
  --spacing-customizer: 400px;

  /* =========================================================================
     5. Shadows & Elevation (DESIGN_SYSTEM.md §3.4)
     ========================================================================= */
  --shadow-3xl: 0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%);
  --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
  --shadow-card-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08);
  --shadow-popover: 0 20px 60px -24px rgba(14, 28, 48, 0.45);
  --shadow-drawer: 5px 0 25px 0 rgba(94, 92, 154, 0.1);

  /* =========================================================================
     6. Z-Index Scale (DESIGN_SYSTEM.md §3.6)
     ========================================================================= */
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-51: 51;
  --z-60: 60;
}

/* ===========================================================================
   Base Theme Variables (Light & Dark Mappings)
   =========================================================================== */
:root {
  /* Canvas & Surfaces */
  --canvas: #F5F6FD;
  --panel: #FFFFFF;
  --surface: #FFFFFF;
  --elevated: #FFFFFF;
  --dropdown: #FFFFFF;
  --input-bg: #FFFFFF;
  --table-header-bg: #F8FAFC;

  /* Borders & Dividers */
  --border-hairline: #E2E8F0;
  --divider: #e0e6ed;
  --border-input: #E2E8F0;
  --border-table-row: rgba(224, 230, 237, 0.4);

  /* Typography / Text Colors */
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #888ea8;
  --text-placeholder: #8A9AAF;

  /* Scrollbars */
  --scrollbar-thumb: #DDDDDD;
  --scrollbar-thumb-hover: #c0c0c0;
}

.dark {
  /* Canvas & Surfaces */
  --canvas: #060818;
  --panel: #0e1726;
  --surface: #0e1726;
  --elevated: #181f32;
  --dropdown: #1b2e4b;
  --input-bg: #121e32;
  --table-header-bg: #1a2941;

  /* Borders & Dividers */
  --border-hairline: #17263c;
  --divider: #191e3a;
  --border-input: #17263c;
  --border-table-row: #191e3a;

  /* Typography / Text Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #888ea8;
  --text-muted: #64748B;
  --text-placeholder: #506690;

  /* Scrollbars */
  --scrollbar-thumb: #2d334c;
  --scrollbar-thumb-hover: #3c4463;
}

/* ===========================================================================
   Global Base Styling & Font Smoothing
   =========================================================================== */
@layer base {
  body {
    background-color: var(--canvas);
    color: var(--text-primary);
    font-family: var(--font-Almarai), 'Almarai', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
  }

  /* RTL typography and directional resets */
  [dir='rtl'] body,
  [dir='rtl'] .main-section {
    font-family: 'Almarai', sans-serif;
  }

  [dir='rtl'] select {
    background-position: left 0.75rem center;
  }

  /* Strict LTR invariants for code blocks, phone numbers, and IDs */
  pre,
  code,
  [dir='ltr'],
  .dir-ltr {
    direction: ltr;
    text-align: left;
  }

  /* Custom Smooth Scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb);
    border-radius: 9999px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover);
  }
}

/* ===========================================================================
   Design System Components Layer (DESIGN_SYSTEM.md §4)
   =========================================================================== */
@layer components {
  /* Standard Container Card / Surface Panel */
  .panel {
    @apply rounded-xl border border-white-light bg-white p-5 shadow-sm transition-colors duration-200 dark:border-black/20 dark:bg-black;
  }

  /* Form Control Inputs & Textareas */
  .form-input {
    @apply flex h-[40px] w-full rounded-xl border border-border bg-white px-4 py-2 text-sm text-[#1E293B] placeholder:text-[#B0BEC5] transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-[#F5F6FD] dark:border-[#17263c] dark:bg-[#121e32] dark:text-white dark:placeholder:text-[#506690] dark:focus:border-primary;
  }

  .form-textarea {
    @apply w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-[#1E293B] placeholder:text-[#8A9AAF] transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-[#F5F6FD] dark:border-[#17263c] dark:bg-[#121e32] dark:text-white dark:placeholder:text-[#506690] dark:focus:border-primary;
  }

  .form-select {
    @apply form-input pr-10 rtl:pl-10 rtl:pr-4;
  }

  /* Standard Buttons System */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap;
  }

  .btn-sm {
    @apply px-2.5 py-1.5 text-xs min-h-[30px];
  }

  .btn-lg {
    @apply px-7 py-2.5 text-base min-h-[46px];
  }

  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50;
  }

  .btn-secondary {
    @apply btn bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-secondary/50;
  }

  .btn-outline-primary {
    @apply btn border border-primary text-primary hover:bg-primary hover:text-white;
  }

  .btn-outline-secondary {
    @apply btn border border-secondary text-secondary hover:bg-secondary hover:text-white;
  }

  .btn-danger {
    @apply btn bg-danger text-white hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/50;
  }

  .btn-success {
    @apply btn bg-success text-white hover:bg-success/90 focus-visible:ring-2 focus-visible:ring-success/50;
  }

  .btn-warning {
    @apply btn bg-warning text-white hover:bg-warning/90 focus-visible:ring-2 focus-visible:ring-warning/50;
  }

  .btn-info {
    @apply btn bg-info text-white hover:bg-info/90 focus-visible:ring-2 focus-visible:ring-info/50;
  }

  .btn-dark {
    @apply btn bg-dark text-white hover:bg-dark/90 focus-visible:ring-2 focus-visible:ring-dark/50;
  }

  /* Status Badges */
  .badge {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider;
  }

  .badge-primary {
    @apply badge bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light;
  }

  .badge-success {
    @apply badge bg-success-light text-success border border-success/20 dark:bg-success/20 dark:text-success;
  }

  .badge-danger {
    @apply badge bg-danger-light text-danger border border-danger/20 dark:bg-danger/20 dark:text-danger;
  }

  .badge-warning {
    @apply badge bg-warning-light text-warning border border-warning/20 dark:bg-warning/20 dark:text-warning;
  }

  .badge-info {
    @apply badge bg-info-light text-info border border-info/20 dark:bg-info/20 dark:text-info;
  }

  .badge-secondary {
    @apply badge bg-secondary-light text-secondary dark:bg-secondary/20 dark:text-secondary-light;
  }

  .badge-dark {
    @apply badge bg-dark-light text-dark dark:bg-dark dark:text-white;
  }

  /* Data Table Layout Utilities */
  .table-responsive {
    @apply overflow-x-auto w-full;
  }

  .table-custom {
    @apply w-full text-sm text-[#1E293B] dark:text-white-dark;
  }

  .table-custom thead tr {
    @apply bg-[#F8FAFC] text-[#475569] font-bold border-b border-white-light/40 dark:bg-[#1a2941] dark:text-white dark:border-[#191e3a];
  }

  .table-custom tbody tr {
    @apply border-b border-white-light/40 transition-colors hover:bg-white-light/20 dark:border-[#191e3a] dark:hover:bg-[#1a2941]/40;
  }
}
```

---

## 5. Verification Method

To independently verify the implementation plan:

1. **Syntax & TypeScript Integrity**:
   Verify that changing `src/index.css` and `index.html` does not trigger type or build compilation errors:
   ```powershell
   npm run lint
   npm run build
   ```
   *Expected Result*: Exits with code `0`. Vite builds `dist/assets/index-*.css` containing compiled design tokens and utility rules.

2. **Font Loading Verification in Browser**:
   Execute in the browser console:
   ```javascript
   document.fonts.check('16px Almarai'); // returns true
   getComputedStyle(document.body).fontFamily; // contains "Almarai"
   ```

3. **Color Token Verification**:
   Inspect computed properties:
   - Primary button: `background-color` is `rgb(33, 43, 89)` (`#212B59`).
   - Page body: `background-color` is `rgb(245, 246, 253)` (`#F5F6FD`) in light mode; `rgb(6, 8, 24)` (`#060818`) in dark mode.
   - Panel card: `border-radius` is `12px` (`rounded-xl`), `background-color` is `#FFFFFF` in light mode and `#0e1726` in dark mode.

4. **Bilingual / RTL Verification**:
   - Set `<html lang="ar" dir="rtl">`:
     - Select chevrons position at `left: 0.75rem`.
     - Code blocks and phone numbers remain strictly `direction: ltr`.
     - All body and table typography renders using Google Fonts Almarai.

5. **Invalidation Conditions**:
   - If third-party CSS files (e.g. `@mantine/core/styles.css`) are imported prior to package installation, Vite build will fail. Maintain the commented imports until packages are installed.
   - If `@theme` values use raw dashes instead of underscores for decimal spacing (e.g. `--spacing-4.5` instead of `--spacing-4_5`), Tailwind v4 will fail parsing. Keep `--spacing-4_5: 18px;`.
