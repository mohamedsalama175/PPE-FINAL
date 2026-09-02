# HSE Front-End Design System Specification Report

**Document ID:** SPEC-HSE-DS-001  
**Author:** Spec Miner (spec_miner_design_system)  
**Date:** 2026-11-09T16:15:00Z  
**Source Specifications:**  
- `d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md` (Authoritative Specification)
- `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md` (Project Directives & Acceptance Criteria)
- `d:\Sana Soft2\PRoject Code\PPE-FINAL\package.json`, `index.html`, `src/index.css` (Target Workspace Baseline)

---

## 1. Observation

Direct observations extracted verbatim from authoritative project files:

1. **Visual Identity & Styling Core (`DESIGN_SYSTEM.md:1-29`):**
   - The design system is anchored by deep navy corporate primary `#212B59`, canvas background `#F5F6FD` (dark `#060818`), soft rounded-xl surfaces (`12px` radius), hairline slate borders `#E2E8F0`, and status badges.
   - Core framework is Tailwind CSS with `@tailwindcss/forms` (`strategy: 'class'`) and `@tailwindcss/typography`.
   - Typography is powered by Google's **Almarai** font family (`'Almarai', sans-serif`) across both Arabic (RTL) and English (LTR).

2. **Required Dependencies & Third-Party UI Libraries (`DESIGN_SYSTEM.md:30-45`, `ORIGINAL_REQUEST.md:13`):**
   - `@mantine/core` (`^8.2.4`) & `@mantine/dates` (`^8.2.4`): Advanced form controls (`Select`, `MultiSelect`, `Switch`, `Stepper`, `Modal`, `Accordion`, `Pagination`, `Tooltip`).
   - `sweetalert2` (`^11.6.8`): Confirmation dialogs, mandatory deletion reason modals, and glassmorphic toast notifications.
   - `react-flatpickr` (`^3.10.13`): Date and time picker integration with Lucide Calendar adornments.
   - `@tippyjs/react` (`^4.2.6`): Action buttons floating tooltips.
   - `react-popper` (`^2.3.0`): Dynamic dropdown popup positioning.
   - `lucide-react`: Primary iconography system.
   - `apexcharts` (`^3.54.1` / `^7.1.0`) & `react-apexcharts`: Business intelligence charts and dashboards.
   - `react-perfect-scrollbar` (`^1.5.8`): Sidebar and container custom scrolling.

3. **Current State in Target Workspace (`package.json`, `index.html`, `src/index.css`):**
   - `package.json` currently lacks `@mantine/core`, `@mantine/dates`, `@tippyjs/react`, `sweetalert2`, and `react-flatpickr`.
   - `index.html` does not load the Google Fonts link for Almarai (`family=Almarai:wght@300;400;500;600;700;800`).
   - `src/index.css` is currently on Tailwind v4 tokens (`--color-ink: #16181D`, `--color-accent: #D97F1E`, `--font-sans: "Inter"`), which diverges completely from the HSE `#212B59` / `#F5F6FD` / Almarai design system.

---

## 2. Logic Chain

1. **Premise 1 (Authoritative Scope):** `ORIGINAL_REQUEST.md` mandates applying the HSE front-end design system from `DESIGN_SYSTEM.md` across `PPE-FINAL`, including styling tokens, Almarai typography, UI dependencies, shared components, layout shell, RTL support, and dark mode mappings.
2. **Premise 2 (Tokens & Foundation):** The token system specifies exact hex values, radii, elevation shadows, and font scales that must be mapped to Tailwind configuration and CSS theme layers.
3. **Premise 3 (Component Matrix):** Shared components (`Button`, `FormikField`, `CustomTable`, `ContainerCard`, `Modal`, `Toast`) have exact visual styling, state variants (default, hover, focus, active, disabled, loading), and micro-interactions that must be rigorously documented so engineers can implement them without ambiguity.
4. **Premise 4 (Bilingual & RTL Requirements):** The application must seamlessly toggle between English (`ltr`) and Arabic (`rtl`), mirroring directional elements (chevrons, pagination order, back buttons, sidebars) while protecting LTR-only data (phone numbers, IDs, code blocks). Known RTL flaws in the source code (e.g. password eye overlap, textarea tool overlap) must be identified for remediation.
5. **Premise 5 (Dark Theme Alignment):** Light tokens have 1-to-1 mappings to dark surfaces. Existing design system leaks (such as white `ContainerCard` backgrounds in dark mode) must be systematically documented.

---

## 3. Comprehensive Specifications & Catalog

### 3.1 Design Tokens Catalog

#### 3.1.1 Color Palettes
Sources: `DESIGN_SYSTEM.md:62-192`, `tailwind.config.cjs:10-56`

| Token Name | Light Hex / Value | Dark Hex / Value | Role & Usage | WCAG Text Contrast (Light) |
| :--- | :--- | :--- | :--- | :--- |
| `primary.DEFAULT` | `#212B59` | `#212B59` / `#eaf1ff` | Primary brand, main buttons, headers, active tabs | 13.51:1 (White text) — AAA |
| `primary.light` | `#eaf1ff` | `rgba(33,43,89,0.3)` | Primary highlight tint, badge background | Background tint |
| `primary.dark-light`| `rgba(33,43,89,0.15)` | `rgba(234,241,255,0.15)` | Primary translucent chip background | Background tint |
| `secondary.DEFAULT`| `#805dca` | `#805dca` | Secondary actions, purple accents | 4.84:1 (White text) — AA |
| `secondary.light` | `#ebe4f7` | `rgba(128,93,202,0.2)` | Secondary highlight tint | Background tint |
| `secondary.dark-light`| `rgb(128 93 202 / 15%)`| `rgba(128,93,202,0.25)` | Secondary translucent badge | Background tint |
| `success.DEFAULT` | `#00ab55` | `#00ab55` | Success alerts, completed badges, active toggles | 3.02:1 (White text) — Large/Graphics |
| `success.light` | `#ddf5f0` | `rgba(0,171,85,0.2)` | Success banner background | Background tint |
| `success.dark-light`| `rgba(0,171,85,.15)` | `rgba(0,171,85,0.25)` | Success translucent chip | Background tint |
| `danger.DEFAULT` | `#e7515a` | `#e7515a` | Danger actions, delete buttons, error borders | 3.67:1 (White text) — Large/Graphics |
| `danger.light` | `#fff5f5` | `rgba(231,81,90,0.2)` | Error banner background | Background tint |
| `danger.dark-light` | `rgba(231,81,90,.15)` | `rgba(231,81,90,0.25)` | Danger translucent chip | Background tint |
| `warning.DEFAULT` | `#e2a03f` | `#e2a03f` | Warning alerts, pending badges, edit actions | 2.25:1 (White text) — Large/Graphics |
| `warning.light` | `#fff9ed` | `rgba(226,160,63,0.2)` | Warning banner background | Background tint |
| `warning.dark-light`| `rgba(226,160,63,.15)`| `rgba(226,160,63,0.25)`| Warning translucent chip | Background tint |
| `info.DEFAULT` | `#2196f3` | `#2196f3` | Informational notices, filter buttons | 3.12:1 (White text) — Large/Graphics |
| `info.light` | `#e7f7ff` | `rgba(33,150,243,0.2)` | Info banner background | Background tint |
| `info.dark-light` | `rgba(33,150,243,.15)`| `rgba(33,150,243,0.25)`| Info translucent chip | Background tint |
| `dark.DEFAULT` | `#3b3f5c` | `#eaeaec` | Neutral dark, cancel buttons, headings | 10.24:1 (White text) — AAA |
| `dark.light` | `#eaeaec` | `#1b2e4b` | Neutral light chip background | Background tint |
| `dark.dark-light` | `rgba(59,63,92,.15)` | `rgba(234,234,236,0.15)`| Translucent dark badge | Background tint |
| `black.DEFAULT` | `#0e1726` | `#0e1726` | Dark theme surface (`dark:bg-black`) | Base dark surface |
| `black.light` | `#e3e4eb` | `#17263c` | Dark theme secondary border | Border token |
| `white.DEFAULT` | `#ffffff` | `#ffffff` | Light card surfaces, white button text | Base light surface |
| `white.light` | `#e0e6ed` | `#191e3a` | Default borders, dividers | Border token |
| `white.dark` | `#888ea8` | `#888ea8` | Muted dark-mode text, secondary descriptions | 6.14:1 (vs Dark #060818) — AA |

#### 3.1.2 Neutral & Surface Hierarchy
| Token Role | Light Value | Dark Value | Affected Selectors / Components |
| :--- | :--- | :--- | :--- |
| **Page Canvas** | `#F5F6FD` | `#060818` | `body`, `screen_loader` |
| **Card & Panel Surface** | `#FFFFFF` | `#0e1726` | `.panel`, `ContainerCard`, cards |
| **Elevated Surface** | `#FFFFFF` | `#181f32` | Popovers, active sidebar items, header |
| **Submenu / Dropdown** | `#FFFFFF` | `#1b2e4b` | Dropdown menus, floating selects |
| **Input Surface** | `#FFFFFF` | `#121e32` | `.form-input`, `.form-textarea`, Select |
| **Default Input Border** | `#E2E8F0` | `#17263c` | Form controls, modals |
| **Table Row Divider** | `white-light/40` (`#e0e6ed66`) | `#191e3a` | Table rows, panel dividers |
| **Table Header Surface** | `#F8FAFC` / `white-light/30` | `#1a2941` | `thead`, table header cells |
| **Primary Text** | `#1E293B` (Slate 800) | `#FFFFFF` | Body text, input text, titles |
| **Secondary Text** | `#64748B` (Slate 500) | `#888ea8` | Subtitles, table body cells |
| **Header / Muted Text**| `#475569` (Slate 600) | `#94a3b8` | Table headers, modal descriptions |
| **Placeholder / Helper**| `#8A9AAF` / `#B0BEC5` | `#506690` | Helper text, input placeholders |
| **Scrollbar Thumb** | `#DDDDDD` | `#2d334c` | Scrollable areas, perfect-scrollbar |

#### 3.1.3 Status & Badges Scales
- **Incident Status:**
  - *Open / Published:* `bg-success/5`, `text-success` (`#00ab55`), `border-success/20`
  - *Draft / Drafted:* `bg-warning/5`, `text-warning` (`#e2a03f`), `border-warning/20`
  - *Closed:* `bg-danger/5`, `text-danger` (`#e7515a`), `border-danger/20`
- **Task Priority:**
  - *Critical:* `bg-red-100`, `text-red-700` (`#ef4444`)
  - *High:* `bg-orange-100`, `text-orange-700` (`#f97316`)
  - *Medium:* `bg-yellow-100`, `text-yellow-700` (`#eab308`)
  - *Low:* `bg-green-100`, `text-green-700` (`#22c55e`)
- **Task Status:**
  - *Not Started:* `bg-slate-50` / `bg-gray-100`, `text-slate-500` / `text-gray-600`, `border-slate-200`
  - *In Progress:* `bg-blue-50` / `bg-blue-100`, `text-blue-600`, `border-blue-200`
  - *Completed:* `bg-emerald-50` / `bg-green-100`, `text-emerald-600`, `border-emerald-200`
- **Pharmacy & Approvals:**
  - *Approved:* `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`
  - *Pending Approval:* `bg-amber-50`, `text-amber-700`, `border-amber-200`
  - *Draft:* `bg-slate-100`, `text-slate-600`, `border-slate-200`
  - *Rejected:* `bg-red-50`, `text-red-700`, `border-red-200`
- **Activation Toggle Badge:**
  - *Active:* `bg-teal-100 dark:bg-teal-900/40`, `text-teal-700 dark:text-teal-300`, Dot: `bg-teal-500`
  - *Inactive:* `bg-red-100 dark:bg-red-900/40`, `text-red-600 dark:text-red-400`, Dot: `bg-red-500`

#### 3.1.4 Chart & Module Palette
- `chartColors`: `[#2a78d6, #eb6834, #1baf7a]` (HSE Blue, Coral, Emerald)
- `MODULE_COLORS`:
  - Users: `#4F46E5` (Indigo)
  - Clinic: `#059669` (Emerald)
  - Incidents: `#DC2626` (Red)
  - Tasks: `#D97706` (Amber)
  - Pharmacy: `#0891B2` (Cyan)
  - Reports: `#7C3AED` (Violet)
  - Audits: `#DB2777` (Pink)
  - Settings: `#65A30D` (Lime)

#### 3.1.5 Typography Scale
Font Family: **Almarai** (`'Almarai', sans-serif`) loaded from Google Fonts:
`https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;500;600;700;800&display=swap`

| Semantic Element | Size | Weight | Line Height | Tracking | Usage Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `h1` | `40px` (2.5rem) | 800 (Bold) | 1.2 | Normal | Major headings |
| `h2` | `32px` (2rem) | 700 (Bold) | 1.25 | Normal | Section headings |
| `h3` | `28px` (1.75rem)| 700 (Bold) | 1.3 | Normal | Module titles |
| `h4` | `24px` (1.5rem) | 700 (Bold) | 1.35 | Normal | Card group titles |
| `h5` | `20px` (1.25rem)| 700 (Bold) | 1.4 | Normal | Modal titles |
| `h6` | `16px` (1rem) | 700 (Bold) | 1.4 | Normal | Subheadings |
| **Page Title** | `24px` / `20px` | 900 (`font-black`) | 1.25 | `-0.025em` | Dashboard & Page header titles |
| **Card Header** | `18px` (`text-lg`)| 700 (`font-bold`) | 1.35 | Normal | `ContainerCard`, Panel headers |
| **Section Header**| `18px` (`text-lg`)| 600 (`font-semibold`)| 1.35 | Normal | Form section dividers |
| **Body (Default)**| `14px` (`text-sm`)| 400 (`font-normal`) | 1.43 (20px)| Normal | General paragraphs, descriptions |
| **Form Label** | `15px` | 500 (`font-medium`) | 1.4 | Normal | Inputs, Select, Checkbox labels |
| **Input / Control**| `14px` (`text-sm`)| 400 (`font-normal`) | 1.43 | Normal | Field value text |
| **Table Header** | `14px` | 700 (`font-bold`) | 1.43 | `0.05em` | Table `th`, uppercase |
| **Table Body Cell**| `14px` | 500 (`font-medium`) | 1.43 | Normal | Table `td` |
| **Button Text** | `13px` | 500 (`font-medium`) | 1.4 | Normal | Button label |
| **Caption / Helper**| `12px` (`text-xs`)| 400 (`font-normal`) | 1.33 | Normal | Input helper text, error labels |
| **Badge / Tag** | `11px` / `12px` | 600 (`font-semibold`)| 1.2 | `0.05em` | Status chips |
| **Micro Tag (ID)**| `9px` | 700 (`font-bold`) | 1.1 | `0.05em` | Code/ID badges |

#### 3.1.6 Spacing, Sizing, Radii, Shadows, Z-Index
- **Base Grid:** `4px`. Extended spacing: `4.5` = `18px`.
- **Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px` (Sidebar drawer trigger), `xl: 1280px`, `2xl: 1536px`.
- **Layout Dimensions:**
  - Boxed max-width: `1400px`.
  - Sidebar width: Expanded `260px`, Collapsed `70px`.
  - Customizer drawer width: `400px`.
  - Header height: `70px` (min-height `60px`).
- **Border Radii:**
  - `4px` (`rounded`): Checkbox box, badge base
  - `6px` (`rounded-md`): SweetAlert buttons, sidebar sub-menu items
  - `8px` (`rounded-lg`): `Button`, `Breadcrumbs`, custom tabs, `.panel`
  - `12px` (`rounded-xl`): `.form-input`, `.form-textarea`, `ContainerCard`, `PersonCard`, `KpiCard`, table `thead`, SweetAlert toast
  - `16px` (`rounded-2xl`): Notifications dropdown, ModuleGrid icon box, CTA buttons
  - `20px` (`rounded-[20px]`): Accordion item cards
  - `9999px` (`rounded-full`): Status badges, avatars, pagination buttons, scroll-to-top
- **Elevation & Shadows:**
  - `shadow-sm`: Default card elevation (`KpiCard`, `PersonCard`, `ContainerCard`)
  - `hover:shadow-md hover:-translate-y-0.5`: Interactive card hover elevation
  - `3xl`: `0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)`
  - Colored button shadow: `shadow-[0_10px_20px_-10px]` with color opacity
  - Floating popover: `shadow-[0_20px_60px_-24px_rgba(14,28,48,0.45)]`
  - Drawer shadow: `shadow-[5px_0_25px_0_rgba(94,92,154,0.1)]`
- **Z-Index Hierarchy:**
  - `z-10`: Inline AI buttons, sticky modal footer, tab sub-menus
  - `z-20`: Sticky header (`navbar-sticky header`), sticky step progress bar (`top-14 z-20`)
  - `z-50`: Off-canvas sidebar, mobile backdrop overlay (`bg-[black]/60`), scroll-to-top button, `Dropdown.tsx` popper, upload toast
  - `z-[51]`: Settings drawer panel & backdrop
  - `z-[60]`: Fullscreen application loader overlay (`screen_loader`)

---

### 3.2 Third-Party UI Package Matrix

| Package | Recommended Version | Primary Role | Styling Overrides & Integration Requirements |
| :--- | :--- | :--- | :--- |
| `@mantine/core` | `^8.2.4` (or compatible `^7.x` / `^8.x`) | Select, MultiSelect, Switch, Stepper, Modal, Accordion, Pagination, Tooltip | Wrap inputs with `form-input !font-normal !text-[#1E293B] !border-[#E2E8F0] !h-[40px] !rounded-xl`. Provide primary color `#212B59` and `Almarai` font family in `MantineProvider`. |
| `@mantine/dates`| `^8.2.4` (or compatible) | Mantine date integration styles | Inherit Mantine core theme tokens. |
| `sweetalert2` | `^11.6.8` | Confirmation dialogs, mandatory delete reason modals, toasts | Custom class overrides: `.swal2-popup` pill toast `!rounded-xl !bg-white/95 !backdrop-blur-sm`, progress bar `!h-[3px] !bg-primary`. Delete modal with `#E11D48` warning icon, 500px width, `#E2E8F0` reason textarea, `#E73F46` confirm button. |
| `react-flatpickr`| `^3.10.13` | DateTime pickers | Flatpickr CSS import + wrapper `bg-white rounded-xl border border-[#E2E8F0] h-[40px] px-4 py-2 text-sm text-[#1E293B]`. Adorned with Lucide `Calendar` icon. |
| `@tippyjs/react` | `^4.2.6` | Action buttons tooltips | Wrapped around table action icons (Edit, View, Delete) with fast animation and dark contrast tooltip. |
| `react-popper` | `^2.3.0` | Dropdown floating positioning | Computes placement with RTL sensitivity (`isRtl ? 'bottom-start' : 'bottom-end'`). |
| `lucide-react` | `^1.25.0` / `^0.546.0` | Unified iconography | Size standards: 16px (small buttons/badges), 18px (default buttons, inputs), 20px (action triggers), 24px (cards/headers). |
| `apexcharts` / `react-apexcharts` | `^3.54.1` / `^7.1.0` | Dashboard KPI & BI charts | Theme color mapping (`chartColors`), RTL Y-axis mirroring (`yaxis: { opposite: isRtl }`), dark mode grid/tooltip theme. |
| `react-perfect-scrollbar` | `^1.5.8` | Sidebar overflow scrolling | Track and thumb styling (`#DDDDDD` light / `#2d334c` dark). |

---

### 3.3 Shared UI Components Catalog

#### 3.3.1 Buttons (`Button.tsx`, `CreateAction.tsx`, `TableActionsButtons.tsx`)
- **Base Attributes:** `gap-2 rounded-lg px-4 py-2 text-[13px] font-medium min-w-[80px] flex items-center shadow-none whitespace-nowrap transition-all duration-200`
- **Variants:**
  - `solid`: `btn-{color}` with white text (or dark text for white button)
  - `outline`: `btn-outline-{color}` with border-1 and color text, filling background on hover
  - `text` / Ghost: transparent background, color text, hover tint
  - `icon`: icon only, wrapped in Tippy tooltip
- **Sizes:**
  - `sm`: `px-2.5 py-1.5 text-xs` (icon 16px)
  - `md`: `px-4 py-2 text-[13px] min-w-[80px]` (icon 18px)
  - `lg`: `px-7 py-2.5 text-base` (icon 20px)
- **States:**
  - *Hover:* `-translate-y-[1px]`, outline fills bg
  - *Focus:* `outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2`
  - *Active:* `active:scale-[0.98]`
  - *Disabled:* `opacity-50 cursor-not-allowed`
  - *Loading:* Spinner `<span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />`

#### 3.3.2 Form Controls
- **Text & Password Inputs (`FormikField.tsx`):**
  - Dimensions: Height `40px`, padding `px-4 py-3`, radius `rounded-xl`, border `border border-[#E2E8F0]`.
  - Colors: Text `text-sm font-normal text-[#1E293B]`, placeholder `placeholder:text-[#B0BEC5]`.
  - Dark Mode: `dark:bg-[#121e32] dark:border-[#17263c] dark:text-white-dark`.
  - States: Focus ring transparent with `#E2E8F0` border (dark: `border-primary`). Error: `border-red-500` with AlertCircle icon in `text-xs text-red-500`.
  - Password Toggle: Lucide `Eye` / `EyeOff` icon, RTL refactored: `ltr:right-3 rtl:left-3` with `ltr:pr-10 rtl:pl-10`.
- **Textarea & AI Completion (`FormikTextArea.tsx`):**
  - Dimensions: Radius `rounded-xl`, border `border-[#E2E8F0]`, text `text-[#1E293B] font-medium`.
  - Tools: Mic speech-to-text (`bg-rose-50 border-rose-300`) and Gemini completion (`bg-cyan-50 border-cyan-300`), RTL refactored: `ltr:right-2 rtl:left-2` and `ltr:pr-24 rtl:pl-24`.
- **Select & MultiSelect (`FormikField.tsx`):**
  - Mantine Select/MultiSelect styled with `.form-input !font-normal !text-[#1E293B] !border-[#E2E8F0] !h-[40px] !rounded-xl`. Clearable by default.
- **Card-Style Checkbox (`FormikCheckBox.tsx`):**
  - Container: `px-4 py-3 rounded-xl border`.
  - *Checked:* `bg-[#F0F2FF] dark:bg-dark-light border-0`. 20x20px primary indicator with `<Check size={16} />`.
  - *Unchecked:* `bg-white dark:bg-dark border-[#E2E8F0] dark:border-gray-700`. Indicator border `#8A9AAF`.
  - Label spacing: `ms-2` (replaces hardcoded `ml-2`).
- **Card-Style Radio Group (`FormikRadioInput.tsx`):**
  - Grid: `grid-cols-1` to `grid-cols-4`, card `px-3 py-2 border-2 rounded-xl`.
  - *Selected:* `bg-blue-50 dark:bg-dark-light border-[#60a5fa] border-solid text-[#60a5fa]` with `<CheckCircle size={18} />`.
  - *Unselected:* `bg-white dark:bg-dark border-gray-300 dark:border-gray-700 border-dashed` with `<Circle size={18} className="text-gray-400" />`.
- **Toggle Switch (`FormikSwitchInput.tsx`):**
  - Mantine `<Switch size="md" color="teal" />` with `cursor-pointer` track, error margin `ms-3`.
- **Date/Time Picker (`FormikDateTimePicker.tsx`):**
  - Height `40px`, border `#E2E8F0`, radius `rounded-xl`, Calendar icon at `end-3`.
- **File Upload Dropzone (`FormikFileUpload.tsx`):**
  - Padding `p-8`, border `border-2 border-dashed border-[#E2E8F0]`, radius `rounded-xl`, hover: `border-blue-400 bg-blue-50`.

#### 3.3.3 Data Tables (`CustomTable.tsx`, `datatables.css`)
- **Responsive Wrapper:** `<div className="table-responsive" style={{ maxWidth: '100vw' }}>`.
- **Header:** `<thead className="bg-[#F8FAFC] dark:bg-[#1a2941] rounded-xl">`.
- **Header Cells:** `p-4 text-center text-[14px] text-[#475569] dark:text-gray-400 font-bold uppercase tracking-wider`.
- **Sort Trigger:** `cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-dark-light` with ArrowUp/ArrowDown in `text-primary`.
- **Body Rows:** `border-b !border-white-light/40 dark:!border-[#191e3a]`.
- **Row Hover:** `table.table-hover tbody tr:hover` -> `!bg-white-light/20 dark:!bg-[#1a2941]/40`.
- **Row Selection Checkbox:** Checked border and background `#212B59` (`!border-primary bg-primary`), row highlight `bg-primary/5`.
- **Empty State (`NoDataFoundRow`):** Full column span, `py-14`, `<Inbox size={24} />` in rounded-2xl white badge with shadow-sm.
- **Pagination:** Centered circular 36x36px buttons `rounded-full bg-white-light text-[#3b3f5c] hover:bg-primary hover:text-white`, active `!bg-primary !text-white`, RTL reversed `rtl:flex-row-reverse`.
- **Actions Column:** Tippy tooltips wrapping Edit (`hover:text-warning`), View (`hover:text-primary`), Delete (`hover:text-danger`).

#### 3.3.4 Cards & Panels
- **ContainerCard:** Standard page wrapper card: `bg-white dark:bg-black rounded-xl px-3 py-4 w-full shadow-sm`. Title: `text-primary font-bold text-lg inline-block`, Subtitle: `text-xs text-[#A2ACB9] font-medium`.
- **KPI Card:** `panel relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 dark:border-gray-800 bg-white dark:bg-black p-5 rounded-xl`. 48x48px icon box with shadow-sm.
- **Person Profile Card:** `bg-white dark:bg-black p-3 rounded-xl border border-[#E7E9F5] dark:border-gray-800 shadow-sm hover:border-primary/30`. 40x40px avatar.

#### 3.3.5 Overlays, Feedback & Modals
- **Mantine Modal:** `size="lg" centered`, header border-b `border-gray-200`, sticky bottom footer `sticky bottom-0 flex justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-zinc-50 dark:bg-gray-800 rounded-b-lg z-10`.
- **Delete Confirmation Modal:** SweetAlert2 dialog, 500px width, `#E11D48` warning icon, mandatory deletion reason textarea (`#E2E8F0` border, `#F8FAFC` bg), `#E73F46` confirm button, `#94A3B8` cancel button.
- **Toast Notifications:** SweetAlert2 pill toast `!rounded-xl !px-3 !py-2 !shadow-xl !bg-white/95 !backdrop-blur-sm`, title `13px font-medium text-slate-700`, 3px primary progress bar, 3000ms timer.
- **Floating Upload Progress Toast:** Fixed `bottom-10 start-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200`, width 288px (minimized) to 340px (expanded), Mantine Progress bar.
- **Error Pages (404, 403, 500, 503, unlicensed):** Fullscreen SVG dot-grid canvas `#f8fafc` (dark: `#060818`), huge numeric status `text-[8rem] sm:text-[12rem] lg:text-[18rem]`, glassmorphic card `backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-10`, primary CTA gradient from `#212B59` to `#212B59`.

#### 3.3.6 Navigation & Progress Components
- **Tabs (`Tabs/index.tsx`):** Outline, Filled, Underline. Active outline: `bg-[#F5F6FD] dark:bg-[#181f32] text-primary border-b-2 border-primary`.
- **Breadcrumbs (`Breadcrumbs.tsx`):** Home icon, `<ChevronRight className="rtl:rotate-180" />`, interactive links `hover:bg-primary/10 hover:text-primary`, current item `bg-primary/5 font-bold text-primary rounded-lg px-2 py-1.5`.
- **Stepper (`StepProgress/index.tsx`):** Mantine Stepper `size="xs"` color `#64748B`, sticky bar `sticky top-14 z-20 bg-white dark:bg-black border-t border-t-[#F1F5F9] dark:border-t-gray-800`.
- **ModuleGrid (`ModuleGrid.tsx`):** Dashboard module card grid `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`, 80x80px icon box with hover scale-110.

---

### 3.4 Application Layout Shell Specifications

1. **Top Bar Header (`Header.tsx`):**
   - Height: `70px` (min-height `60px`).
   - Sticky / Floating modes:
     - Floating: `sticky top-0 z-20 bg-[#FFFFFF]/90 px-6 pt-4 dark:bg-[#060818]/90 backdrop-blur-md`.
     - Sticky: `sticky top-0 z-20 bg-white dark:bg-[#0e1726] shadow-sm`.
   - Elements: Sidebar toggle hamburger, search input (`bg-[#F7F8FC] border-0 rounded-xl px-4 py-2`), theme toggle (Light / Dark / System), language dropdown with country flag SVGs, notification bell with animated ping badge, user profile menu.
2. **Sidebar Navigation (`Sidebar.tsx`):**
   - Expanded width: `260px` fixed (`top-0 bottom-0 min-h-screen z-50`).
   - Collapsed vertical width: `70px`.
   - Content offset on desktop: `lg:ltr:ml-[260px] lg:rtl:mr-[260px]`.
   - Mobile (< 1024px): Pushed off-canvas `ltr:-left-[260px] rtl:-right-[260px]`, toggled via Redux `themeConfig.sidebar` with backdrop `fixed inset-0 bg-[black]/60 z-50`.
   - Header logo container: Min-height `77px`, border bottom `border-b-2 border-b-[#F1F5F9] dark:border-b-gray-800`.
   - Nav Link: `flex items-center rounded-md p-2.5 text-[#506690] hover:bg-[#F5F6FD] hover:text-black dark:hover:bg-[#181f32] dark:hover:text-white-dark`.
   - Active Nav Link: `bg-[#F5F6FD] text-black font-semibold dark:bg-[#181f32] dark:text-white-dark`, icon switches to `text-primary`.
3. **Content Layout Container:**
   - Wrapper: `main-content flex flex-col flex-1 min-h-screen bg-[#F5F6FD] dark:bg-[#060818]`.
   - Padding: `p-2 md:p-4` (Standard pages), `p-4 md:p-8 space-y-6` (Executive dashboard).
   - Boxed Layout: Max-width `1400px` centered.
4. **Footer:**
   - Padding: `pt-6 p-6`, text: `text-center ltr:sm:text-left rtl:sm:text-right text-xs text-gray-500 dark:text-white-dark`.
5. **Settings Customizer Drawer (`Setting.tsx`):**
   - Width: `400px` off-canvas right drawer `z-[51] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)]`.

---

### 3.5 Bilingual (RTL / LTR) Architecture

1. **Switching Engine:**
   - Stored in `localStorage.getItem('rtlClass')` (`'ltr'` | `'rtl'`) and synced with `localStorage.getItem('i18nextLng')`.
   - Applied to root HTML: `document.querySelector('html')?.setAttribute('dir', 'rtl')`.
   - Arabic font enforcement: `[dir='rtl'] body, [dir='rtl'] .main-section { @apply font-Almarai; }`.
2. **Directional Mirroring Rules:**
   - Sidebar alignment: `ltr:left-0 rtl:right-0`, desktop offset `lg:ltr:ml-[260px] lg:rtl:mr-[260px]`.
   - Breadcrumb & calendar chevrons: `<ChevronRight className="rtl:rotate-180" />`.
   - Back button arrows: `<ArrowLeft className="scale-x-[-1]" />`.
   - Sidebar collapse toggle icon: `collapse-icon rtl:rotate-180`.
   - Dropdown popper placement: `isRtl ? 'bottom-start' : 'bottom-end'`.
   - Pagination button ordering: `rtl:flex-row-reverse`.
   - SweetAlert button order: `reverseButtons: document.documentElement.dir === 'rtl'`.
   - Native select chevron: `[dir='rtl'] select { background-position: left 0.5rem center; }`.
   - ApexCharts Y-axis: `yaxis: { opposite: isRtl }`.
   - Table text: `ltr:text-left rtl:text-right`.
3. **Preserved LTR Content (Must NOT Mirror):**
   - Phone Numbers: Wrapped in `<span dir="ltr">`.
   - Code Blocks: `pre { direction: ltr; }`.
   - System Identifiers: `ID:${badgeId}` badges.
4. **RTL Inconsistencies & Required Fixes:**
   - Password Eye Toggle: Change `absolute right-3` to `ltr:right-3 rtl:left-3` and input `ltr:pr-10 rtl:pl-10`.
   - Textarea AI & Speech Buttons: Change `absolute right-2` to `ltr:right-2 rtl:left-2` and `ltr:pr-24 rtl:pl-24`.
   - Checkbox Label Margin: Change hardcoded `ml-2` to `ms-2`.
   - Switch Error Margin: Change hardcoded `ml-3` to `ms-3`.
   - Upload Toast: Change `bottom-10 left-1` to `bottom-10 start-4`.

---

### 3.6 Dark Theme Mappings & Leak Remediation

1. **Architecture & Persistence:**
   - Stored in `localStorage.getItem('theme')` (`'light'` | `'dark'` | `'system'`).
   - Tailwind strategy: `darkMode: 'class'`, toggle toggles `dark` class on `document.body` and `html`.
2. **Token Equivalencies Table:**

| Element / Context | Light Token / Class | Dark Token / Class | Contrast / Note |
| :--- | :--- | :--- | :--- |
| **Page Background** | `#F5F6FD` | `#060818` | Base canvas contrast 19.89:1 vs text |
| **Card / Panel** | `#FFFFFF` | `#0e1726` (`dark:bg-black`) | Core surface |
| **Elevated Surface** | `#FFFFFF` | `#181f32` | Header, active items |
| **Dropdown Menu** | `#FFFFFF` | `#1b2e4b` | Sub-menus, popovers |
| **Input Background** | `#FFFFFF` | `#121e32` | Form control surface |
| **Input Border** | `#E2E8F0` | `#17263c` | Hairline border |
| **Table Header Bg** | `#F8FAFC` | `#1a2941` | `thead` dark surface |
| **Table Row Divider**| `white-light/40` (`#e0e6ed66`)| `#191e3a` | Row border |
| **Table Row Hover** | `white-light/20` | `#1a2941/40` | Interactive hover |
| **Scrollbar Thumb** | `#DDDDDD` | `#2d334c` | Scroll track |
| **Primary Text** | `#1E293B` | `#FFFFFF` | AAA contrast in both modes |
| **Secondary Text** | `#64748B` | `#888ea8` | AA contrast in both modes |
| **Placeholder Text**| `#B0BEC5` | `#506690` | Low-priority inputs |
| **Divider / Line** | `#F1F5F9` | `#191e3a` / `dark:border-gray-800` | Section dividers |

3. **Dark Mode Leaks to Fix in Codebase:**
   - `ContainerCard`: Add `dark:bg-black` and `dark:border-gray-800`.
   - `Tabs`: Add `dark:bg-[#181f32] dark:text-white` for active and `dark:text-gray-400` for inactive.
   - `CustomTable` thead: Add `dark:bg-[#1a2941] dark:text-gray-400`.
   - `StepProgress`: Add `dark:bg-black dark:border-t-gray-800`.
   - `PersonCard`: Add `dark:bg-black dark:border-gray-800`.
   - `GeneralDashboard`: Add dark mode surface classes to all KPI summary cards.

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Foundations | Primary Brand Color Token | Deep corporate navy `#212B59` for main buttons, primary headers, active tabs | CSS variable or Tailwind `primary.DEFAULT` | Visual `#212B59` styling | Falls back to system default | `DESIGN_SYSTEM.md:65` |
| 2 | Foundations | Canvas Color Token | Cool lavender-tinted background `#F5F6FD` in light mode, `#060818` in dark mode | CSS variable or Tailwind canvas token | Base body background | Falls back to white/black | `DESIGN_SYSTEM.md:102` |
| 3 | Foundations | Border Color Token | Hairline slate border `#E2E8F0` in light mode, `#17263c` in dark mode | Tailwind border classes | 1px clean border | Falls back to browser default | `DESIGN_SYSTEM.md:107` |
| 4 | Foundations | Almarai Font Typography | Unified Google Fonts typography for Arabic & English across weights 300-800 | Font family `Almarai, sans-serif` | Unified typographic rendering | Falls back to `sans-serif` | `DESIGN_SYSTEM.md:198` |
| 5 | Foundations | Custom Spacing Extension | Custom spacing scale unit `4.5` (`18px`) for compact dashboard gaps | Tailwind `gap-4.5`, `p-4.5` | 18px computed dimension | Unknown token warning if unconfigured | `DESIGN_SYSTEM.md:249` |
| 6 | Foundations | Elevation & Box Shadows | 8 distinct shadow tokens (`shadow-sm`, `hover:shadow-md`, `3xl`, popover, drawer) | Tailwind shadow classes | Layered Z-plane elevation | Falls back to flat display | `DESIGN_SYSTEM.md:288` |
| 7 | Foundations | Responsive Breakpoints | 5 standard breakpoints with key layout shift at `lg: 1024px` | Viewport width | Responsive layout reorganization | Mobile layout persists if unhandled | `DESIGN_SYSTEM.md:299` |
| 8 | Dependencies | `@mantine/core` Integration | Form selects, multi-selects, switches, steppers, modals, accordions, tooltips | Component props & options | Mantine styled UI widgets | Console warning on missing MantineProvider | `DESIGN_SYSTEM.md:35` |
| 9 | Dependencies | `sweetalert2` Dialogs & Toasts | Pill toast alerts and custom delete confirmation with mandatory reason | Alert configuration object | SweetAlert popup DOM overlay | Silent failure or native alert fallback | `DESIGN_SYSTEM.md:38` |
| 10 | Dependencies | `react-flatpickr` DateTime | Flatpickr date/time input with custom `#E2E8F0` rounded-xl shell | Date options & change callback | Custom datepicker dropdown | Falls back to native HTML date | `DESIGN_SYSTEM.md:40` |
| 11 | Dependencies | `@tippyjs/react` Tooltips | Action button floating tooltips on data tables and icon triggers | Tippy content string & target | Floating tooltip popover | Tooltip omitted if unmounted | `DESIGN_SYSTEM.md:41` |
| 12 | Dependencies | `react-popper` Positioning | Dynamic floating dropdown positioning with RTL start/end awareness | Anchor ref & popper content | Positioned absolute overlay | Misaligned popup in RTL | `DESIGN_SYSTEM.md:42` |
| 13 | Dependencies | `apexcharts` Data Visualizations | Dashboard BI charts with custom HSE color series and RTL opposite axis | Series data & chart options | Interactive SVG/Canvas charts | Chart container error if data invalid | `DESIGN_SYSTEM.md:39` |
| 14 | Components | Button Solid Variant | Full background button in primary, secondary, danger, success, warning, info | `variant="solid" color="primary"` | Solid fill button with white text | Disabled state prevents click | `DESIGN_SYSTEM.md:327` |
| 15 | Components | Button Outline Variant | Border-1 button with matching color text that fills background on hover | `variant="outline" color="secondary"` | Outline styled button | Disabled state reduces opacity to 0.5 | `DESIGN_SYSTEM.md:328` |
| 16 | Components | Button Text/Ghost Variant | Borderless transparent action link with color hover for table/filter bars | `variant="text"` | Borderless action trigger | Disabled state prevents click | `DESIGN_SYSTEM.md:329` |
| 17 | Components | Button Icon Variant | Dedicated icon-only button wrapped in Tippy tooltip | `icon={<Edit2 size={20} />} tooltip="Edit"` | Compact icon button | Tooltip disabled if empty | `DESIGN_SYSTEM.md:330` |
| 18 | Components | Button Loading State | Button showing white animated spinner with disabled interaction | `loading={true}` | Spinner `<span className="animate-spin..." />` | User clicks blocked | `DESIGN_SYSTEM.md:341` |
| 19 | Components | FormikField Text Input | 40px height, rounded-xl, `#E2E8F0` border, text-sm, label, helper text | Field props, value, onChange | Form input control | Red border & AlertCircle error | `DESIGN_SYSTEM.md:408` |
| 20 | Components | FormikField Password Toggle | Password input with toggleable Lucide Eye / EyeOff adornment | `type="password"` | Obfuscated / revealed input | State toggles local boolean | `DESIGN_SYSTEM.md:415` |
| 21 | Components | FormikTextArea AI Augmented | Multi-line textarea with embedded speech-to-text and AI prompt buttons | Rows, value, AI config | Smart text entry zone | Speech API error handled via toast | `DESIGN_SYSTEM.md:429` |
| 22 | Components | FormikField Select / MultiSelect | Mantine wrapped select with custom `#E2E8F0` rounded-xl styling and clearable | List data array, value | Dropdown selection list | Red border on validation failure | `DESIGN_SYSTEM.md:448` |
| 23 | Components | FormikCheckBox Card Style | Card-style checkbox with primary indicator on check and `#8A9AAF` on uncheck | Checked boolean, label | Selectable card checkbox | Formik validation error message | `DESIGN_SYSTEM.md:468` |
| 24 | Components | FormikRadioInput Card Grid | Responsive column radio card group with CheckCircle indicator | Options array, columns (1-4) | Grid of selectable cards | Formik validation error message | `DESIGN_SYSTEM.md:483` |
| 25 | Components | FormikSwitchInput | Mantine Switch with teal color and cursor-pointer track | Label, checked boolean | Interactive toggle switch | Error label aligned via ms-3 | `DESIGN_SYSTEM.md:500` |
| 26 | Components | FormikDateTimePicker | Flatpickr wrapped date input with Lucide Calendar icon at end-3 | Options (enableTime, etc.) | Date/time picker control | Invalid date triggers schema error | `DESIGN_SYSTEM.md:511` |
| 27 | Components | FormikFileUpload Dropzone | 2px dashed dropzone with hover highlight and multiple file preview list | Accept types, multiple flag | Drag-and-drop file upload | File size/format validation toast | `DESIGN_SYSTEM.md:525` |
| 28 | Components | CustomTable Data Grid | Full table with sortable headers, hover states, row borders, zebra striping | Column headers, data rows | Responsive data table | Empty state row if no records | `DESIGN_SYSTEM.md:540` |
| 29 | Components | CustomTable Sortable Columns | Column sort header with ArrowUp / ArrowDown in primary color | `sortableColumnIndex`, `sortDir` | Directional arrow indicator | Toggles asc -> desc -> none | `DESIGN_SYSTEM.md:545` |
| 30 | Components | CustomTable Row Selection | Mantine Checkbox per row with `bg-primary/5` row highlight | Checked state per item ID | Selected rows batch list | Batch bar disabled if empty | `DESIGN_SYSTEM.md:548` |
| 31 | Components | CustomTable Empty State | Full table colspan `NoDataFoundRow` with Inbox icon in rounded-2xl badge | None (rendered on data.length===0)| Centered empty state graphic | Handled gracefully | `DESIGN_SYSTEM.md:551` |
| 32 | Components | CustomTable Pagination | Centered circular 36x36px pagination buttons with RTL reversal | Page number, total pages | Numbered pagination bar | Prev/Next disabled at limits | `DESIGN_SYSTEM.md:552` |
| 33 | Components | TableActionsButtons | Icon action group for Edit, View, and Delete with Tippy tooltips | Callbacks `onEdit`, `onShow`, `onDelete`| Compact action buttons | Missing callbacks hide button | `DESIGN_SYSTEM.md:380` |
| 34 | Components | ContainerCard Page Wrapper | Standard white card wrapper with bold title, subtitle, and action corner | `title`, `subTitle`, `btnCorner` | Standard page card container | Renders without corner if absent | `DESIGN_SYSTEM.md:586` |
| 35 | Components | KpiCard Dashboard Metric | Dashboard metric card with 48x48px icon, bold value, and percentage trend | Title, value, icon, trend | High-density metric widget | Trend pill omitted if undefined | `DESIGN_SYSTEM.md:588` |
| 36 | Components | PersonCard Profile Summary | Profile card with 40x40px avatar, contact info, and LTR-protected phone | User profile object | Compact identity card | Placeholder avatar if image fails | `DESIGN_SYSTEM.md:589` |
| 37 | Components | SharedAppliedFilters Bar | Filter chips bar with remove badges, count expander, and Clear All trigger | Applied filters array, onRemove | Filter chips toolbar | Hides when no filters active | `DESIGN_SYSTEM.md:744` |
| 38 | Components | ModuleGrid Card Grid | Responsive grid of module tiles with 80x80px icons and hover scale-110 | Module list array, onClick | High-level navigation grid | Gracefully wraps across screens | `DESIGN_SYSTEM.md:749` |
| 39 | Components | Breadcrumbs Navigation | Breadcrumbs bar with Home icon, chevrons, and active item highlight | Breadcrumb items array | Navigation trail | Current page rendered non-clickable | `DESIGN_SYSTEM.md:677` |
| 40 | Components | Tabs Component | Multi-tab bar with Outline, Filled, and Underline variants | Tabs array, activeTab, onChange | Tab navigation header | Default to first tab if invalid | `DESIGN_SYSTEM.md:667` |
| 41 | Components | Mantine Accordion | Rounded 20px card accordions with soft shadow and hover background | Items array, values | Expandable card accordion | Multiple or single accordion mode | `DESIGN_SYSTEM.md:672` |
| 42 | Components | Mantine Modal Standard | Centered modal with header icon, border-b separator, and sticky footer | `opened`, `onClose`, `title`, children | Overlay modal dialog | Escape / backdrop closes modal | `DESIGN_SYSTEM.md:609` |
| 43 | Components | Delete Confirmation Dialog | 500px SweetAlert2 dialog with reason textarea and red confirm CTA | Config `title`, `body`, `onConfirm` | Modal dialog prompt | Form submit blocked if reason empty | `DESIGN_SYSTEM.md:638` |
| 44 | Components | Glassmorphic Toast Alert | 3000ms auto-dismissing pill toast with 3px primary progress bar | Type (`success`/`error`), message | Glassmorphic notification pill | Stacks or replaces active toast | `DESIGN_SYSTEM.md:637` |
| 45 | Components | Floating Upload Progress Toast | Bottom-anchored widget showing active upload progress bar | Active uploads array | Floating progress indicator | Dismisses when uploads complete | `DESIGN_SYSTEM.md:639` |
| 46 | Components | ErrorDisplay Fullscreen | Fullscreen 404/403/500/unlicensed display with dot-grid canvas & huge numbers | Error status code, back action | Fullscreen error layout | Defaults to 404 if code unknown | `DESIGN_SYSTEM.md:947` |
| 47 | Shell | Application Header | 70px header with mobile toggle, search, theme toggle, lang menu, user profile | Active user & layout state | Sticky/Floating top navigation bar | Adapts dynamically to scroll mode | `DESIGN_SYSTEM.md:781` |
| 48 | Shell | Responsive Sidebar Navigation | 260px vertical sidebar with expanded/collapsed states and mobile drawer | Active route, collapse state | Persistent sidebar or mobile drawer | Closes on backdrop click on mobile | `DESIGN_SYSTEM.md:774` |
| 49 | Shell | Boxed Layout Container | 1400px centered content wrapper for wide-screen readability | Layout configuration setting | Constrained content canvas | Expands to full-width if unboxed | `DESIGN_SYSTEM.md:305` |
| 50 | Localization | Dynamic RTL Switching | HTML `dir="rtl"` attribute toggle with synchronized local storage | Language selection (`ar`/`en`) | Flipped document layout direction | Persists across page reloads | `DESIGN_SYSTEM.md:863` |
| 51 | Localization | Directional Chevron Mirroring | Automatic 180-degree rotation of chevrons and back buttons in RTL | `dir="rtl"` context | `rtl:rotate-180` / `scale-x-[-1]` | Elements mirror without code change | `DESIGN_SYSTEM.md:872` |
| 52 | Localization | Phone & Code LTR Protection | Forced LTR direction on telephone numbers, code blocks, and IDs | Telephone strings, `<pre>` tags | Strict LTR rendering in RTL mode | Prevents inverted punctuation | `DESIGN_SYSTEM.md:882` |
| 53 | Dark Theme | Class-Based Dark Mode | Dark mode toggle via `dark` class on body/html with local storage sync | Theme mode (`light`/`dark`/`system`) | System-wide dark palette | Responds to OS system theme changes | `DESIGN_SYSTEM.md:898` |
| 54 | Dark Theme | Dark Mode Surface Mapping | 1-to-1 mapping of light panels to `#0e1726` and canvas to `#060818` | Dark mode active | Replaced background & border colors | Dark contrast maintained | `DESIGN_SYSTEM.md:906` |

---

## 5. Edge Cases

| # | Feature | Input / Condition | Observed Behavior & Specification Requirement |
|---|---------|-------------------|------------------------------------------------|
| 1 | Solid Buttons Contrast | Button text `#ffffff` on `btn-success`, `btn-danger`, `btn-warning`, `btn-info` | Fails WCAG AA for normal text (< 4.5:1; e.g. Warning is 2.25:1). Must use large font size, bold weight, or darker accessible variants for text-heavy scenarios. |
| 2 | Typography Font Weights | Classes `font-medium` (500) and `font-semibold` (600) | Missing from original Google Fonts CDN link (which only loaded 300, 400, 700, 800). Browser synthesizes faux-bold scaling. Must load `wght@300;400;500;600;700;800` explicitly. |
| 3 | Password Eye Toggle in RTL | `dir="rtl"` with password field | Eye toggle hardcoded at `absolute right-3` overlaps the beginning of Arabic text. Must be refactored to `ltr:right-3 rtl:left-3` with `ltr:pr-10 rtl:pl-10`. |
| 4 | Textarea AI Tools in RTL | `dir="rtl"` with AI-enabled textarea | AI and Speech buttons hardcoded at `absolute right-2` collide with Arabic text flow. Must be refactored to `ltr:right-2 rtl:left-2` with `ltr:pr-24 rtl:pl-24`. |
| 5 | Checkbox Label Spacing in RTL | `dir="rtl"` on `FormikCheckBox` | Hardcoded `ml-2` moves label away from the left border instead of spacing it from the checkbox indicator. Must use `ms-2` (margin-inline-start). |
| 6 | Switch Error Spacing in RTL | `dir="rtl"` on `FormikSwitchInput` | Hardcoded `ml-3` indents error text incorrectly in RTL. Must use `ms-3`. |
| 7 | Floating Upload Progress Toast | `dir="rtl"` on upload progress widget | Pinned to `bottom-10 left-1`, remaining stuck to the bottom left in Arabic RTL. Must use `bottom-10 start-4`. |
| 8 | Phone Numbers in RTL | Arabic text containing phone numbers `+966 50 123 4567` | Unwrapped numbers invert hyphens and country codes. Must be wrapped in `<span dir="ltr">`. |
| 9 | Preformatted Code Blocks | Arabic RTL layout with `<pre>` or code snippets | Code renders reversed or with misaligned punctuation. Must enforce `pre { direction: ltr; }`. |
| 10 | Dark Mode `ContainerCard` | `dark` class active with `ContainerCard` | Hardcoded `bg-white` without dark background produces jarring white boxes on dark canvas. Must have `dark:bg-black dark:border-gray-800`. |
| 11 | Dark Mode `Tabs` | `dark` class active on custom `Tabs` | Hardcoded `bg-[#F5F6FD] text-gray-500` produces washed-out light tabs in dark theme. Must specify `dark:bg-[#181f32]` and `dark:text-white`. |
| 12 | Dark Mode `CustomTable` Thead | `dark` class active on data table | Hardcoded `bg-[#F8FAFC]` remains glaringly light in dark mode. Must use `dark:bg-[#1a2941]`. |
| 13 | Dark Mode `StepProgress` | `dark` class active on multi-step wizard | Sticky container hardcodes `bg-white border-t-[#F1F5F9]`. Must use `dark:bg-black dark:border-t-gray-800`. |
| 14 | Responsive Table Overflow | Mobile viewport (< 640px) with wide table | Content clips or overflows viewport unless wrapped in `table-responsive` with `style={{ maxWidth: '100vw' }}`. |
| 15 | SweetAlert Confirmation RTL Order | Arabic RTL mode with SweetAlert dialogs | Confirm button renders on the left, violating RTL usability norms unless `reverseButtons: document.documentElement.dir === 'rtl'` is passed. |
| 16 | ApexCharts Y-Axis in RTL | Executive dashboard chart in Arabic RTL | Y-axis labels overlap data series on the left unless configured with `yaxis: { opposite: isRtl }`. |
| 17 | Primary Brand Duality | Legacy Vristo `#4361ee` vs HSE Navy `#212B59` | Codebase contains residual `#4361ee` (royal blue) in SVG check fills and badge styles. Must standardize exclusively on `#212B59`. |
| 18 | Danger Red Color Fragmentation | Multiple red hexes (`#e7515a`, `#E73F46`, `#E11D48`, `#ef4444`, `#fa5252`) | Visual inconsistency across buttons, asterisks, and dialog icons. Must consolidate on `#e7515a` for brand danger and `#ef4444` for standard field errors. |
| 19 | Tailwind Syntax Typo | `text-slate-[#212B59]` in legacy sidebar | Invalid Tailwind arbitrary value syntax; class fails to compile and outputs no CSS. Must be corrected to `text-primary` or `text-[#212B59]`. |
| 20 | Mantine Provider Default Theme | `MantineProvider` instantiated with `theme={{}}` | Mantine controls default to teal/cyan and system fonts instead of HSE Navy and Almarai. Must configure Mantine theme object with primary color `#212B59` and `fontFamily: 'Almarai, sans-serif'`. |

---

## 6. Inconsistencies & Conflict Remediation Plan

From our audit of `DESIGN_SYSTEM.md:959-970`, here are the concrete remediation instructions for implementation:

1. **Resolve Primary Color Duality:**
   - Eliminate all references to `#4361ee` (e.g. `rgba(67,97,238,.15)`).
   - Standardize `primary.DEFAULT` to `#212B59`, `primary.light` to `#eaf1ff`, and `primary.dark-light` to `rgba(33,43,89,0.15)`.
2. **Consolidate Red / Danger Tokens:**
   - Semantic brand danger: `#e7515a` (`danger.DEFAULT`).
   - Field validation error / asterisk: `#ef4444` (`red-500`).
   - SweetAlert confirmation dialogs: harmonize on `#e7515a` or standard danger palette.
3. **Harmonize Border Grays:**
   - Standardize light border token to `#E2E8F0` (`slate-200`) across all inputs, cards, and modal containers.
   - Standardize dark border token to `#17263c` for inputs and `#191e3a` for table dividers.
4. **Clean Dark Mode Surface Hierarchy:**
   - Level 0 (Canvas): `#060818`
   - Level 1 (Surface / Panels): `#0e1726` (`dark:bg-black`)
   - Level 2 (Elevated Popovers & Headers): `#181f32`
   - Level 3 (Inputs & Menus): `#121e32` / `#1b2e4b`
5. **Harmonize Button Styles:**
   - Discard the legacy `.btn` styles in `tailwind.css:261` (heavy drop shadow, `rounded-md`) in favor of `Button.tsx` (`rounded-lg`, `px-4 py-2`, `text-[13px]`, `font-medium`, `shadow-none`, active physics).
6. **Correct Font Loading CDN:**
   - Update Google Fonts link in `index.html` to load all needed weights:
     `https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;500;600;700;800&display=swap`

---

## 7. Caveats

1. **Tailwind Version Compatibility:** The specification in `DESIGN_SYSTEM.md` was drafted against Tailwind CSS v3 (`tailwind.config.cjs`, `@apply font-Almarai`), whereas `PPE-FINAL` currently has `@tailwindcss/vite` v4 installed. The token configuration can be cleanly mapped via `@theme` in CSS or standard Tailwind configuration depending on the build setup chosen by the foundation engineers.
2. **React 19 vs UI Library Peer Dependencies:** `PPE-FINAL` uses `react` `^19.0.1`. When installing `@mantine/core`, `@mantine/dates`, `@tippyjs/react`, `sweetalert2`, and `react-flatpickr`, package managers may require `--legacy-peer-deps` or specific compatible version flags if Mantine or Flatpickr packages declare React 18 in their peer dependencies.
3. **No Code Written:** In strict adherence to the Specification Miner archetype, zero code or package modifications were executed in this step. All findings are purely analytical, authoritative, and documented for handoff.

---

## 8. Conclusion

The HSE front-end design system specification in `DESIGN_SYSTEM.md` has been completely mined, dissected, and organized into an exhaustive reference catalog. 

- **Foundation & Tokens:** Primary Navy (`#212B59`), Canvas (`#F5F6FD`), Borders (`#E2E8F0`), Almarai typography (300-800), and full dark theme equivalencies are specified.
- **Dependencies:** 9 key UI libraries identified with their exact styling and theming roles.
- **Shared Components:** Over 25 distinct UI components and form controls documented with micro-interactions, dimensions, states, and error handling.
- **App Shell & Layout:** 70px header, 260px collapsible sidebar, 1400px boxed container, and responsive breakpoint rules detailed.
- **Localization & Dark Mode:** Bilingual switching, mirrored chevrons, LTR protection, and 6 dark mode leak fixes specified.
- **Catalog Tables:** 54 discrete features and 20 critical edge cases documented in standard tabular format.

This document serves as the single source of truth for the Foundation, Component, and View implementation workers.

---

## 9. Verification Method

To independently verify these findings:

1. **Inspect Authoritative Specification Files:**
   - Check `DESIGN_SYSTEM.md` lines 10-56 for Tailwind tokens and color hexes.
   - Check `DESIGN_SYSTEM.md` lines 198-235 for Almarai typography rules and scales.
   - Check `DESIGN_SYSTEM.md` lines 323-535 for Button and Formik component specifications.
   - Check `DESIGN_SYSTEM.md` lines 772-788 for Sidebar, Header, and Layout Shell dimensions.
   - Check `DESIGN_SYSTEM.md` lines 861-923 for RTL mirroring rules and dark theme token mappings.
   - Check `DESIGN_SYSTEM.md` lines 959-970 for the Conflict & Duplication Audit.
2. **Cross-Check with ORIGINAL_REQUEST.md:**
   - Verify alignment with Requirements R1 (Tokens/Dependencies), R2 (Components & Shell), and R3 (Localization & Dark Mode).
3. **Validate Target Codebase Status:**
   - Inspect `d:\Sana Soft2\PRoject Code\PPE-FINAL\package.json` to verify current missing dependencies.
   - Inspect `d:\Sana Soft2\PRoject Code\PPE-FINAL\index.html` to confirm missing Google Fonts link.
   - Inspect `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\index.css` to verify token delta.

