# Original User Request

## Initial Request — 2026-11-09T16:00:31Z

Apply the HSE front-end design system specification in DESIGN_SYSTEM.md across the PPE-FINAL project for production use, updating styling foundations, shared components, and application views.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
Integrity mode: development

## Requirements

### R1. Design System Foundation, Tokens, and Dependencies
Configure styling tokens and themes according to DESIGN_SYSTEM.md, including brand and semantic color palettes (primary `#212B59`, canvas `#F5F6FD`, slate borders `#E2E8F0`, and dark mode tokens), the Almarai typography scale with Google Fonts loading, spacing, border radii, and box shadows. Install and integrate specified UI packages (such as `@mantine/core`, `@mantine/dates`, `@tippyjs/react`, `sweetalert2`, and `react-flatpickr`) required for the design system.

### R2. Shared Components and Application Layout Shell
Implement or adapt shared UI components and application shell layout to match DESIGN_SYSTEM.md specifications. This includes header, responsive sidebar navigation (supporting expanded and collapsed states), standard button variants and states, form controls (inputs, textareas, checkboxes, radio cards, switches, date/time pickers, and file upload dropzones), and data tables with sortable headers, row selection, and action buttons.

### R3. Project-Wide View Conformance and Localization
Align all existing pages, dashboard cards, KPI widgets, and modals with DESIGN_SYSTEM.md design standards. Ensure consistent behavior across light and dark modes as well as full bilingual support for Arabic (RTL) and English (LTR) layouts with proper text direction and font rendering.

## Acceptance Criteria

### Design Tokens & Foundation
- [ ] Tailwind configuration and CSS theme layers define the complete color palette (primary, secondary, status badges, dark mode mappings), spacing, border radii, and shadows specified in DESIGN_SYSTEM.md.
- [ ] Almarai font family is loaded via Google Fonts and applied globally across both LTR and RTL layouts.
- [ ] Required UI packages (@mantine/core, @mantine/dates, @tippyjs/react, sweetalert2, react-flatpickr) are installed and integrated cleanly.

### Component & Layout Conformance
- [ ] Shared button components support solid, outline, text, and icon variants with specified hover, active, focus, and disabled states.
- [ ] Form controls match the visual styling, dimensions, borders, helper text, and error states defined in DESIGN_SYSTEM.md.
- [ ] Data tables and grids adhere to specified header styling, row borders, hover states, selection checkboxes, and action button tooltips.
- [ ] Application layout shell (Header, Sidebar, container padding, responsive breakpoints) conforms to DESIGN_SYSTEM.md layout specifications.
- [ ] All existing project pages, cards, and modal dialogs render consistently using the design system in both light and dark themes.
- [ ] Arabic (RTL) and English (LTR) layouts render correctly with appropriate text alignment, chevron positions, and directional spacing.

### Build & Test Verification
- [ ] Client application build (`npm run build`) completes with zero TypeScript or packaging compilation errors.
- [ ] Server application build (`npm run build:server`) completes with zero errors.
- [ ] Existing automated tests (`npm run test:server` and `npm run test:e2e`) continue to pass without regressions.
