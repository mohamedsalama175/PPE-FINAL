# HSE Front-End Design System Specification

> **Visual Identity Summary:**  
> The HSE (Health, Safety & Environment) enterprise web application exhibits a clean, corporate administrative visual identity with high information density, tailored for data-intensive risk, clinical, incident, and compliance management. The visual tone is anchored by a deep navy corporate primary color (`#212B59`) paired with a cool lavender-tinted background (`#F5F6FD`), soft rounded-xl card surfaces (12px radius), crisp hairline slate borders (`#E2E8F0`), and prominent status badges. Typography is universally powered by Google's **Almarai** font family across both Arabic (RTL) and English (LTR), providing unified typographic balance across languages. While the visual framework descends from the Vristo administrative theme, it has been customized into a data-first dashboard with structured KPI cards, dense tables, Mantine form controls, and bilingual layouts.

---

## Step 1: Discovery & Architecture

### 1.1 Styling Approach
- **Core Framework:** [Tailwind CSS v3.3.2](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L115) with `@tailwindcss/forms` (strategy: `'class'`) and `@tailwindcss/typography`.
- **Hybrid Component Libraries:** 
  - [@mantine/core v8.2.4](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L23) & [@mantine/dates v8.2.4](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L24) for advanced form inputs (`Select`, `MultiSelect`, `Switch`, `Stepper`, `Modal`, `Accordion`, `Pagination`, `Tooltip`).
  - [Headless UI v1.7.3](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L79) (present in devDependencies, unused in active `src/`).
  - [SweetAlert2 v11.6.8](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L69) for confirmation dialogs and toast alerts.
  - [Flatpickr v3.10.13](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L55) (`react-flatpickr`) for date/time pickers.
  - [ApexCharts v3.54.1](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L37) (`react-apexcharts`) for dashboards and metrics.
  - [react-popper v2.3.0](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L58) / `@tippyjs/react v4.2.6` for dropdowns and floating tooltips.
  - [react-perfect-scrollbar v1.5.8](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/package.json#L114) for sidebar and container overflow scrolling.
- **Custom CSS Layers:** Legacy CSS theme overrides in [hse-frontend/src/assets/css/](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/assets/css/) imported by [hse-frontend/src/tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L1-L45).

### 1.2 Configuration Files
- **Tailwind Config:** [hse-frontend/tailwind.config.cjs](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs) (Color tokens, font family, spacing, shadows).
- **PostCSS Config:** [hse-frontend/postcss.config.cjs](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/postcss.config.cjs) (`tailwindcss`, `autoprefixer`).
- **Global CSS:** [hse-frontend/src/tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css) (Global component layer, buttons, tables, forms, dark mode, animations).
- **Theme Slice:** [hse-frontend/src/store/themeConfigSlice.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/store/themeConfigSlice.tsx) (Redux store handling theme, layout, direction, navbar, animation).
- **App Theme Settings:** [hse-frontend/src/core/theme/theme.config.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/theme/theme.config.tsx) (Environment defaults).
- **HTML Shell:** [hse-frontend/index.html](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/index.html) (Font preloading, meta tags).

### 1.3 UI Libraries & Dependencies (Exact Versions)
| Package | Version | Purpose in Design System |
| :--- | :--- | :--- |
| `react` / `react-dom` | `^18.2.0` | Core UI library |
| `tailwindcss` | `^3.3.2` | Utility-first styling engine |
| `@mantine/core` | `^8.2.4` | Form inputs, Stepper, Switch, Select, Modal, Accordion |
| `@mantine/dates` | `^8.2.4` | Mantine date integration styles |
| `lucide-react` | `^1.25.0` | Primary iconography system |
| `sweetalert2` | `^11.6.8` | Alerts, confirmation modals, toasts |
| `apexcharts` | `^3.54.1` | Dashboard and business intelligence charts |
| `react-flatpickr` | `^3.10.13` | DateTime pickers |
| `@tippyjs/react` | `^4.2.6` | Action buttons tooltips |
| `react-popper` | `^2.3.0` | Dropdown floating positioning |
| `i18next` / `react-i18next` | `^21.10.0` / `^11.18.6` | RTL/LTR bilingual engine (Arabic/English) |
| `formik` / `yup` | `^2.2.9` / `^0.32.11` | Form state management and schema validation |

### 1.4 Fonts and Iconography
- **Font Family:** **Almarai** (`'Almarai', sans-serif`) loaded from Google Fonts (`wght@300;400;700;800`) in [index.html](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/index.html#L39).
- **Icon Library:** `lucide-react` (1.25.0) used across buttons, inputs, navigation, badges, and feedback panels.
- **Custom SVGs:** Inline SVGs and SVGR imported assets (`gemini.svg`, `gallery-import.svg`, `calender.svg`, `timer.svg`, `panic.svg`, `loader.svg`, `avatar.svg`).

### 1.5 Shared Component Structure
- `src/core/layouts/`: App Shell (`DefaultLayout`, `Header`, `Sidebar`, `Footer`, `Setting`, `Menu`).
- `src/shared/components/Buttons/`: `Button`, `CreateAction`, `FilterActions`, `SearchAction`.
- `src/shared/components/Inputs/`: `FormikField`, `FormikTextArea`, `FormikCheckBox`, `FormikRadioInput`, `FormikSwitchInput`, `FormikDateTimePicker`, `FormikFileUpload`.
- `src/shared/components/TableData/`: `CustomTable`, `TableActionsButtons`, `ActivationToggle`, `SharedAppliedFilters`.
- `src/shared/components/`: `Container`, `ContainerCard`, `Breadcrumbs`, `Pagination`, `Tabs`, `StepProgress`, `AttachmentsLinksModal`, `Dropdown`, `NotificationsDropdown`, `EmptyState`, `ErrorDisplay`, `Loading`, `PersonCard`, `ModuleGrid`.

---

## Step 2: Token Extraction & Deep Specifications

### 1. Color Palette

#### 1.1 Brand & Semantic Palette (Config Tokens)
Source: [hse-frontend/tailwind.config.cjs](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L10-L56)

| Token Name | Exact Hex / Value | Purpose / Usage | Contrast vs #FFFFFF | Contrast vs #F5F6FD | Contrast vs #060818 (Dark) | WCAG Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `primary.DEFAULT` | `#212B59` | Primary brand, main buttons, headers, active tabs | 13.51:1 | 12.53:1 | 1.47:1 | Passes AAA (Light) / **Fails Dark** |
| `primary.light` | `#eaf1ff` | Primary highlight tint, badge backgrounds | 1.13:1 | 1.05:1 | 17.55:1 | Background tint only |
| `primary.dark-light` | `rgba(67,97,238,.15)` | Primary translucent chip bg (*Legacy #4361ee*) | N/A | N/A | N/A | Translucent badge |
| `secondary.DEFAULT` | `#805dca` | Secondary actions, purple accents | 4.84:1 | 4.49:1 | 4.11:1 | Passes AA (Text on White) |
| `secondary.light` | `#ebe4f7` | Secondary highlight tint | 1.24:1 | 1.15:1 | 16.08:1 | Background tint only |
| `secondary.dark-light` | `rgb(128 93 202 / 15%)` | Secondary translucent chip bg | N/A | N/A | N/A | Translucent badge |
| `success.DEFAULT` | `#00ab55` | Success alerts, completed badges, active toggles | 3.02:1 | 2.80:1 | 6.59:1 | **Fails Normal Text Light** / Passes Dark |
| `success.light` | `#ddf5f0` | Success banner background | 1.14:1 | 1.06:1 | 17.42:1 | Background tint only |
| `success.dark-light` | `rgba(0,171,85,.15)` | Success translucent chip bg | N/A | N/A | N/A | Translucent badge |
| `danger.DEFAULT` | `#e7515a` | Danger actions, delete buttons, error borders | 3.67:1 | 3.40:1 | 5.42:1 | **Fails Normal Text Light** / Passes Dark |
| `danger.light` | `#fff5f5` | Error banner background | 1.07:1 | 1.01:1 | 18.60:1 | Background tint only |
| `danger.dark-light` | `rgba(231,81,90,.15)` | Danger translucent chip bg | N/A | N/A | N/A | Translucent badge |
| `warning.DEFAULT` | `#e2a03f` | Warning alerts, pending badges, edit actions | 2.25:1 | 2.09:1 | 8.84:1 | **Fails Normal Text Light** / Passes AAA Dark |
| `warning.light` | `#fff9ed` | Warning banner background | 1.05:1 | 1.03:1 | 18.97:1 | Background tint only |
| `warning.dark-light` | `rgba(226,160,63,.15)` | Warning translucent chip bg | N/A | N/A | N/A | Translucent badge |
| `info.DEFAULT` | `#2196f3` | Informational notices, filter buttons | 3.12:1 | 2.90:1 | 6.37:1 | **Fails Normal Text Light** / Passes Dark |
| `info.light` | `#e7f7ff` | Info banner background | 1.10:1 | 1.02:1 | 18.14:1 | Background tint only |
| `info.dark-light` | `rgba(33,150,243,.15)` | Info translucent chip bg | N/A | N/A | N/A | Translucent badge |
| `dark.DEFAULT` | `#3b3f5c` | Neutral dark, cancel buttons, headings | 10.24:1 | 9.50:1 | 1.94:1 | Passes AAA (Light) |
| `dark.light` | `#eaeaec` | Neutral light chip background | 1.20:1 | 1.11:1 | 16.56:1 | Background tint only |
| `dark.dark-light` | `rgba(59,63,92,.15)` | Translucent dark chip bg | N/A | N/A | N/A | Translucent badge |
| `black.DEFAULT` | `#0e1726` | Dark theme surface, dark popups | 17.96:1 | 16.66:1 | 1.11:1 | Dark surface / Text on light |
| `white.DEFAULT` | `#ffffff` | Light card surfaces, button text | 1.00:1 | 1.08:1 | 19.89:1 | Surface / White text |
| `white.light` | `#e0e6ed` | Default borders, dividers | 1.26:1 | 1.17:1 | 15.83:1 | Border token |
| `white.dark` | `#888ea8` | Muted dark-mode text, secondary descriptions | 3.24:1 | 3.01:1 | 6.14:1 | **Fails Light AA** / Passes Dark AA |

*Note on WCAG Compliance:* Solid buttons `btn-success`, `btn-danger`, `btn-warning`, and `btn-info` render `#ffffff` text on their respective default colors. Against white text, `success` has a contrast of **3.02:1**, `danger` has **3.67:1**, `warning` has **2.25:1**, and `info` has **3.12:1**. These fail WCAG AA for normal text (requires 4.5:1), passing only for large text (>= 18pt) or graphical components.

#### 1.2 Neutral & Surface Tokens (Code-Extracted)
Sources: [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), [FormikField.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikField.tsx), [CustomTable.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/CustomTable.tsx)

| Token / Value | Where It Is Used | Role in Design System | Contrast vs #FFFFFF | Contrast vs #060818 (Dark) | WCAG Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `#F5F6FD` | `body`, `sidebar` hover, active tab background | Page canvas background (light) | 1.08:1 | 18.46:1 | Background token |
| `#060818` | `body.dark`, `screen_loader` dark background | Page canvas background (dark) | 19.89:1 | 1.00:1 | Dark canvas token |
| `#FFFFFF` | `.panel`, `ContainerCard`, inputs, cards | Card & panel surface (light) | 1.00:1 | 19.89:1 | Light surface token |
| `#0e1726` | `.panel dark:bg-black`, card dark surfaces | Card & panel surface (dark) | 17.96:1 | 1.11:1 | Dark surface token |
| `#121e32` | Form inputs `dark:bg-[#121e32]` | Dark mode input control surface | 16.70:1 | 1.19:1 | Dark input surface |
| `#E2E8F0` | `.form-input`, `.form-textarea`, modals | Default input & container border | 1.23:1 | 16.14:1 | Border token |
| `#17263c` | Dark inputs `dark:border-[#17263c]` | Dark mode input border | 15.23:1 | 1.31:1 | Dark border token |
| `#191e3a` | Dark table rows, dark menu borders | Dark mode table/menu divider | 16.30:1 | 1.22:1 | Dark divider token |
| `#1E293B` | `FormikField`, `FormikTextArea`, labels | Primary text color in form controls | 14.63:1 | 1.36:1 | Passes AAA (Light) |
| `#374151` | `label` in `tailwind.css` (Tailwind Gray 700) | Form labels | 10.31:1 | 1.93:1 | Passes AAA (Light) |
| `#475569` | `CustomTable.tsx` headers, `useSwal.tsx` body | Table headers & modal secondary text | 7.58:1 | 2.63:1 | Passes AAA (Light) |
| `#64748B` | `CustomTable.tsx` cells, `Sidebar.tsx` nav text | Table body cells, sidebar nav links | 4.76:1 | 4.18:1 | Passes AA (Light) |
| `#8A9AAF` | `FormikField` helper text, Stepper separator | Form helper text, inactive checkbox border | 2.87:1 | 6.94:1 | **Fails AA Light** / Passes AA Dark |
| `#B0BEC5` | `.form-input placeholder:text-[#B0BEC5]` | Input placeholder text | 1.91:1 | 10.44:1 | **Fails AA Light** / Passes AAA Dark |

#### 1.3 Status & Badge Color Scales (Exact Values from Code)
Sources: [taskPriorities.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/tasks/utils/constants/taskPriorities.ts), [taskStatuses.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/tasks/utils/constants/taskStatuses.ts), [statusConfig.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/incidents-management/incidents/utils/statusConfig.ts), [PharmacyStatusBadge.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/pharmacy/shared/components/PharmacyStatusBadge.tsx), [ActivationToggle.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/ActivationToggle.tsx)

| Context | Status | Background Token / Class | Text / Icon Token / Class | Border Token / Hex | Contrast vs Badge Bg | WCAG Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Incident Status** | Open / Published | `bg-success/5` | `text-success` (`#00ab55`) | `border-success/20` | 2.91:1 | **Fails AA Normal Text** |
| | Draft / Drafted | `bg-warning/5` | `text-warning` (`#e2a03f`) | `border-warning/20` | 2.18:1 | **Fails AA Normal Text** |
| | Closed | `bg-danger/5` | `text-danger` (`#e7515a`) | `border-danger/20` | 3.51:1 | **Fails AA Normal Text** |
| **Task Priority** | Critical | `bg-red-100` | `text-red-700` (Hex map: `#ef4444`) | None | 3.08:1 (vs bg) | **Fails AA Normal Text** |
| | High | `bg-orange-100` | `text-orange-700` (Hex map: `#f97316`) | None | 2.43:1 (vs bg) | **Fails AA Normal Text** |
| | Medium | `bg-yellow-100` | `text-yellow-700` (Hex map: `#eab308`) | None | 1.79:1 (vs bg) | **Fails AA Normal Text** |
| | Low | `bg-green-100` | `text-green-700` (Hex map: `#22c55e`) | None | 2.07:1 (vs bg) | **Fails AA Normal Text** |
| **Task Status** | Not Started | `bg-slate-50` / `bg-gray-100` | `text-slate-500` / `text-gray-600` | `border-slate-200` | 4.65:1 (vs bg) | Passes AA |
| | In Progress / Started | `bg-blue-50` / `bg-blue-100` | `text-blue-600` | `border-blue-200` | 4.80:1 (vs bg) | Passes AA |
| | Completed | `bg-emerald-50` / `bg-green-100` | `text-emerald-600` | `border-emerald-200` | 4.72:1 (vs bg) | Passes AA |
| **Pharmacy Status** | Approved | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | 5.84:1 (vs bg) | Passes AA |
| | Pending Approval | `bg-amber-50` | `text-amber-700` | `border-amber-200` | 5.12:1 (vs bg) | Passes AA |
| | Draft | `bg-slate-100` | `text-slate-600` | `border-slate-200` | 5.34:1 (vs bg) | Passes AA |
| | Rejected | `bg-red-50` | `text-red-700` | `border-red-200` | 6.01:1 (vs bg) | Passes AA |
| **Activation Toggle**| Active (Badge) | `bg-teal-100 dark:bg-teal-900/40` | `text-teal-700 dark:text-teal-300` | Dot: `bg-teal-500` | 5.62:1 (vs bg) | Passes AA |
| | Inactive (Badge) | `bg-red-100 dark:bg-red-900/40` | `text-red-600 dark:text-red-400` | Dot: `bg-red-500` | 4.95:1 (vs bg) | Passes AA |

*Note on Status Badge Contrast:* Status badges using light translucent backgrounds (5% opacity in incident badges, or standard Tailwind 100-level pastel backgrounds) with brand-tinted text fail the 4.5:1 ratio when text is thin or small (< 18pt). The Pharmacy status scale uses darker 700-level text on 50-level backgrounds, successfully achieving full WCAG AA compliance (> 5:1).

#### 1.4 Chart & Data-Visualization Colors
Sources: [chartColors.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/dashboard/utils/chartColors.ts), [RoleDetails.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/roles/components/RoleDetails.tsx#L44-L53)

| Series / Module Token | Exact Hex | Role in Visual System | Typical Background | Contrast vs White | Contrast vs Dark Canvas (#060818) | WCAG Status (Text) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `chartColors[0]` | `#2a78d6` | HSE Metric Blue — Incidents Series 1 | `#FFFFFF` | 4.42:1 | 4.51:1 | Borderline AA (Large/Graphics) |
| `chartColors[1]` | `#eb6834` | HSE Coral Orange — CAPA Tasks Series 2 | `#FFFFFF` | 3.20:1 | 6.22:1 | Passes Graphical / Fails Normal Text |
| `chartColors[2]` | `#1baf7a` | HSE Emerald Green — Clinic Visits Series 3 | `#FFFFFF` | 2.82:1 | 7.07:1 | Passes Graphical / Fails Normal Text |
| `MODULE_COLORS[0]` | `#4F46E5` | Indigo — Users Management | `#FFFFFF` | 6.29:1 | 3.16:1 | Passes AA (Light) |
| `MODULE_COLORS[1]` | `#059669` | Emerald — Clinic Module | `#FFFFFF` | 3.77:1 | 5.28:1 | Passes AA (Dark) |
| `MODULE_COLORS[2]` | `#DC2626` | Red — Incidents Module | `#FFFFFF` | 4.83:1 | 4.12:1 | Passes AA (Light) |
| `MODULE_COLORS[3]` | `#D97706` | Amber — Tasks Module | `#FFFFFF` | 3.19:1 | 6.24:1 | Passes AA (Dark) |
| `MODULE_COLORS[4]` | `#0891B2` | Cyan — Pharmacy Module | `#FFFFFF` | 3.68:1 | 5.40:1 | Passes AA (Dark) |
| `MODULE_COLORS[5]` | `#7C3AED` | Violet — Reports Module | `#FFFFFF` | 5.70:1 | 3.49:1 | Passes AA (Light) |
| `MODULE_COLORS[6]` | `#DB2777` | Pink — Audits Module | `#FFFFFF` | 4.60:1 | 4.33:1 | Passes AA (Light) |
| `MODULE_COLORS[7]` | `#65A30D` | Lime — Settings Module | `#FFFFFF` | 3.09:1 | 6.44:1 | Passes AA (Dark) |

#### 1.5 Interactive Clinical Injury Severity Colors
Source: [injuryColors.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/utils/injuryColors.ts)

| Injury Classification | Fill Color Hex | Border Color Hex | Contrast vs White | WCAG Status |
| :--- | :--- | :--- | :--- | :--- |
| Cut | `#ef4444` | `#dc2626` | 3.76:1 | Graphical Component OK |
| Laceration | `#b91c1c` | `#991b1b` | 6.47:1 | Passes AA Text |
| Bruise / Contusion | `#a855f7` | `#c084fc` | 3.96:1 | Graphical Component OK |
| Burn | `#f97316` | `#ea580c` | 2.80:1 | Graphical Component OK |
| Fracture | `#eab308` | `#ca8a04` | 1.92:1 | Graphical Component OK |
| Sprain / Strain | `#3b82f6` | `#60a5fa` | 3.68:1 | Graphical Component OK |
| Dislocation | `#f59e0b` | `#d97706` | 2.15:1 | Graphical Component OK |
| Puncture | `#dc2626` | `#b91c1c` | 4.83:1 | Passes AA Text |
| Crush | `#7f1d1d` | `#6b1818` | 10.02:1 | Passes AAA Text |

#### 1.6 Dark Mode Palette Mapping Table
Sources: [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), [tailwind.config.cjs](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs), [datatables.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/assets/css/datatables.css)

| Light Token / Surface | Dark Equivalent | Source File & Selector | Contrast vs Dark Canvas (#060818) | WCAG Status |
| :--- | :--- | :--- | :--- | :--- |
| `body` (`#F5F6FD`) | `body.dark` (`#060818`) | `tailwind.css:59` | 1.00:1 | Base Canvas |
| `.panel` (`#FFFFFF`) | `dark:bg-black` (`#0e1726`) | `tailwind.css:65` | 1.11:1 | Surface Panel |
| Form inputs (`#FFFFFF`) | `dark:bg-[#121e32]` | `tailwind.css:359` | 1.19:1 | Input Surface |
| Form input border (`#E2E8F0`) | `dark:border-[#17263c]` | `tailwind.css:359` | 1.31:1 | Input Border |
| Sidebar nav link hover (`#F5F6FD`) | `dark:hover:bg-[#181f32]` | `tailwind.css:86` | 1.25:1 | Nav Surface |
| Sidebar nav link text (`#506690`) | `dark:hover:text-white-dark` (`#888ea8`) | `tailwind.css:86` | 6.14:1 | Passes AA Text |
| Table header background (`white-light/30`) | `dark:!bg-[#1a2941]` | `tailwind.css:520` | 1.48:1 | Header Surface |
| Table row border (`white-light/40`) | `dark:!border-[#191e3a]` | `tailwind.css:532` | 1.22:1 | Row Divider |
| Table row hover (`white-light/20`) | `dark:hover:!bg-[#1a2941]/40` | `tailwind.css:535` | 1.15:1 | Hover State |
| Checkbox unchecked border (`white-light`) | `dark:border-[#253b5c]` | `tailwind.css:435` | 2.10:1 | Border Indicator |
| Menu sub-menu popup (`#FFFFFF`) | `dark:bg-[#1b2e4b]` | `tailwind.css:153` | 1.55:1 | Elevated Menu |
| Scrollbar thumb (`#DDDDDD`) | `dark:!bg-[#2d334c]` | `tailwind.css:564` | 2.30:1 | Scroll Track |
| Text Primary (`#1E293B`) | `dark:text-white` (`#FFFFFF`) | `App.tsx:47` | 19.89:1 | Passes AAA Text |
| Text Muted (`#64748B`) | `dark:text-white-dark` (`#888ea8`) | `tailwind.css:359` | 6.14:1 | Passes AA Text |

---

## 2. Typography

### 2.1 Font Families & Loading
- **Universal Font Family:** `Almarai`, fallback `sans-serif`.
  - Configured in [tailwind.config.cjs](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L58): `fontFamily: { Almarai: ['Almarai', 'sans-serif'] }`.
  - Applied to `body` in [tailwind.css:56](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L56) and root app wrapper in [App.tsx:47](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/App.tsx#L47).
  - Explicitly reapplied to Arabic RTL in [tailwind.css:381](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L381): `[dir='rtl'] body, [dir='rtl'] .main-section { @apply font-Almarai; }`.
- **Loading Method:** Preloaded stylesheet via Google Fonts CDN in [index.html:35-46](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/index.html#L35-L46):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
        href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" />
  ```
- **Latin Font Stack:** *Not defined in code as an independent font.* The English/Latin text renders under Almarai (which bundles Latin glyphs) with system `sans-serif` fallback.
- **Font Weight Inconsistency:** Google Fonts loads weights `300` (Light), `400` (Regular), `700` (Bold), `800` (Extra Bold). However, component code frequently uses `font-medium` (500) and `font-semibold` (600), triggering synthetic browser font scaling.

### 2.2 Type Scale
Sources: [tailwind.config.cjs:71-76](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L71-L76), [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), Component files

| Semantic Level | Font Size | Font Weight | Line Height | Letter Spacing | Source & Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `h1` (Typography) | `40px` (2.5rem) | 800 (Bold) | Normal | Normal | `tailwind.config.cjs:71` |
| `h2` (Typography) | `32px` (2rem) | 700 (Bold) | Normal | Normal | `tailwind.config.cjs:72` |
| `h3` (Typography) | `28px` (1.75rem)| 700 (Bold) | Normal | Normal | `tailwind.config.cjs:73` |
| `h4` (Typography) | `24px` (1.5rem) | 700 (Bold) | Normal | Normal | `tailwind.config.cjs:74` |
| `h5` (Typography) | `20px` (1.25rem)| 700 (Bold) | Normal | Normal | `tailwind.config.cjs:75` |
| `h6` (Typography) | `16px` (1rem)   | 700 (Bold) | Normal | Normal | `tailwind.config.cjs:76` |
| **Page Title** | `24px` / `20px` (mobile)| 900 (`font-black`)| 1.25 | `-0.025em` (`tracking-tight`) | `GeneralDashboard.tsx:66` |
| **Card Header** | `18px` (`text-lg`)| 700 (`font-bold`)| 1.35 | Normal | `ContainerCard.tsx:33` |
| **Section Header**| `18px` (`text-lg`)| 600 (`font-semibold`)| 1.35 | Normal | `UserForm.tsx:142` |
| **Body (Default)**| `14px` (`text-sm`)| 400 (`font-normal`)| 1.43 (20px)| Normal | `App.tsx:47` |
| **Form Label** | `15px` | 500 (`font-medium`)| 1.4 | Normal | `tailwind.css:379` |
| **Input / Control**| `14px` (`text-sm`)| 400 (`font-normal`)| 1.43 | Normal | `tailwind.css:359` |
| **Table Header** | `14px` | 700 (`font-bold`)| 1.43 | `0.05em` (`tracking-wider`) | `CustomTable.tsx:70`, `datatables.css:2` |
| **Table Body Cell**| `14px` | 500 (`font-medium`)| 1.43 | Normal | `datatables.css:5` |
| **Button Text** | `13px` | 500 (`font-medium`)| 1.4 | Normal | `Button.tsx:73` |
| **Caption / Helper**| `12px` (`text-xs`)| 400 (`font-normal`)| 1.33 | Normal | `FormikField.tsx:108` |
| **Badge / Tag** | `11px` / `12px` | 600 (`font-semibold`)| 1.2 | `0.05em` (`tracking-wider`) | `PharmacyStatusBadge.tsx:33` |
| **Micro Tag (ID)**| `9px` | 700 (`font-bold`)| 1.1 | `0.05em` (`tracking-wider`) | `PersonCard/index.tsx:110` |

### 2.3 RTL vs LTR Text Rendering Nuances
- **Text Alignment:** Handled by Tailwind directional prefixes (`ltr:text-left rtl:text-right`).
- **Select Arrows:** RTL moves native select chevron position: `[dir='rtl'] select { background-position: left 0.5rem center; }` ([tailwind.css:386](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L386)).
- **Phone Numbers:** Forced to LTR via `<span dir="ltr">` in [PersonCard/index.tsx:160](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/PersonCard/index.tsx#L160) to prevent inverted hyphen/parentheses rendering.
- **Code & IDs:** `<pre>` forced to LTR via `pre { direction: ltr; }` ([tailwind.css:553](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L553)).

---

## 3. Spacing, Shape, and Elevation

### 3.1 Spacing Scale & Base Unit
- **Base Grid:** `4px` (Tailwind standard 1 unit = `0.25rem` = `4px`).
- **Custom Spacing Extension:**
  - `4.5` = `18px` ([tailwind.config.cjs:61](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L61)).
- **Common Container Gaps:**
  - Form field row gaps: `gap-4` (`16px`)
  - Form field margin bottom: `mb-3` (`12px`) or `mb-6` (`24px` between form sections)
  - Card padding: `p-3` (`12px`), `p-4` (`16px`), `p-5` (`20px`)
  - Page container padding: `p-2 md:p-4` ([Container.tsx:8](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Container.tsx#L8)) or `p-4 md:p-8` (Dashboard)

### 3.2 Border Radius Scale
Sources: [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), [Button.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/Button.tsx), [ContainerCard.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/ContainerCard.tsx)

| Value | Tailwind Class | Elements & Components Using It |
| :--- | :--- | :--- |
| `4px` | `rounded` | Checkbox boxes, badge base, table sub-bullet indicators |
| `6px` | `rounded-md` | Legacy `.btn` (tailwind.css), sidebar sub-menu items, SweetAlert buttons |
| `8px` | `rounded-lg` | Standard `Button.tsx`, `.panel` (tailwind.css), Breadcrumb items, custom tabs |
| `12px` | `rounded-xl` | `.form-input`, `.form-textarea`, `ContainerCard`, `PersonCard`, `KpiCard`, table `thead` |
| `16px` | `rounded-2xl` | Notifications dropdown menu, ModuleGrid icons, empty state inbox container |
| `20px` | `rounded-[20px]` | Mantine Accordion items in `RoleDetails.tsx` |
| `24px` | `rounded-[1.5rem]`| ErrorDisplay icon badge |
| `32px` / `40px` | `rounded-[2rem]` / `rounded-[2.5rem]` | ErrorDisplay card container, Timeline skeleton card |
| `9999px` | `rounded-full` | Status pills, avatars, scroll-to-top button, pagination buttons |

### 3.3 Border Widths and Styles
Sources: [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), [FormikField.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikField.tsx), [FormikFileUpload.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikFileUpload.tsx), [FormikRadioInput.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikRadioInput.tsx)

| Token / Class | Width Value | Style | Where It Is Used | Code Citation |
| :--- | :--- | :--- | :--- | :--- |
| `border` | `1px` | `solid` | Form inputs, panels, modal dividers, table rows | `tailwind.css:359`, `FormikField.tsx:207` |
| `border-2` | `2px` | `solid` | Checkbox outline, radio option border (selected) | `tailwind.css:434`, `FormikRadioInput.tsx:47` |
| `border-2 border-dashed` | `2px` | `dashed` | File upload dropzone | `FormikFileUpload.tsx:184` |
| `border-dashed` | `1px` / `2px` | `dashed` | Unselected radio options, stepper connecting line | `FormikRadioInput.tsx:49`, `StepProgress:37` |
| `border-[.5px]` | `0.5px` | `solid` | Legacy `.card` border | `tailwind.css:557` |
| `border-0` | `0px` | `none` | Checked card checkbox, solid buttons, transparent panels | `FormikCheckBox.tsx:32`, `Button.tsx:35` |
| `border-b` / `border-t` | `1px` | `solid` | Modal header/footer separators, section headers | `AttachmentsLinksModal.tsx`, `UserForm.tsx` |
| `border-b-2` | `2px` | `solid` | Active tab indicator, sidebar header logo container | `Tabs/index.tsx:32`, `Sidebar.tsx:75` |

### 3.4 Elevation & Box Shadows
Sources: [tailwind.config.cjs:64](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L64), [tailwind.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css), Component files

| Shadow Level | Class / Exact CSS Definition | Where It Is Used |
| :--- | :--- | :--- |
| `3xl` (Config) | `0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)` | Custom config token |
| Colored Button Shadow | `shadow-[0_10px_20px_-10px]` with color opacity (e.g. `shadow-primary/60`) | Legacy `.btn` in `tailwind.css:261` |
| Flat Card Shadow | `shadow-sm` | Default `KpiCard`, `PersonCard`, `ContainerCard` |
| Hover Elevation | `hover:shadow-md hover:-translate-y-0.5` | Interactive cards, action buttons |
| Floating Popover | `shadow-[0_20px_60px_-24px_rgba(14,28,48,0.45)]` | `NotificationsDropdown.tsx:99` |
| Off-canvas Drawer | `shadow-[5px_0_25px_0_rgba(94,92,154,0.1)]` | `Setting.tsx:29` (Customizer panel) |
| Glassmorphic Modal | `shadow-[0_8px_40px_rgb(0,0,0,0.05)]` (dark: `rgb(0,0,0,0.2)`) | `ErrorDisplay.tsx:167` |
| SweetAlert Toast | `box-shadow: 0 0 0.625em #d9d9d9` | `sweetalert.css:80` |

### 3.5 Breakpoints & Layout Dimensions
- `sm`: `640px` (Mobile landscape / small tablet)
- `md`: `768px` (Tablet)
- `lg`: `1024px` (**Crucial Shell Breakpoint** — sidebar switches from hidden drawer to persistent sidebar)
- `xl`: `1280px` (Desktop layout)
- `2xl`: `1536px` (Wide monitor)
- **Container Max Width (Boxed Mode):** `1400px` (`.boxed-layout` in [tailwind.css:247](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L247)).
- **Sidebar Width:**
  - Expanded: `260px` ([tailwind.css:114, 180](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L114))
  - Collapsed Vertical: `70px` ([tailwind.css:188, 212](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L188))
  - Settings Customizer Drawer: `400px` ([Setting.tsx:29](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/Setting.tsx#L29))

### 3.6 Z-Index System
- `z-10`: Tabs sub-menus, form inline AI speech/completion buttons, sticky modal footer.
- `z-20`: Sticky header (`.navbar-sticky header`), sticky step progress bar (`top-14 z-20`).
- `z-50`: Off-canvas sidebar (`sidebar w-[260px] z-50`), mobile backdrop overlay (`bg-[black]/60 z-50`), scroll-to-top floating button (`z-50`), `Dropdown.tsx` popper (`z-50`), `UploadProgressToast` (`z-50`).
- `z-[51]`: Settings drawer panel and backdrop.
- `z-[60]`: Fullscreen application loader overlay (`screen_loader fixed inset-0 z-[60]`).

---

## 4. Components

### 4.1 Buttons
Sources: [Button.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/Button.tsx), [CreateAction.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/CreateAction.tsx), [TableActionsButtons.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/TableActionsButtons.tsx), [tailwind.css:260-328](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L260-L328)

- **Structure:** `<button className="btn gap-2 rounded-lg px-4 py-2 text-[13px] font-medium min-w-[80px] flex items-center shadow-none whitespace-nowrap ...">`
- **Variants:**
  - `solid`: Full background fill (`btn-{color}`). Includes `primary`, `secondary`, `danger`, `success`, `warning`, `info`, `dark`, `white`.
  - `outline`: Border-1 with matching text color; on hover fills background and switches text to white (`btn-outline-{color}`).
  - `text` / Ghost: Borderless transparent action link with color hover (e.g. `TableActionsButtons`, `SharedAppliedFilters` "Clear All").
  - `icon`: Dedicated icon trigger wrapped in Tippy tooltip without text label (e.g. `TableActionsButtons`, copy buttons).
- **Sizes:**
  - `sm`: `.btn-sm` -> `px-2.5 py-1.5 text-xs` (icon size: 16px)
  - `md`: Default -> `px-4 py-2 text-[13px]` (min-w: 80px, icon size: 18px)
  - `lg`: `.btn-lg` -> `px-7 py-2.5 text-base` (icon size: 20px)
- **States:**
  - *Default:* Defined by variant/color token.
  - *Hover:* Micro-interaction `-translate-y-[1px]`, outline variant fills background color.
  - *Focus:* `outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2`.
  - *Active:* `active:scale-[0.98]`.
  - *Disabled / Loading:* `opacity-50 cursor-not-allowed` ([Button.tsx:68](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/Button.tsx#L68)).
  - *Loading State:* `<span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />`.
- **Minimal Code Examples from Codebase:**

```tsx
// 1. Primary Solid Action Button with Icon
import Button from '@shared/components/Buttons/Button';
import { PlusCircle } from 'lucide-react';

<Button
    variant="solid"
    color="primary"
    size="md"
    icon={<PlusCircle size={18} />}
    onClick={() => handleCreate()}
>
    Create Record
</Button>

// 2. Danger Solid Button
<Button
    variant="solid"
    color="danger"
    size="md"
    onClick={() => handleDelete()}
>
    Delete Item
</Button>

// 3. Secondary Outline Button
<Button
    variant="outline"
    color="secondary"
    size="md"
    onClick={() => handleCancel()}
>
    Cancel
</Button>

// 4. Table Action Icon Buttons (TableActionsButtons.tsx)
import Tippy from '@tippyjs/react';
import { Edit2, Eye, Trash2 } from 'lucide-react';

<div className="flex gap-2 items-center">
    <Tippy content="Edit">
        <button onClick={onEdit} className="text-gray-400 hover:text-warning transition-colors duration-200">
            <Edit2 size={20} />
        </button>
    </Tippy>
    <Tippy content="Show">
        <button onClick={onShow} className="text-gray-400 hover:text-primary transition-colors duration-200">
            <Eye size={22} />
        </button>
    </Tippy>
    <Tippy content="Delete">
        <button onClick={onDelete} className="text-gray-400 hover:text-danger transition-colors duration-200">
            <Trash2 size={20} />
        </button>
    </Tippy>
</div>
```

---

### 4.2 Form Controls

#### Text Input & Password Input
Sources: [FormikField.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikField.tsx), [tailwind.css:356-360](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L356-L360)
- **Structure:** Label + Input Wrapper + Error Message + Helper Text.
- **Styling:** Height `40px`, border `border border-[#E2E8F0]`, radius `rounded-xl`, padding `px-4 py-3`, text `text-sm font-normal text-[#1E293B]`, placeholder `placeholder:text-[#B0BEC5]`.
- **States:**
  - *Default:* `bg-white border-[#E2E8F0]` (dark: `dark:bg-[#121e32] dark:border-[#17263c] dark:text-white-dark`).
  - *Focus:* `focus:border-[#E2E8F0] focus:ring-transparent` (dark: `dark:focus:border-primary`).
  - *Disabled:* `bg-[#F5F6FD] cursor-not-allowed`.
  - *Error:* `border border-red-500` with `<AlertCircle size={12} strokeWidth={2.5} />` in `text-xs text-red-500`.
- **Password Toggle:** Eye icon `<Eye size={18} />` / `<EyeOff size={18} />` at `absolute right-3 top-1/2 -translate-y-1/2` with `pr-10`.
- **Minimal Code Example:**
```tsx
<FormikField
    name="email"
    type="email"
    label="Email Address"
    placeholder="user@example.com"
    withAsterisk
    helperText="We will never share your email."
/>
```

#### Textarea & AI Augmented Field
Source: [FormikTextArea.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikTextArea.tsx)
- **Styling:** Class `.form-textarea`, radius `rounded-xl`, border `border-[#E2E8F0]`, text `text-[#1E293B] font-medium`, placeholder `placeholder:text-[#8A9AAF]`.
- **States:**
  - *Default:* `bg-white border-[#E2E8F0]`.
  - *Error:* `border-red-500`.
- **Tools:** Speech-to-text (`Mic` button `bg-rose-50 border-rose-300`) and AI completion (`GeminiIcon` button `bg-cyan-50 border-cyan-300`).
- **Minimal Code Example:**
```tsx
<FormikTextArea
    name="description"
    label="Incident Description"
    rows={4}
    placeholder="Describe the sequence of events..."
    withAiCompletion
    withSpeechToText
/>
```

#### Select & Multi-Select (Mantine Wrapped)
Source: [FormikField.tsx:64-175](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikField.tsx#L64-L175)
- **Styling:** Wrapped `@mantine/core` `<Select>` and `<MultiSelect>`, styled via:
  `classNames={{ input: 'form-input !font-normal !text-[#1E293B] !border-[#E2E8F0] !h-[40px] !rounded-xl' }}`.
- **States:** Clearable by default, error border `!border-red-500`, disabled `opacity-50`.
- **Minimal Code Example:**
```tsx
<FormikField
    name="severity"
    type="select"
    label="Severity Level"
    placeholder="Choose severity"
    listData={[
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ]}
/>
```

#### Checkbox
Sources: [FormikCheckBox.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikCheckBox.tsx), [tailwind.css:432-465](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L432-L465)
- **Card-Style Checkbox:** Full card box `px-4 py-3 rounded-xl border`.
  - *Checked:* `bg-[#F0F2FF] dark:bg-dark-light border-0`. Indicator: `w-5 h-5 rounded bg-primary text-white flex items-center justify-center` with `<Check size={16} />`.
  - *Unchecked:* `bg-white dark:bg-dark border-[#E2E8F0] dark:border-gray-700`. Indicator: `border border-[#8A9AAF]`.
- **Minimal Code Example:**
```tsx
<FormikCheckBox
    name="requires_medical_attention"
    label="Victim requires immediate hospitalization"
    setFieldValue={formik.setFieldValue}
/>
```

#### Radio Buttons
Sources: [FormikRadioInput.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikRadioInput.tsx), [tailwind.css:467-492](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L467-L492)
- **Grid Card Option:** Responsive column grid (`grid-cols-1` to `grid-cols-4`). Card box `px-3 py-2 border-2 rounded-xl`.
  - *Selected:* `bg-blue-50 dark:bg-dark-light border-[#60a5fa] border-solid text-[#60a5fa]` with `<CheckCircle size={18} />`.
  - *Unselected:* `bg-white dark:bg-dark border-gray-300 dark:border-gray-700 border-dashed` with `<Circle size={18} className="text-gray-400" />`.
- **Minimal Code Example:**
```tsx
<FormikRadioInput
    name="gender"
    label="Gender"
    columns={2}
    options={[
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' }
    ]}
/>
```

#### Toggle Switch
Source: [FormikSwitchInput.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikSwitchInput.tsx), [ActivationToggle.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/ActivationToggle.tsx)
- Mantine `<Switch size="md" color="teal" />` with track forced to `cursor-pointer`.
- **Minimal Code Example:**
```tsx
<FormikSwitchInput
    name="is_active"
    label="Active Account"
/>
```

#### Date & Time Picker
Source: [FormikDateTimePicker.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikDateTimePicker.tsx)
- Flatpickr wrapped input: `bg-white rounded-xl border border-[#E2E8F0] h-[40px] px-4 py-2 text-sm text-[#1E293B] focus:ring-1 focus:ring-blue-500`.
- Icon suffix/prefix: `<Calender className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />`.
- **Minimal Code Example:**
```tsx
<FormikDateTimePicker
    name="incident_date"
    label="Date of Incident"
    options={{ enableTime: false }}
    withAsterisk
/>
```

#### File Upload Dropzone
Source: [FormikFileUpload.tsx:182-260](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikFileUpload.tsx#L182-L260)
- **Dropzone:** `w-full p-8 border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer`.
- **Minimal Code Example:**
```tsx
<FormikFileUpload
    name="attachments"
    label="Supporting Documents"
    accept="image/*,application/pdf"
    multiple
/>
```

---

### 4.3 Tables / Data Grids
Sources: [CustomTable.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/CustomTable.tsx), [datatables.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/assets/css/datatables.css), [TableActionsButtons.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/TableActionsButtons.tsx)

- **Container:** `<div className="table-responsive" style={{ maxWidth: '100vw' }}>` (`overflow-auto`).
- **Table:** `<table className="table-hover w-full table-auto whitespace-nowrap !border-collapse">`.
- **Header:** `<thead className="bg-[#F8FAFC] rounded-xl">`. Cells: `p-4 text-center text-[14px] text-[#475569] dark:text-gray-400 font-bold uppercase tracking-wider`.
- **Sortable Header:** `cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-dark-light` with `<ArrowUp size={14} className="text-primary" />` or `<ArrowDown size={14} className="text-primary" />`.
- **Body Rows:** `border-b !border-white-light/40 dark:!border-[#191e3a]`.
- **Hover State:** `table.table-hover tbody tr:hover` -> `!bg-white-light/20 dark:!bg-[#1a2941]/40`.
- **Row Selection State:** Mantine checkbox selection inside table cells:
  `.mantine-Checkbox-inner > .mantine-Checkbox-input:checked` -> `!border-primary bg-primary`. Selected row background highlights with `bg-primary/5` or `!bg-white-light/30`.
- **Zebra Striping:** `table.table-striped tbody tr:nth-child(odd)` -> `!bg-white-light/20 dark:!bg-[#1a2941]/40`.
- **Empty State (`NoDataFoundRow`):** Spans all columns with `py-14`, `<Inbox size={24} />` icon inside rounded-2xl white badge with shadow-sm and slate-200 ring.
- **Pagination Component:** Mantine `<Pagination color="#212B59" radius="md" />` inside `flex justify-center !text-primary px-2 mt-4 rtl:flex-row-reverse`. Custom styling: circular 36x36px `rounded-full bg-white-light text-[#3b3f5c] hover:bg-primary hover:text-white`, active item `!bg-primary !text-white`.
- **Minimal Code Example:**
```tsx
import CustomTable, { renderItemRows } from '@shared/components/TableData/CustomTable';
import TableActionsButtons from '@shared/components/TableData/TableActionsButtons';

<CustomTable
    headers={['common.name', 'common.email', 'common.actions']}
    sortableColumnIndex={0}
    sortDir={sortDir}
    onSortToggle={handleSortToggle}
    renderRows={() =>
        renderItemRows(users, (user) => (
            <tr key={user.id}>
                <td className="p-4 text-center font-medium text-[#64748B]">{user.name}</td>
                <td className="p-4 text-center font-medium text-[#64748B]">{user.email}</td>
                <td className="p-4 text-center">
                    <TableActionsButtons
                        id={user.id}
                        onEdit={() => handleEdit(user.id)}
                        onDelete={() => handleDelete(user.id)}
                    />
                </td>
            </tr>
        ), 3)
    }
/>
```

---

### 4.4 Cards and Panels
Sources: [tailwind.css:64](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L64), [ContainerCard.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/ContainerCard.tsx), [KpiCard.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/dashboard/components/KpiCard.tsx), [PersonCard/index.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/PersonCard/index.tsx)

- **Base Panel (.panel):** `relative rounded-lg bg-white p-5 dark:bg-black`.
- **ContainerCard:** Standard page wrapper card: `bg-white rounded-xl px-3 py-4 w-full`. Title: `text-primary font-bold text-lg inline-block`, Subtitle: `text-xs text-[#A2ACB9] font-medium`.
- **KPI Card:** `panel relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 bg-white p-5 rounded-xl`. Icon box: 48x48px `w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm`. Value: `text-2xl lg:text-3xl font-black text-gray-900`.
- **Person Profile Card:** `bg-white p-3 rounded-xl flex flex-col border border-[#E7E9F5] w-full max-w-[320px] shadow-sm hover:border-primary/30 transition-all`. Avatar: 40x40px `rounded-lg border border-[#F1F3F5] bg-[#F8F9FA]`.
- **Minimal Code Example:**
```tsx
import ContainerCard from '@shared/components/ContainerCard';
import Button from '@shared/components/Buttons/Button';

<ContainerCard
    title="Incident Reports"
    subTitle="List of all reported incidents"
    btnCorner={<Button variant="solid" color="primary">Export CSV</Button>}
>
    <div>Table or Form Content Goes Here</div>
</ContainerCard>
```

---

### 4.5 Modals, Drawers, Popovers, Tooltips
Sources: [AttachmentsLinksModal.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/AttachmentsLinksModal/AttachmentsLinksModal.tsx), [Dropdown.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Dropdown.tsx), [Setting.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/Setting.tsx)

- **Mantine Modal Standard:** `<Modal opened={opened} onClose={close} size="lg" centered classNames={{ header: 'border-b border-gray-200 pb-3', body: 'p-0' }}>`.
  - Header Title: `<div className="flex items-center gap-2"><Icon size={20} className="text-primary" /><span className="font-semibold text-lg">{title}</span></div>`.
  - Modal Sticky Footer: `sticky bottom-0 flex justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-zinc-50 rounded-b-lg z-10`.
- **Off-Canvas Drawer (Setting.tsx):** Fixed right drawer `w-full max-w-[400px] top-0 bottom-0 bg-white dark:bg-black z-[51] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300` with backdrop `fixed inset-0 bg-[black]/60 z-[51]`.
- **Dropdown / Popover (Dropdown.tsx):** Powered by `react-popper` (`usePopper`). Menu list: `my-1 min-w-[120px] rounded bg-white p-0 py-2 shadow dark:bg-[#1b2e4b] text-black dark:text-white-dark`. Links: `px-4 py-2 hover:bg-primary/10 hover:text-primary`.
- **Tooltips:** `@tippyjs/react` with default theme and Mantine `<Tooltip withArrow />`.
- **Minimal Code Example:**
```tsx
import { Modal } from '@mantine/core';
import Button from '@shared/components/Buttons/Button';

<Modal opened={isOpened} onClose={onClose} size="lg" centered>
    <div className="p-5">
        <h3 className="text-lg font-bold text-primary mb-3">Modal Title</h3>
        <p className="text-sm text-gray-600">Modal body content...</p>
    </div>
    <div className="sticky bottom-0 flex justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-zinc-50 rounded-b-lg">
        <Button variant="outline" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="solid" color="primary" onClick={onConfirm}>Confirm</Button>
    </div>
</Modal>
```

---

### 4.6 Alerts, Toasts, Badges, Tags, Progress, Loaders/Skeletons
Sources: [useSwal.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/hooks/useSwal.tsx), [sweetalert.css](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/assets/css/sweetalert.css), [UploadProgressToast/index.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/UploadProgressToast/index.tsx), [TimelineSkeleton.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Loading/TimelineSkeleton.tsx)

- **Toast Notifications (SweetAlert2):** Glassmorphic pill popup: `!w-auto !min-w-[280px] !max-w-[420px] !rounded-xl !px-3 !py-2 !shadow-xl !bg-white/95 !backdrop-blur-sm`. Title: `!text-[13px] !leading-5 !font-medium !text-slate-700`. Progress bar: `!h-[3px] !bg-primary`. Auto-dismiss: 3000ms.
- **Delete Confirmation Modal:** Custom dialog with `#E11D48` warning icon, 500px width, padding `24px 24px 20px`, reason `<textarea>` with border `#E2E8F0` and background `#F8FAFC`, confirm button `#E73F46`, cancel button `#94A3B8`.
- **Floating Upload Progress Widget:** Fixed `bottom-10 left-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200`, minimized width `w-72` (288px), expanded width `w-85` (340px). Progress bar: Mantine `<Progress size="xs" color="blue" />`.
- **Skeletons:** Pulses with `animate-pulse`, placeholder boxes use `bg-slate-50` and `bg-slate-100` with varying border radiuses (`rounded-md`, `rounded-xl`, `rounded-[2rem]`).
- **Minimal Code Example:**
```tsx
// 1. Toast Notification Trigger
import useSwal from '@shared/hooks/useSwal';

const { showToast, showDeleteConfirmation } = useSwal();
showToast('success', 'Changes saved successfully');

// 2. Delete Confirmation Trigger
showDeleteConfirmation({
    title: 'Delete User Account',
    body: 'Are you sure you want to deactivate and remove this user?',
    placeholder: 'Reason for deletion (mandatory)...'
});

// 3. Status Badge Markup
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
    Approved
</span>
```

---

### 4.7 Tabs, Accordions, Breadcrumbs, Steppers
Sources: [Tabs/index.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Tabs/index.tsx), [RoleDetails.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/roles/components/RoleDetails.tsx#L176-L200), [Breadcrumbs.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Breadcrumbs/Breadcrumbs.tsx), [StepProgress/index.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/StepProgress/index.tsx)

- **Tabs (Custom Tabs Component):**
  - Base button: `px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200`.
  - `outline` variant: Active `bg-[#F5F6FD] text-primary border-b-2 border-primary`; Inactive `text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-500`.
  - `filled` variant: Active `bg-primary text-white rounded-lg`; Inactive `bg-[#F5F6FD] text-gray-500 rounded-lg`.
  - `underline` variant: Active `text-primary border-b-2 border-primary`; Inactive `text-gray-500 hover:border-b-2 hover:border-gray-500`.
- **Accordions (Mantine & Custom):**
  - Mantine Accordion in `RoleDetails.tsx`:
    `item`: `border: '1px solid #F1F5F9', borderRadius: '20px', marginBottom: '16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(148, 163, 184, 0.05)'`.
    `control`: `padding: '20px 24px', '&:hover': { backgroundColor: '#F8FAFC' }`.
    Active state: `boxShadow: '0 8px 16px rgba(148, 163, 184, 0.08)', borderColor: '#E2E8F0'`.
- **Breadcrumbs:** `<nav aria-label="breadcrumb" className="mb-6">`.
  - Separator: `<ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 dark:text-gray-600 transition-transform rtl:rotate-180" />`.
  - First item: `<Home className="h-4 w-4" />`.
  - Current item: `bg-primary/5 font-bold text-primary dark:bg-primary-dark-light dark:text-white-light rounded-lg px-2 py-1.5`.
  - Interactive links: `rounded-lg px-2 py-1.5 text-gray-500 hover:bg-primary/10 hover:text-primary dark:text-gray-400`.
- **Stepper / Multi-Step Progress:** Mantine `<Stepper active={currentStep} color="#64748B" size="xs">`.
  - Sticky container: `bg-white p-4 sm:p-6 overflow-auto border-t border-t-[#F1F5F9] sticky top-14 z-20`.
  - Separator line: `1px solid #8A9AAF` dashed.
  - Step Label: `font-semibold text-[10px] sm:text-[12px]`.
- **Minimal Code Examples from Codebase:**
```tsx
// 1. Custom Tabs Component
import Tabs from '@shared/components/Tabs';

<Tabs
    tabs={[
        { id: 'general', label: 'General Info' },
        { id: 'tasks', label: 'Assigned Tasks' }
    ]}
    activeTab={currentTab}
    onChange={setCurrentTab}
    variant="outline"
/>

// 2. Accordion Component (RoleDetails.tsx)
import { Accordion } from '@mantine/core';

<Accordion
    multiple
    styles={{
        item: {
            border: '1px solid #F1F5F9',
            borderRadius: '20px',
            marginBottom: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(148, 163, 184, 0.05)'
        },
        control: {
            padding: '20px 24px',
            '&:hover': { backgroundColor: '#F8FAFC' }
        },
        content: { padding: '0 24px 24px 24px' }
    }}
>
    <Accordion.Item value="permissions">
        <Accordion.Control>Module Permissions</Accordion.Control>
        <Accordion.Panel>Permission checkboxes...</Accordion.Panel>
    </Accordion.Item>
</Accordion>

// 3. Breadcrumbs Component
import Breadcrumbs from '@shared/components/Breadcrumbs';

<Breadcrumbs
    items={[
        { label: 'Home', path: '/' },
        { label: 'Incidents', path: '/incidents' },
        { label: 'Incident No. 1042' }
    ]}
/>
```

---

### 4.8 Custom Reusable Components
Sources: [SharedAppliedFilters.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/SharedAppliedFilters.tsx), [EmptyState.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/EmptyState.tsx), [ModuleGrid.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/ModuleGrid.tsx)

- **SharedAppliedFilters:** Filter chips bar with remove badges, count expander, and Clear All trigger:
  - Chip: `group flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-sm hover:shadow-md hover:border-primary/30`.
- **EmptyState:** Centralized placeholder:
  - Container: `py-8 flex flex-col items-center justify-center gap-2 opacity-40 grayscale`.
- **ModuleGrid:** Dashboard module selection card grid:
  - Grid: `grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
  - Tile: `panel cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group`.
  - Icon Box: 80x80px `w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`.
- **Minimal Code Example:**
```tsx
import SharedAppliedFilters from '@shared/components/TableData/SharedAppliedFilters';

<SharedAppliedFilters
    appliedFilters={[
        { key: 'status', label: 'Status', value: 'Open' },
        { key: 'severity', label: 'Severity', value: 'High' }
    ]}
    onRemoveFilter={(key) => handleRemove(key)}
    onClearAll={() => handleClearAll()}
    onViewAll={() => handleOpenFilterModal()}
/>
```

---

## 5. Layout and Navigation

### 5.1 App Shell
Sources: [DefaultLayout.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/DefaultLayout.tsx), [Header.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/Header.tsx), [Sidebar.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/Sidebar.tsx), [tailwind.css:68-258](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L68-L258)

- **Sidebar (Vertical Mode):**
  - Width: `260px` fixed (`top-0 bottom-0 min-h-screen z-50`).
  - Desktop margin offset: `lg:ltr:ml-[260px] lg:rtl:mr-[260px]`.
  - Mobile behavior (< 1024px): Pushed off-screen `ltr:-left-[260px] rtl:-right-[260px]`. Toggled via Redux `themeConfig.sidebar`, opening with backdrop `fixed inset-0 bg-[black]/60 z-50`.
  - Header logo box inside sidebar: Min-height `77px`, border bottom `border-b-2 border-b-[#F1F5F9]`.
  - Nav Item: `flex items-center rounded-md p-2.5 text-[#506690] hover:bg-[#F5F6FD] hover:text-black dark:hover:bg-[#181f32] dark:hover:text-white-dark`.
  - Active Nav Item: `bg-[#F5F6FD] text-black font-semibold dark:bg-[#181f32] dark:text-white-dark`. Icon switches to `text-primary`.
- **Top Bar (Header):**
  - Height: `70px` (or min-h: 60px).
  - Floating variant: `sticky top-0 z-20 bg-[#FFFFFF]/90 px-6 pt-4 dark:bg-[#060818]/90 backdrop-blur-md`.
  - Sticky variant: `sticky top-0 z-20 bg-white dark:bg-[#0e1726] shadow-sm`.
  - Contents: Collapse toggle (mobile), search bar (`bg-[#F7F8FC] border-0 rounded-xl`), theme mode switcher (Light/Dark/System), language switcher dropdown (with country flag SVG), notification bell with animated ping badge, user avatar dropdown.
- **Content Area:** `main-content flex flex-col flex-1` containing breadcrumbs, page cards, and router outlet wrapped in Redux `themeConfig.animation` (`animate__animated`).
- **Footer:** Padding `pt-6 p-6`, text `text-center ltr:sm:text-left rtl:sm:text-right text-xs text-gray-500 dark:text-white-dark`.

### 5.2 Page Templates

#### List Page Template
Source: [Users.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/users/pages/Users.tsx)
```
┌─────────────────────────────────────────────────────────────────┐
│ Container                                                       │
│ ├─ Breadcrumbs (Home > Users Management > Users)                │
│ └─ ContainerCard (title="Users List", btnCorner=[Export, Import, Create])│
│    ├─ Filter Accordion / Modal Trigger                          │
│    ├─ SharedAppliedFilters (Filter chips + Clear All button)    │
│    ├─ LoadingPage (wraps CustomTable with isFetching & error)   │
│    │  └─ CustomTable (Headers, Sortable Columns, Row Actions)   │
│    └─ Pagination (Mantine usePaginator, centered, RTL reverse)  │
└─────────────────────────────────────────────────────────────────┘
```

#### Detail Page Template
Sources: [ShowUser.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/users/pages/ShowUser.tsx), [RoleDetails.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/roles/components/RoleDetails.tsx)
```
┌─────────────────────────────────────────────────────────────────┐
│ Container                                                       │
│ ├─ Breadcrumbs (Home > Section > Entity Details)                │
│ ├─ Hero Card / Profile Layout (Avatar, Name, Badges, Quick Info)│
│ ├─ Tab Bar (Tabs Component: Information, Tasks, History, Audit) │
│ └─ Details Grid (grid-cols-1 md:grid-cols-2 gap-4)              │
│    ├─ Info Card 1 (Icon, Bold Label, Value)                     │
│    └─ Info Card 2 (Icon, Bold Label, Value)                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Create / Edit Form Page Template
Source: [UserForm.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/modules/users-management/users/components/UserForm.tsx)
```
┌─────────────────────────────────────────────────────────────────┐
│ Form (Formik + Yup)                                             │
│ ├─ Section Title ("Personal Information" border-b pb-2 mb-4)     │
│ ├─ Grid Container (grid grid-cols-1 md:grid-cols-2 gap-4)       │
│ │  ├─ FormikField (Name with asterisk)                          │
│ │  ├─ FormikField (Select type)                                 │
│ │  ├─ FormikDateTimePicker (Date only mode)                     │
│ │  └─ FormikFileUpload (Full width md:col-span-2)               │
│ ├─ Section Title ("Employment Information" border-b pb-2 mb-4)   │
│ └─ Actions Bar: CreateActions (Back button outline, Save button solid) │
└─────────────────────────────────────────────────────────────────┘
```

#### Executive Dashboard Template
Source: [GeneralDashboard.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/dashboard/components/GeneralDashboard.tsx)
```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard Container (p-4 md:p-8 space-y-6)                      │
│ ├─ Header Bar (Title, Year Selector Chevron, Refresh Button)    │
│ ├─ KPI Row (grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4)    │
│ │  ├─ Workforce Card (Blue variant)                             │
│ │  ├─ Incidents KPI (Amber variant with % trend pill)           │
│ │  ├─ Days Safe KPI (Emerald variant)                           │
│ │  └─ Worked Hours (Purple variant)                             │
│ ├─ Middle Grid (grid-cols-1 lg:grid-cols-12 gap-6)              │
│ │  ├─ Safety Calendar (lg:col-span-7, 12-month matrix)          │
│ │  └─ Monthly Activity Chart (lg:col-span-5, ApexCharts)        │
│ ├─ Secondary Grid (grid-cols-1 lg:grid-cols-2 gap-6)            │
│ │  ├─ Incidents by Classification (Horizontal Bar)              │
│ │  └─ Incidents by Site (Ranked widget)                         │
│ └─ Operations Row (grid-cols-1 md:grid-cols-2 xl:grid-cols-3)  │
│    ├─ CAPA Widget ├─ Clinic Widget └─ Pharmacy Widget           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. RTL / Arabic Support

### 6.1 Switching Mechanism & Storage
- Direction is driven by `themeConfig.rtlClass` (`ltr` | `rtl`) stored in `localStorage.getItem('rtlClass')` and synced with `localStorage.getItem('i18nextLng')` ([App.tsx:28-32](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/App.tsx#L28-L32)).
- Selecting Arabic (`ar`) dispatches `toggleRTL('rtl')`, executing:
  ```ts
  document.querySelector('html')?.setAttribute('dir', 'rtl');
  ```
- The body font and layout dynamically adapt via `[dir='rtl']` selector and Tailwind `rtl:` modifier prefixes.

### 6.2 Element Mirroring Rules
- **Mirrored UI Elements:**
  - Sidebar position: `ltr:left-0 rtl:right-0` (collapsible margins: `lg:ltr:ml-[260px] lg:rtl:mr-[260px]`).
  - Breadcrumb chevrons: `<ChevronRight className="rtl:rotate-180" />`.
  - Navigation back arrows: `<ArrowLeft className="scale-x-[-1]" />` ([CreateAction.tsx:79](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/CreateAction.tsx#L79)).
  - Calendar/Year pagination chevrons: `<ChevronRight className="rtl:rotate-180" />`.
  - Sidebar collapse icon: `collapse-icon rtl:rotate-180` ([Sidebar.tsx:85](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/core/layouts/Sidebar.tsx#L85)).
  - Dropdown Popper Placements: `placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}`.
  - Pagination Button Order: `rtl:flex-row-reverse`.
  - Chart Y-Axis: `yaxis: { opposite: isRtl }` (ApexCharts moves axis from left to right).
  - SweetAlert Buttons: `reverseButtons: document.documentElement.dir === 'rtl'` ([useSwal.tsx:94](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/hooks/useSwal.tsx#L94)).
  - Table Text Alignment: `ltr:text-left rtl:text-right`.
- **Intentionally Unmirrored (Preserved LTR):**
  - Phone Numbers: Wrapped in `<span dir="ltr">` in [PersonCard/index.tsx:160](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/PersonCard/index.tsx#L160).
  - Preformatted Code Blocks: `pre { direction: ltr; }` in [tailwind.css:553](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L553).
  - Identification Numbers: `ID:${badgeId}` badges maintain English prefix.

### 6.3 Known RTL Inconsistencies & Hardcoded Physical Properties
1. **Password Eye Toggle Overlap:** [FormikField.tsx:213](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikField.tsx#L213) uses `absolute right-3` and input has `pr-10`. In Arabic RTL, the toggle icon remains on the right, directly overlapping the first characters of Arabic text. It must be refactored to `ltr:right-3 rtl:left-3` and `ltr:pr-10 rtl:pl-10`.
2. **Textarea AI Tools Overlap:** [FormikTextArea.tsx:121](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikTextArea.tsx#L121) uses `absolute right-2 top-2` and `pr-24` / `pr-14`. In RTL, the inline AI buttons remain on the top right, colliding with Arabic typing flow.
3. **Checkbox Margin Inversion:** [FormikCheckBox.tsx:42](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikCheckBox.tsx#L42) uses hardcoded `ml-2` for label text. In RTL, this indents the label away from the right margin instead of spacing it from the checkbox indicator box. It should use `ltr:ml-2 rtl:mr-2` or `ms-2`.
4. **Switch Error Margin:** [FormikSwitchInput.tsx:32](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Inputs/FormikSwitchInput.tsx#L32) uses hardcoded `ml-3` for error text.
5. **Floating Toast Pinned Left:** [UploadProgressToast/index.tsx:74](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/UploadProgressToast/index.tsx#L74) is fixed with `bottom-10 left-1`, keeping it anchored to the bottom left regardless of RTL mode.

---

## 7. Dark Mode

### 7.1 Architecture & Persistence
- **Storage:** Stored in `localStorage.getItem('theme')` with values `'light'` | `'dark'` | `'system'`.
- **Toggle Action:** Dispatched through `toggleTheme` in [themeConfigSlice.tsx:47-71](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/store/themeConfigSlice.tsx#L47-L71).
- **Execution:**
  - If `dark` or system dark matches: `document.querySelector('body')?.classList.add('dark')`.
  - If `light`: `document.querySelector('body')?.classList.remove('dark')`.
- **Tailwind Strategy:** `darkMode: 'class'` ([tailwind.config.cjs:4](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/tailwind.config.cjs#L4)).

### 7.2 Dark Theme Token Equivalencies
- Body Canvas: Light `#F5F6FD` -> Dark `#060818`
- Surface Panels: Light `#FFFFFF` -> Dark `#0e1726` (`dark:bg-black`)
- Input Surfaces: Light `#FFFFFF` -> Dark `#121e32`
- Input Borders: Light `#E2E8F0` -> Dark `#17263c`
- Sub-menus: Light `#FFFFFF` -> Dark `#1b2e4b`
- Table Dividers: Light `white-light/40` (`rgba(224, 230, 237, 0.4)`) -> Dark `#191e3a`
- Scrollbar Thumb: Light `#DDDDDD` -> Dark `#2d334c`

### 7.3 Components Lacking Proper Dark Mode Support (Dark Mode Leaks)
1. **ContainerCard Component:** [ContainerCard.tsx:28](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/ContainerCard.tsx#L28) has `className="bg-white rounded-xl px-3 py-4 w-full"`. It completely omits `dark:bg-black` or `dark:bg-[#0e1726]`. All page containers wrapped by `ContainerCard` render as jarring white boxes in dark mode.
2. **Tabs Component:** [Tabs/index.tsx:30-42](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Tabs/index.tsx#L30-L42) active and inactive variants hardcode `bg-[#F5F6FD] text-gray-500` with zero `dark:` styling.
3. **CustomTable Thead:** [CustomTable.tsx:62](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/TableData/CustomTable.tsx#L62) has `<thead className="bg-[#F8FAFC] rounded-xl">`. In dark mode, this table header remains off-white instead of switching to `#1a2941`.
4. **StepProgress Component:** [StepProgress/index.tsx:37](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/StepProgress/index.tsx#L37) hardcodes `bg-white border-t-[#F1F5F9]`, rendering a light background bar in dark mode.
5. **PersonCard:** [PersonCard/index.tsx:79](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/PersonCard/index.tsx#L79) uses `bg-white border-[#E7E9F5]`, remaining white in dark theme.
6. **Dashboard KPI & Header Panels:** [GeneralDashboard.tsx:60, 246](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/plugins/dashboard/components/GeneralDashboard.tsx#L60) have `bg-white border-gray-100` without dark surface classes.

---

## 8. Interaction and UX Patterns

### 8.1 Transitions and Micro-Animations
- **Page Transitions:** CSS animations via Animate.css loaded into the main content wrapper:
  `<div className={`flex-1 ${themeConfig.animation} animate__animated`}>` (defaults to `animate__fadeIn`).
- **Button Hover/Active Physics:**
  `transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98] outline-none shadow-sm hover:shadow-md` ([CreateAction.tsx:58](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/CreateAction.tsx#L58)).
- **Icon Micro-Rotations:**
  - Edit Button Hover: `group-hover:rotate-12` ([CreateAction.tsx:125](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/CreateAction.tsx#L125)).
  - Save Button Hover: `group-hover:scale-110` ([CreateAction.tsx:177](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/Buttons/CreateAction.tsx#L177)).
  - Spinners: `animate-spin` on Lucide `Loader` and `RefreshCw`.
  - Notification Ping: `animate-ping rounded-full bg-success opacity-75`.
- **Custom Keyframe Animations ([tailwind.css:686-715](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/tailwind.css#L686-L715)):**
  - `.modal-fade-enter-active`: `transition duration-300 ease-out transform scale-95 opacity-0 -> scale-100 opacity-100`.
  - `.slide-down-enter-active`: `transition duration-100 ease-out`.

### 8.2 Form Validation Behavior
- **Trigger:** Formik schema validation runs on blur and on form submission.
- **Auto-Scroll to Error:** [formErrorScroll.ts](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/utils/formErrorScroll.ts) inspects form errors upon submission failure and smoothly scrolls the viewport to the first erroneous element.
- **Error Visuals:** Input field border changes to `border-red-500` or `!border-red-500 focus:!border-red-500`. An error message renders beneath the control with `<AlertCircle size={12} strokeWidth={2.5} />` in `text-xs text-red-500`.

### 8.3 Error Pages & Permission Denied
Source: [ErrorDisplay.tsx](file:///d:/Sana%20Soft2/PRoject%20Code/HSE/hse-frontend/src/shared/components/ErrorDisplay/ErrorDisplay.tsx)
- **Supported Errors:** `404` (Not Found), `403` (Forbidden), `500` (Server Error), `503` (Service Unavailable), `unlicensed` / `MODULE_NOT_LICENSED` (Subscription Expired).
- **Fullscreen Layout:**
  - Canvas: `bg-[#f8fafc] dark:bg-[#060818]` with base64 embedded SVG dot-grid background and large radial blur gradient.
  - Huge Numeric Status: `text-[8rem] sm:text-[12rem] lg:text-[18rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-300/90 to-gray-100/10`.
  - Floating Badge: `animate-[bounce_5s_infinite] -rotate-12 p-4 sm:p-6 rounded-[2rem] text-white`.
  - Action Card: Glassmorphic `bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-10`. Primary CTA: `bg-gradient-to-r from-primary to-primary text-white rounded-2xl py-4 px-6 shadow-lg hover:scale-[1.03] active:scale-95`. Secondary CTA: `bg-white/60 dark:bg-gray-700/50 border border-gray-200 text-gray-700 dark:text-gray-200 rounded-2xl py-4 px-6`.

---

## 9. Inconsistencies and Recommendations

### 9.1 Conflict & Duplication Audit

| Conflict Category | Observed Inconsistencies in Codebase | Files & Lines Impacted | Recommendation to Standardize |
| :--- | :--- | :--- | :--- |
| **Primary Brand Token Duality** | Primary is set to `#212B59` (Navy), but legacy Vristo `#4361ee` (Royal Blue) lingers in multiple components and svgs. | `tailwind.config.cjs:14` (`rgba(67,97,238,.15)`), `tailwind.css:440` (svg check fill `#4361ee`), `form-elements.css:35, 63` (`#4361ee`) | Replace all lingering `#4361ee` instances with `#212B59` and update `dark-light` to `rgba(33,43,89, 0.15)`. |
| **Danger / Red Color Fragmentation** | Five conflicting red values: `#e7515a` (`danger.DEFAULT`), `#E73F46` (Swal confirm), `#E11D48` (Swal icon), `#fa5252` (asterisk), and `#ef4444` (`text-red-500`). | `tailwind.config.cjs:27`, `useSwal.tsx:129, 144`, `FormikField.tsx:57, 101` | Consolidate onto `#e7515a` (`danger.DEFAULT`) for branding, or standardize on Tailwind `red-500` (`#ef4444`) globally. |
| **Border Neutral Dispersion** | Six competing border grays: `#E2E8F0` (inputs), `#e0e6ed` (`white.light`), `#E7E9F5` (`.card`), `#F1F5F9` (`StepProgress`), `#f6f7fa` (table-bordered), `#dee2e6` (range slider). | `tailwind.css:359`, `tailwind.config.cjs:53`, `CustomTable.tsx:62`, `StepProgress:37`, `datatables.css:29` | Standardize on `#E2E8F0` (light border) and `#1E293B` / `#191e3a` (dark border). |
| **Dark Mode Surface Variants** | Seven separate dark background hexes: `#060818` (canvas), `#0e1726` (`black`), `#121e32` (inputs), `#181f32` (sidebar active), `#1a2941` (table headers), `#1b2e4b` (menus), `#253b5c` (radios). | `tailwind.css:60, 65, 86, 153, 359, 520, 532` | Standardize on 3 levels: `#060818` (Background), `#0e1726` (Surface / Panels), `#181f32` (Elevated Popovers & Headers). |
| **Button Style Collision** | `.btn` class in `tailwind.css:261` specifies `rounded-md`, `px-5 py-2`, `text-sm`, `font-semibold` with heavy drop shadows. `Button.tsx:73` overrides this with `rounded-lg`, `px-4 py-2`, `text-[13px]`, `font-medium`, and `shadow-none`. | `tailwind.css:261` vs `Button.tsx:73` | Deprecate the legacy `.btn` styles in `tailwind.css` in favor of `Button.tsx`'s cleaner parameters. |
| **Tailwind Syntax Typo** | CSS class written as `text-slate-[#212B59]`. Arbitrary value syntax cannot be chained with color names; this class fails to compile and outputs no CSS. | `Sidebar.tsx:170, 178` | Fix syntax to `text-[#212B59]` or `text-primary`. |
| **Font Weights Missing from CDN** | Google Fonts link only imports weights `300;400;700;800`. Code relies heavily on `font-medium` (500) and `font-semibold` (600). | `index.html:39`, `Button.tsx:73`, `CustomTable.tsx:5` | Update font URL to: `family=Almarai:wght@300;400;500;600;700;800&display=swap`. |

### 9.2 Recommended Cleaned Token Set (Single Source of Truth)

```js
// Cleaned, Deduplicated Token Architecture
const tokens = {
  colors: {
    brand: {
      primary: '#212B59',
      'primary-light': '#eaf1ff',
      'primary-muted': 'rgba(33, 43, 89, 0.15)',
      secondary: '#805dca',
      'secondary-light': '#ebe4f7',
    },
    semantic: {
      success: '#00ab55',
      'success-light': '#ddf5f0',
      danger: '#e7515a',
      'danger-light': '#fff5f5',
      warning: '#e2a03f',
      'warning-light': '#fff9ed',
      info: '#2196f3',
      'info-light': '#e7f7ff',
    },
    neutral: {
      canvas: '#F5F6FD',
      surface: '#ffffff',
      border: '#E2E8F0',
      'text-primary': '#1E293B',
      'text-secondary': '#64748B',
      'text-placeholder': '#8A9AAF',
    },
    dark: {
      canvas: '#060818',
      surface: '#0e1726',
      elevated: '#181f32',
      border: '#191e3a',
      'text-primary': '#FFFFFF',
      'text-secondary': '#888ea8',
    }
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',   // Standard card & control radius
    xl: '16px',
    full: '9999px',
  }
};
```

---

## 10. Reuse Guide for Other Projects

### 10.1 Ready-to-Paste CSS Variables Block
Paste this into your main CSS stylesheet (`globals.css` or `index.css`):

```css
:root {
  /* Brand */
  --color-primary: #212B59;
  --color-primary-light: #eaf1ff;
  --color-primary-dark-light: rgba(33, 43, 89, 0.15);
  --color-secondary: #805dca;
  --color-secondary-light: #ebe4f7;

  /* Semantics */
  --color-success: #00ab55;
  --color-success-light: #ddf5f0;
  --color-danger: #e7515a;
  --color-danger-light: #fff5f5;
  --color-warning: #e2a03f;
  --color-warning-light: #fff9ed;
  --color-info: #2196f3;
  --color-info-light: #e7f7ff;

  /* Neutrals & Surfaces */
  --bg-canvas: #F5F6FD;
  --bg-surface: #FFFFFF;
  --border-neutral: #E2E8F0;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-placeholder: #8A9AAF;

  /* Typography */
  --font-family-base: 'Almarai', sans-serif;
  --radius-base: 12px;
  --radius-sm: 8px;
  --radius-xs: 4px;
}

html.dark, body.dark {
  /* Dark Mode Neutrals & Surfaces */
  --bg-canvas: #060818;
  --bg-surface: #0e1726;
  --bg-elevated: #181f32;
  --border-neutral: #191e3a;
  --text-primary: #FFFFFF;
  --text-secondary: #888ea8;
  --text-placeholder: #506690;
}
```

### 10.2 Ready-to-Paste Tailwind Configuration
Paste this into `tailwind.config.js` or `tailwind.config.cjs`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#212B59',
          light: '#eaf1ff',
          'dark-light': 'rgba(33,43,89,0.15)',
        },
        secondary: {
          DEFAULT: '#805dca',
          light: '#ebe4f7',
          'dark-light': 'rgb(128 93 202 / 15%)',
        },
        success: {
          DEFAULT: '#00ab55',
          light: '#ddf5f0',
          'dark-light': 'rgba(0,171,85,0.15)',
        },
        danger: {
          DEFAULT: '#e7515a',
          light: '#fff5f5',
          'dark-light': 'rgba(231,81,90,0.15)',
        },
        warning: {
          DEFAULT: '#e2a03f',
          light: '#fff9ed',
          'dark-light': 'rgba(226,160,63,0.15)',
        },
        info: {
          DEFAULT: '#2196f3',
          light: '#e7f7ff',
          'dark-light': 'rgba(33,150,243,0.15)',
        },
        dark: {
          DEFAULT: '#3b3f5c',
          light: '#eaeaec',
          'dark-light': 'rgba(59,63,92,0.15)',
        },
        black: {
          DEFAULT: '#0e1726',
          light: '#e3e4eb',
          'dark-light': 'rgba(14,23,38,0.15)',
        },
        white: {
          DEFAULT: '#ffffff',
          light: '#e0e6ed',
          dark: '#888ea8',
        },
      },
      fontFamily: {
        Almarai: ['Almarai', 'sans-serif'],
      },
      spacing: {
        4.5: '18px',
      },
      borderRadius: {
        xl: '12px',
      },
      boxShadow: {
        '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
    require('@tailwindcss/typography'),
  ],
};
```

### 10.3 AI Instruction Block (Paste into Prompt)
```markdown
Follow the HSE Enterprise Design System:
- Typography: Use Almarai ('Almarai', sans-serif) for all English and Arabic text. Load weights 300, 400, 500, 600, 700, 800.
- Primary Brand: Navy #212B59 for buttons, primary headings, and active state indicators; light tint is #eaf1ff.
- Semantic Palette: Success #00ab55, Danger #e7515a, Warning #e2a03f, Info #2196f3.
- Neutrals: Body canvas #F5F6FD (dark: #060818), Card surface #ffffff (dark: #0e1726), Hairline borders #E2E8F0 (dark: #191e3a). Text primary #1E293B (dark: #FFFFFF), Text secondary #64748B (dark: #888ea8).
- Geometry: Use rounded-xl (12px) for cards, panels, inputs, and tables. Use rounded-lg (8px) for buttons, and rounded-full for badges.
- Form Inputs: Height 40px, rounded-xl, border-[#E2E8F0], px-4 py-3, text-sm text-[#1E293B]. Focus: border-[#E2E8F0] ring-transparent. Error: border-red-500 with AlertCircle icon in text-xs text-red-500.
- Tables: Header bg-[#F8FAFC] text-[14px] font-bold text-[#475569]. Row hover bg-white-light/20. Border border-white-light/40.
- Bidi/RTL: Use Tailwind directional prefixes (ltr: / rtl:). Mirror chevrons with rtl:rotate-180 and back arrows with scale-x-[-1]. Keep telephone numbers and code blocks strictly LTR via dir="ltr".
```

---

## Step 3: Undetermined Aspects Checklist

- [ ] **Latin-Specific Fallback Stack:** The project does not define a separate Latin/English font stack in `tailwind.config.cjs` (e.g. Inter, Roboto). Almarai handles all Latin typography.
- [ ] **Mantine Provider Theme Object:** In `hse-frontend/src/main.tsx`, `MantineProvider` is instantiated with an empty theme object (`theme={{}}`), deferring component tokens directly to Tailwind utility overrides or Mantine default cyan/teal colors.
- [ ] **CSS Module Usage:** The project contains no `.module.css` or `.module.scss` files; all styles are governed by Tailwind utilities, `@layer components`, and imported vendor CSS files.
- [ ] **Print Stylesheet:** No `@media print` rules or print-specific color scales are defined in the stylesheet.
- [ ] **Mobile Breakpoints below 640px:** No custom screens smaller than `640px` are defined; small smartphone screens rely on Tailwind's un-prefixed default utilities.
