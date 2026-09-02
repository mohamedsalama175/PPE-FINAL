## 2026-11-11T08:57:31Z
You are the Implementation Worker for Milestone 2: Shared UI Components and Application Layout Shell.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Read ORIGINAL_REQUEST.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Read DESIGN_SYSTEM.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md
Read PROJECT.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md
Read Explorer M2 Shell handoff at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_shell\handoff.md (and check proposed files: proposed_Header.tsx, proposed_Sidebar.tsx, proposed_PageHeader.tsx, proposed_Layout.tsx in that folder)
Read Explorer M2 Forms handoff at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_forms\handoff.md
Read Explorer M2 Components handoff at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_components\handoff.md

Your exclusive write ownership:
- Layout Shell: `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/PageHeader.tsx`, `src/components/layout/Layout.tsx`
- Shared UI Components: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/ToggleSwitch.tsx`, `src/components/ui/CheckboxCard.tsx`, `src/components/ui/RadioCards.tsx`, `src/components/ui/DatePicker.tsx`, `src/components/ui/FileUpload.tsx`, `src/components/ui/DataTable.tsx`, `src/components/ui/CustomTable.tsx`, `src/components/ui/TableActionsButtons.tsx`, `src/components/ui/ContainerCard.tsx`, `src/components/ui/KpiCard.tsx`, `src/components/ui/StatusBadge.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/SlideOverDrawer.tsx`, `src/components/ui/EmptyState.tsx`
- Feedback: `src/lib/swal.ts`, `src/lib/useSwal.ts`

Scope of Implementation:
1. Implement the Application Layout Shell in `src/components/layout/`:
   - `Header.tsx`: 70px height (`h-[70px]`), sticky top `z-30`, global search input (`bg-[#F7F8FC] dark:bg-[#121e32] rounded-xl border-[#E2E8F0] dark:border-[#17263c]`), Light/Dark/System theme switcher connected to `themeStore`, bilingual Language switcher (`useTranslation`), User avatar profile card with persona popup, mobile hamburger button (<1024px).
   - `Sidebar.tsx`: 260px expanded / 70px collapsed desktop navigation with smooth CSS transitions, responsive mobile off-canvas drawer (<1024px) with backdrop overlay (`fixed inset-0 bg-black/60 z-50`), RTL chevron mirroring (`rtl:rotate-180`), active tab styling (`bg-[#F5F6FD] text-[#212B59] dark:bg-[#1b2e4b] dark:text-white font-semibold rounded-xl`), and all 7 PPE navigation epics.
   - `PageHeader.tsx`: Page title, subtitle, breadcrumbs with home icon and RTL chevrons, back button with RTL mirroring, actions bar.
   - `Layout.tsx`: Coordinates Header and Sidebar, manages mobile drawer state and desktop collapse with localStorage persistence, wraps content in 1400px boxed canvas (`max-w-[1400px] mx-auto p-4 sm:p-6 bg-[#F5F6FD] dark:bg-[#060818] min-h-screen`).
2. Implement Shared UI Components in `src/components/ui/`:
   - `Button.tsx`: Solid, outline, text, icon variants; palette (`primary` #212B59, `secondary` #805dca, `danger` #e7515a, `success` #00ab55, `warning` #e2a03f, `info` #2196f3, `dark` #3b3f5c, `white`); active scale `active:scale-[0.98]`; loading state with spinner; Tippy tooltip integration for icon buttons; full backward compatibility with legacy variant props.
   - `Input.tsx`: 40px height, `rounded-xl`, hairline borders `#E2E8F0` (dark: `#17263c`), background `#FFFFFF` (dark: `#121e32`), placeholder `#B0BEC5`, label, required asterisk, helper text, error state with Lucide AlertCircle, clear button, RTL password visibility toggle (`ltr:right-3 rtl:left-3`).
   - `Textarea.tsx`: Multi-line input with character counter (`showCount`/`maxLength`), `rounded-xl`, dark mode surfaces.
   - `Select.tsx`: Mantine Select wrapper with HSE tokens, clearable, searchable, RTL chevron placement, dual backward compatibility (supporting both Mantine `data` arrays and legacy `<option>` children).
   - `ToggleSwitch.tsx`: Directional absolute coordinates for RTL Arabic fix (no inverted toggle), sizes, custom labels.
   - `CheckboxCard.tsx` & `RadioCards.tsx`: Interactive selectable cards with checkmark indicator, active primary border `#212B59`, checked background `#F0F2FF` (dark: `dark:bg-primary/15`), responsive columns, badges.
   - `DatePicker.tsx`: Flatpickr date/time picker wrapper supporting single, range, datetime, and time modes with Lucide Calendar icon and Arabic/English locale.
   - `FileUpload.tsx`: Drag-and-drop file upload dropzone with preview cards, size formatting, validation, upload progress, remove.
   - `DataTable.tsx` & `CustomTable.tsx`: Sortable headers, directional text alignment (`ltr:text-left rtl:text-right`), hairline row dividers, hover highlight, selection checkboxes, pagination controls, empty state. Ensure full backward compatibility with all existing props used across `src/pages/`.
   - `TableActionsButtons.tsx`: Row action group (view, edit, delete, clone) wrapped in Tippy tooltips.
   - `ContainerCard.tsx`: Content container card with header, title, actions slot, body, footer, hairline border, dark surface `#0e1726`.
   - `KpiCard.tsx`: KPI metric widget with icon badge, title, formatted value, trend percentage badge, sparkline slot.
   - `StatusBadge.tsx`: Status indicator badges for PPE inventory, inspection, approval, risk categories.
   - `Modal.tsx`: Mantine Modal wrapper with header, body, sticky footer, RTL close button.
   - `SlideOverDrawer.tsx`: Bidirectional slide-over drawer fixing hardcoded `right-0` (`ltr:right-0 rtl:left-0`).
3. Implement Feedback Helpers in `src/lib/`:
   - `src/lib/swal.ts` & `src/lib/useSwal.ts`: SweetAlert2 custom styled wrappers for `showConfirm()`, `showDeleteReason()`, `showToast()`, and `showInfo()`.
4. Verification:
   - Run `npm run lint` (`tsc --noEmit`) — must pass with 0 errors.
   - Run `npm run build` — must pass with 0 errors.
   - Run `npm run build:server` — must pass with 0 errors.
   - Run `npm run test:server` — must pass with 100% assertions.
   - Run `npm run test:e2e` — must pass without regressions.
