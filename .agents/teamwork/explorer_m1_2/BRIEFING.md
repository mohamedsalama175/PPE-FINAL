# BRIEFING — 2026-11-09T16:25:00Z

## Mission
Investigate and produce an exact, production-ready implementation plan for Google Fonts Almarai typography loading and Tailwind CSS v4 design tokens in index.html and src/index.css for Milestone 1.

## 🔒 My Identity
- Archetype: explorer
- Roles: M1 Tokens & Typography Explorer
- Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
- State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_2\
- Original parent: 6528d93b-4eaa-42a1-894e-9658ab2f9b68
- Milestone: Milestone 1 (Design System Foundation, Tokens, and Dependencies)

## 🔒 Key Constraints
- Read-only investigation — do NOT modify project source files directly.
- Prepare exact implementation plan with concrete code snippets for index.html and src/index.css.
- Adhere strictly to Tailwind CSS v4 @theme block syntax, CSS variable architecture, dark mode `@variant`, and Arabic RTL typography.

## Current Parent
- Conversation ID: 6528d93b-4eaa-42a1-894e-9658ab2f9b68
- Updated: 2026-11-09T16:19:21Z

## Investigation State
- **Explored paths**: `index.html`, `src/index.css`, `package.json`, `src/i18n/useTranslation.ts`, `src/main.tsx`, `DESIGN_SYSTEM.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md`, `spec_miner_design_system/handoff.md`, `explorer_foundations/handoff.md`.
- **Key findings**:
  1. `index.html` lacks preconnect and Google Fonts Almarai links. Full weight loading (300, 400, 500, 600, 700, 800) is specified to avoid synthetic browser font scaling. Initial `dir="ltr"` and `lang="en"` with HSE titles and meta added.
  2. `src/index.css` operates on Tailwind CSS v4 (`@theme`). Formulated a dual-tier token architecture: dynamic CSS variables in `:root` and `.dark` (`--canvas`, `--panel`, `--border`, `--text-primary`) mapped to `@theme` aliases, alongside explicit color tokens (Primary `#212B59`, Canvas `#F5F6FD` / `#060818`, Panel `#FFFFFF` / `#0e1726`, Slate Borders `#E2E8F0` / `#17263c`, Secondary `#805dca`, and Semantic scales).
  3. Spacing (`4.5` = `18px`, sidebar `260px`, header `70px`), border radii (`rounded-xl` 12px, `rounded-lg` 8px), shadows, and z-index (10 to 60) registered in `@theme`.
  4. Base styling handles Almarai font smoothing, custom scrollbars, select chevron RTL relocation, and LTR code block protection. Component classes for `.panel`, `.form-input`, `.form-textarea`, `.btn`, and `.badge` established.
- **Unexplored areas**: None for M1 Tokens & Typography scope.

## Key Decisions Made
- Prepared drop-in ready replacements for both `index.html` and `src/index.css` in `handoff.md`.
- Kept third-party vendor CSS imports commented out with clear instructions to enable them immediately after `npm install`.
- Retained backwards-compatible color aliases (`--color-ink`, `--color-body`, `--color-accent`) to prevent breakage of existing views.

## Artifact Index
- d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_2\handoff.md — Final implementation plan report
- d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_2\progress.md — Execution heartbeat and progress log
