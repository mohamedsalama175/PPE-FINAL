# Project: HSE Front-End Design System Implementation (DESIGN_SYSTEM.md)

## Architecture
The HSE Front-End Design System is a modern, responsive, accessible enterprise design system tailored for health, safety, and environment operations in PPE-FINAL.

- **Foundations & Tokens**:
  - Color Palette: Corporate Primary Navy (`#212B59`), Canvas Canvas (`#F5F6FD` / Dark `#060818`), Hairline Slate Borders (`#E2E8F0` / Dark `#17263c`), Secondary Purple (`#805dca`), and Semantics (Success `#00ab55`, Danger `#e7515a`, Warning `#e2a03f`, Info `#2196f3`, Dark `#3b3f5c`).
  - Typography: Google Fonts **Almarai** (`'Almarai', sans-serif`) loaded globally in `index.html` across weights 300, 400, 500, 600, 700, 800.
  - Tailwind Architecture: Configured natively via Tailwind CSS v4 `@theme` and `@variant dark` in `src/index.css`.
  - Dark Theme: Managed via Zustand theme store and `.dark` class on `document.documentElement` with full token parity.
  - Localization: Bilingual English (`ltr`) and Arabic (`rtl`) with automatic `dir` synchronization, font rendering, and directional utility classes.
- **Third-Party UI Libraries**:
  - `@mantine/core` & `@mantine/hooks` (`^8.2.4`): Select, MultiSelect, Modal, Accordion, Pagination.
  - `@mantine/dates` (`^8.2.4`) & `dayjs`: Date and time inputs.
  - `@tippyjs/react` (`^4.2.6`): Floating action tooltips.
  - `sweetalert2` (`^11.26.25`): Confirmation modals and glassmorphic toast notifications.
  - `react-flatpickr` (`^4.0.11`) & `flatpickr`: Styled datetime pickers with Lucide Calendar adornments.
- **Layout Shell**:
  - `Header`: 70px height, global search bar, language switcher with flag indicator, dark/light theme switcher, user avatar & profile popover.
  - `Sidebar`: 260px expanded, 70px collapsed, responsive off-canvas drawer on `<1024px` with backdrop overlay, active indicator (`bg-[#F5F6FD] text-[#212B59]`), and RTL mirrored chevrons.
  - Boxed page container: 1400px maximum width (`max-w-[1400px]`), `#F5F6FD` canvas background, standard breadcrumbs, and page headers.

---

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.

| # | Feature ID | Name | Description | Milestone | Source |
|---|------------|------|-------------|-----------|--------|
| 1 | FE-TOK-01 | Primary Brand Palette | Configure `#212B59` primary, `#eaf1ff` light, and translucent tints in Tailwind `@theme`. | M1 | DESIGN_SYSTEM §Color System |
| 2 | FE-TOK-02 | Canvas & Surface Tokens | Configure `#F5F6FD` canvas (dark `#060818`), `#FFFFFF` panels (dark `#0e1726`), elevated `#181f32`. | M1 | DESIGN_SYSTEM §Neutral Palette |
| 3 | FE-TOK-03 | Slate Border Tokens | Configure `#E2E8F0` hairline borders (dark `#17263c`) and table dividers (`#e0e6ed` / `#191e3a`). | M1 | DESIGN_SYSTEM §Hairline Borders |
| 4 | FE-TOK-04 | Semantic & Status Palette | Configure Success (`#00ab55`), Danger (`#e7515a`), Warning (`#e2a03f`), Info (`#2196f3`), Secondary (`#805dca`). | M1 | DESIGN_SYSTEM §Semantic Colors |
| 5 | FE-TOK-05 | Almarai Typography Scale | Load Google Fonts Almarai in `index.html` (300-800); apply `'Almarai', sans-serif` globally. | M1 | DESIGN_SYSTEM §Typography |
| 6 | FE-TOK-06 | Radii & Shadow Tokens | Configure `rounded-xl` (12px), `rounded-lg` (8px), and soft box-shadows. | M1 | DESIGN_SYSTEM §Border Radii & Shadows |
| 7 | FE-PKG-01 | Mantine Core & Dates Integration | Install and configure `@mantine/core@8.2.4`, `@mantine/hooks`, `@mantine/dates`, and `dayjs`. | M1 | ORIGINAL_REQUEST §R1 |
| 8 | FE-PKG-02 | Tippy Tooltips Integration | Install `@tippyjs/react@4.2.6` and `tippy.js` with styles. | M1 | ORIGINAL_REQUEST §R1 |
| 9 | FE-PKG-03 | SweetAlert2 Integration | Install `sweetalert2@11.26.25` and configure glassmorphic theme and `useSwal` helper. | M1 | ORIGINAL_REQUEST §R1 |
| 10 | FE-PKG-04 | Flatpickr Integration | Install `react-flatpickr@^4.0.11` and `flatpickr` with Lucide Calendar adornments. | M1 | ORIGINAL_REQUEST §R1 |
| 11 | FE-THM-01 | Theme Provider & Store | Implement Zustand theme store (light/dark/system), sync with `html.dark` and localStorage. | M1 | DESIGN_SYSTEM §Dark Theme |
| 12 | FE-CMP-01 | Standard Button System | Implement Button variants (`solid`, `outline`, `text`, `icon`), sizes, active scale, loading spinner. | M2 | DESIGN_SYSTEM §Buttons |
| 13 | FE-CMP-02 | Form Controls System | Implement Input, Textarea, Mantine Select, CheckboxCard, RadioCards, and ToggleSwitch with RTL fix. | M2 | DESIGN_SYSTEM §Form Controls |
| 14 | FE-CMP-03 | Flatpickr Date/Time Picker | Implement DateTimePicker component with presets, time-picker, and bilingual locale support. | M2 | DESIGN_SYSTEM §DateTime Pickers |
| 15 | FE-CMP-04 | File Upload Dropzone | Implement drag-and-drop file upload with preview, size validation, and icon indicators. | M2 | DESIGN_SYSTEM §File Upload |
| 16 | FE-CMP-05 | CustomTable Data Grid | Implement sortable headers, row selection checkboxes, hover effects, zebra striping, and pagination. | M2 | DESIGN_SYSTEM §Data Tables |
| 17 | FE-CMP-06 | Table Action Buttons with Tippy | Implement standard view/edit/delete/clone action group wrapped with Tippy tooltips. | M2 | DESIGN_SYSTEM §Action Tooltips |
| 18 | FE-CMP-07 | ContainerCard & KpiCard | Implement standard content cards and KPI metric stat cards with trend badges and dark mode surfaces. | M2 | DESIGN_SYSTEM §Cards |
| 19 | FE-CMP-08 | Modal & SlideOver Drawers | Implement Mantine-based Modal dialogs and bidirectional RTL-aware SlideOver drawers. | M2 | DESIGN_SYSTEM §Modals |
| 20 | FE-CMP-09 | SweetAlert2 & Toast System | Implement confirmation dialogs, mandatory deletion reason prompt, and toast notifications. | M2 | DESIGN_SYSTEM §Feedback & Toasts |
| 21 | FE-SHL-01 | Responsive Header | Implement 70px Header with search input, language dropdown, theme toggle, and user profile card. | M2 | DESIGN_SYSTEM §Header |
| 22 | FE-SHL-02 | Responsive Collapsible Sidebar | Implement 260px expanded / 70px collapsed Sidebar with mobile off-canvas drawer (<1024px). | M2 | DESIGN_SYSTEM §Sidebar |
| 23 | FE-SHL-03 | Layout Boxed Container & Breadcrumbs | Implement 1400px boxed container, `#F5F6FD` canvas background, and RTL-aware breadcrumbs. | M2 | DESIGN_SYSTEM §Page Container |
| 24 | FE-VIW-01 | Dashboard & Analytics Views | Align Dashboard, KPI widgets, Stock Analytics, and Employee Compliance views with DESIGN_SYSTEM. | M3 | ORIGINAL_REQUEST §R3 |
| 25 | FE-VIW-02 | Master Data Views | Align Catalog, Item Details, Dynamic Attributes, Item Groups, and Locations views. | M3 | ORIGINAL_REQUEST §R3 |
| 26 | FE-VIW-03 | Stock & Kit Management Views | Align Stock Movements, Opening Balance, Stock In/Out, and Kit Management views. | M3 | ORIGINAL_REQUEST §R3 |
| 27 | FE-VIW-04 | Issuance, Loans & Tracking Views | Align Single Issuance, Kit Issuance, Loans, Returns, and Employee Tracking views. | M3 | ORIGINAL_REQUEST §R3 |
| 28 | FE-VIW-05 | System Administration & Governance Views | Align Settings, Trash Bin (90-day retention), and Immutable Audit Log Viewer. | M3 | ORIGINAL_REQUEST §R3 |
| 29 | FE-VIW-06 | Native Dialogs Remediation | Replace all `window.alert()` and `window.prompt()` occurrences with `useSwal` confirmation dialogs. | M3 | EXPLORER_VIEWS §Dialogs |
| 30 | FE-RTL-01 | RTL Directional Class Remediation | Replace hardcoded `text-left`, `right-0`, `pl-9`, `mr-1`, `translate-x-2` with logical/bilingual utilities. | M4 | DESIGN_SYSTEM §Localization |
| 31 | FE-DRK-01 | Project-Wide Dark Mode Parity | Ensure 100% dark mode coverage across all 34 views, modals, cards, table theads, and inputs. | M4 | DESIGN_SYSTEM §Dark Theme |
| 32 | FE-VER-01 | Zero-Error Build & Test Verification | Validate `npm run build`, `npm run build:server`, and ensure zero test regressions. | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundations, Tokens, Fonts & Dependencies | FE-TOK-01..06, FE-PKG-01..04, FE-THM-01: Install packages, load Almarai Google Font in `index.html`, configure Tailwind v4 `@theme` in `src/index.css`, establish Theme Store (dark/light) and MantineProvider in `src/main.tsx`. | None | DONE |
| M2 | Shared Components & Application Layout Shell | FE-CMP-01..09, FE-SHL-01..03: Implement Button, Form controls, CustomTable, DatePicker, FileUpload, ContainerCard, KpiCard, Modal, useSwal, 70px Header, and 260px/70px responsive Sidebar with mobile drawer. | M1 | DONE |
| M3 | Project-Wide Application Views Conformance | FE-VIW-01..06: Align all 34 existing views, dashboard cards, KPI widgets, data tables, and modal dialogs with the new design system components and SweetAlert2 dialogs. | M2 | DONE |
| M4 | RTL Bilingual Polish, Dark Theme Parity & Final Verification | FE-RTL-01, FE-DRK-01, FE-VER-01: Complete RTL bidirectional audits, dark theme token compilation in Tailwind v4 @theme, atomic prisma seed referential integrity, zero-error client build (`npm run build`), server build, and 100% automated test pass (575/575 E2E tests). | M3 | DONE |

---

## Interface Contracts

### Button Component (`src/components/ui/Button.tsx`)
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'text' | 'icon';
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}
```

### Form Controls (`src/components/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx`)
```typescript
export interface BaseInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  containerClassName?: string;
}
```

### CustomTable Data Grid (`src/components/ui/CustomTable.tsx`)
```typescript
export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface CustomTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectRow?: (ids: string[]) => void;
  idKey?: keyof T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
  };
  emptyState?: React.ReactNode;
  className?: string;
}
```

### SweetAlert2 Helper (`src/lib/swal.ts` / `useSwal`)
```typescript
export interface SwalHelper {
  showConfirm: (title: string, text?: string, confirmText?: string) => Promise<boolean>;
  showDeleteReason: (title: string, placeholder?: string) => Promise<string | null>;
  showToast: (title: string, icon?: 'success' | 'error' | 'warning' | 'info') => void;
}
```

---

## Code Layout
- `src/index.css`: Native Tailwind CSS v4 `@theme` definitions, dark mode variables, global utilities.
- `index.html`: Google Fonts Almarai `<link>` tags, metadata, viewport.
- `src/main.tsx`: Application bootstrap with `MantineProvider` and Theme initialization.
- `src/store/themeStore.ts`: Zustand store for theme mode (`light`, `dark`, `system`).
- `src/components/layout/`:
  - `Layout.tsx`: Application shell orchestrator (boxed container, main wrapper).
  - `Header.tsx`: 70px header, search bar, language switcher, theme toggle, user profile.
  - `Sidebar.tsx`: 260px/70px responsive sidebar with mobile off-canvas drawer and backdrop.
  - `PageHeader.tsx`: Title, breadcrumbs, actions bar.
- `src/components/ui/`:
  - `Button.tsx`: Full variant button system.
  - `Input.tsx`, `Textarea.tsx`, `Select.tsx`: Form inputs.
  - `ToggleSwitch.tsx`, `CheckboxCard.tsx`, `RadioCards.tsx`: Selection controls.
  - `DatePicker.tsx`: Flatpickr wrapper with calendar adornments.
  - `FileUpload.tsx`: Drag-and-drop dropzone.
  - `CustomTable.tsx`: Full-featured data table.
  - `TableActionsButtons.tsx`: Row actions with Tippy tooltips.
  - `ContainerCard.tsx`, `KpiCard.tsx`: Standard card surfaces.
  - `Modal.tsx`: Mantine-based modal dialogs.
  - `StatusBadge.tsx`: Status indicator badges.
- `src/lib/swal.ts`: SweetAlert2 custom styled instances.
- `src/pages/`: All 34 application views.
