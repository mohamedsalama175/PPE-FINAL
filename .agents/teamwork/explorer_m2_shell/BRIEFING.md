# BRIEFING — 2026-11-11T08:52:00Z

## Mission
Investigate and design the exact architecture and implementation guide for the Application Layout Shell (Header, Sidebar, PageHeader, Layout) with full RTL/LTR, dark/light theme, Lucide icons, responsive drawer, user profile popover, and translation bindings.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, architectural design, component specification
- Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
- State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_shell
- Original parent: 6528d93b-4eaa-42a1-894e-9658ab2f9b68
- Milestone: Milestone 2 - Shared UI Components and Application Layout Shell

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in `src/`
- All specifications and code proposals in `handoff.md` and state folder
- Strictly adhere to DESIGN_SYSTEM.md and PROJECT.md tokens and patterns

## Current Parent
- Conversation ID: 6528d93b-4eaa-42a1-894e-9658ab2f9b68
- Updated: 2026-11-11T08:52:00Z

## Investigation State
- **Explored paths**:
  * `src/components/layout/Layout.tsx` (382 lines monolithic layout)
  * `src/components/layout/PageHeader.tsx` (23 lines)
  * `src/store/themeStore.ts` (Zustand theme store with light, dark, system support)
  * `src/i18n/useTranslation.ts` & `translations.ts` (Bilingual LTR/RTL support)
  * `src/store/useStore.ts` & `src/types/index.ts` (State, RBAC, and Personas)
  * `src/components/ui/NotificationCenter.tsx` & `Toast.tsx`
  * `src/App.tsx` & `src/pages/*.tsx` (Router & PageHeader call sites)
- **Key findings**:
  * Layout is currently monolithic in `Layout.tsx`, mixing Header, Sidebar, simulation toggles, and page wrappers with hardcoded Tailwind slate/teal colors and fixed breakpoints without mobile drawer support.
  * Header lacks required 70px height (`h-[70px]`), global search bar, theme toggle, and styled user profile popover card.
  * Sidebar uses `w-64`/`w-16` instead of DESIGN_SYSTEM-specified `w-[260px]` and `w-[70px]`, lacks mobile drawer overlay (`<1024px`), and lacks RTL chevron mirroring.
  * PageHeader uses hardcoded `-ml-2` that breaks RTL Arabic alignment.
- **Unexplored areas**: None. Complete deconstruction architecture and copy-pasteable TypeScript code files prepared.

## Key Decisions Made
- Deconstruct `Layout.tsx` into 4 modular components:
  1. `Header.tsx`: 70px height, global search bar, simulation tools, notification center, theme mode popover (Light/Dark/System), language switcher (EN/AR with flag), and user profile card with persona switcher & logout.
  2. `Sidebar.tsx`: 260px expanded / 70px collapsed desktop navigation, responsive off-canvas mobile drawer with backdrop overlay (<1024px), RTL chevron mirroring (`rtl:rotate-180`), active indicator (`bg-[#F5F6FD] text-[#212B59] dark:bg-[#1b2e4b] dark:text-white`), and bilingual 7 navigation epics.
  3. `PageHeader.tsx`: Title, subtitle/description, breadcrumb trail with home icon and RTL chevrons, back button with RTL mirroring, and flexible action bar.
  4. `Layout.tsx`: Coordinates Header and Sidebar, manages mobile drawer & desktop collapse state with localStorage persistence, houses global operational alert banners, boxed container (`max-w-[1400px] bg-[#F5F6FD] dark:bg-[#060818]`), and ToastContainer.
- Preserved proposed implementation files in `.agents/teamwork/explorer_m2_shell/`:
  * `proposed_Header.tsx`
  * `proposed_Sidebar.tsx`
  * `proposed_PageHeader.tsx`
  * `proposed_Layout.tsx`

## Artifact Index
- `DISPATCH.md` — Inbound message log
- `BRIEFING.md` — Situational awareness
- `progress.md` — Heartbeat & status
- `proposed_Header.tsx` — Complete implementation of Header component
- `proposed_Sidebar.tsx` — Complete implementation of Sidebar component
- `proposed_PageHeader.tsx` — Complete implementation of PageHeader component
- `proposed_Layout.tsx` — Complete implementation of Layout orchestrator
- `handoff.md` — Final 5-component report
