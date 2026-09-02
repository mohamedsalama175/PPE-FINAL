# M2 Shell Explorer Handoff Report: Application Layout Shell Architecture

## 1. Observation

Direct investigation of the layout shell across the repository revealed the following specific findings:

### 1.1 Existing Layout Monolith (`src/components/layout/Layout.tsx`)
- `src/components/layout/Layout.tsx` (382 lines) currently bundles the entire desktop sidebar, mobile header, role switchers, simulation controls, alert banners, and page container into a single monolithic file.
- **Header Dimensions & Elements** (`Layout.tsx:233-326`):
  * Line 233: `<header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">`
  * Observed height is `h-14` (56px) rather than the required `70px` (`h-[70px]`).
  * Missing global search bar with `bg-[#F7F8FC] dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c] rounded-xl`.
  * Theme switcher (Light / Dark / System) connected to `useThemeStore` is entirely absent from the header.
  * Language switcher (lines 285-296) is a raw flex toggle without country flag indicator or dropdown styling.
  * User profile card is implemented as an unstyled raw `<select>` (lines 301-325) without an avatar badge, user details card, or popover menu.
  * Mobile drawer hamburger button is absent; mobile users cannot toggle navigation on viewports `< 1024px`.
- **Sidebar Dimensions & Breakpoint Behavior** (`Layout.tsx:125-130`):
  ```tsx
  <aside 
    className={cn(
      "bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col h-full border-r border-slate-800 z-20 shrink-0",
      sidebarCollapsed ? "w-16" : "w-64"
    )}
  >
  ```
  * Observed dimensions are `w-64` (256px) and `w-16` (64px) instead of DESIGN_SYSTEM.md's exact specifications: `260px` (`w-[260px]`) expanded and `70px` (`w-[70px]`) collapsed.
  * No responsive off-canvas mobile drawer exists for screens `< 1024px` (`lg`). On mobile, the sidebar is squeezed or cut off without an off-canvas drawer or backdrop overlay (`fixed inset-0 bg-black/60 z-50`).
  * Collapse toggle chevron (`Layout.tsx:157`): `<ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarCollapsed ? "rotate-180" : "")} />` lacks RTL mirroring (`rtl:rotate-180`).
  * NavLink styling (`Layout.tsx:206-211`) uses legacy slate/teal colors (`bg-teal-600/20 text-teal-300`) instead of DESIGN_SYSTEM.md tokens: active `bg-[#F5F6FD] text-[#212B59] dark:bg-[#1b2e4b] dark:text-white font-semibold rounded-xl` and inactive `text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] hover:text-[#212B59]`.
- **Page Container Canvas** (`Layout.tsx:372-375`):
  * Uses `max-w-7xl mx-auto h-full flex flex-col p-4 sm:p-6 bg-slate-50` instead of DESIGN_SYSTEM.md's `max-w-[1400px] mx-auto p-4 sm:p-6 bg-[#F5F6FD] dark:bg-[#060818] min-h-screen`.

### 1.2 Existing PageHeader Component (`src/components/layout/PageHeader.tsx`)
- `src/components/layout/PageHeader.tsx` (23 lines):
  * Line 11: uses hardcoded `-ml-2` on the back button (`p-2 -ml-2 rounded-full hover:bg-canvas text-body`), which creates margin disruption in RTL Arabic layouts.
  * Lacks a structured breadcrumb trail with home icon and RTL-mirrored chevrons (`<ChevronRight className="rtl:rotate-180" />`).
  * Lacks dark mode surface tokens (`dark:text-white`, `dark:text-[#888ea8]`, `dark:hover:bg-[#1b2e4b]`).

### 1.3 State Stores & Utilities
- `src/store/themeStore.ts`: Provides `useThemeStore` with `{ theme, resolvedTheme, setTheme, toggleTheme, cycleTheme }`. ThemeMode supports `'light' | 'dark' | 'system'`.
- `src/i18n/useTranslation.ts`: Provides `{ t, language, setLanguage }` with automatic synchronization of `document.documentElement.dir = 'rtl' | 'ltr'` and `document.documentElement.lang = 'ar' | 'en'`.
- `src/store/useStore.ts`: Exposes `currentUser`, `setCurrentUser`, `employees`, `selectedStoreKeeperPersonaId`, `setSelectedStoreKeeperPersonaId`, `isEmployeeMasterOnline`, `toggleEmployeeMasterStatus`, `runNightlyCronJobs`, and `locations`.
- Tool verification command `node -e ...`: Verified all Lucide icons used across Header, Sidebar, and PageHeader are valid and exported by `lucide-react@1.25.0`.
- Tool verification command `npm run build`: Confirmed zero compilation errors baseline.

---

## 2. Logic Chain

1. **Monolith Deconstruction Requirement**:
   - `Layout.tsx` currently has too many responsibilities (Sidebar navigation, header toolbar, global banners, drawer state, and route outlet).
   - Deconstructing into four modular components (`Header.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, `Layout.tsx`) isolates concerns, making Header and Sidebar independently testable and maintainable.

2. **Header Specification Alignment (`Header.tsx`)**:
   - Fixed height `h-[70px]` aligns with DESIGN_SYSTEM.md §Top Bar and provides exact alignment with Sidebar's logo box (`h-[70px]`).
   - Sticky positioning (`sticky top-0 z-30`) with `bg-white dark:bg-[#0e1726]` and `border-b border-[#E2E8F0] dark:border-[#17263c]` ensures dark theme parity and clear visual separation from the `#F5F6FD` canvas.
   - Global search bar with `Search` icon and `⌘K` badge satisfies DESIGN_SYSTEM.md §Top Bar.
   - Integrating Light / Dark / System popover connects directly to `useThemeStore`, providing immediate feedback and theme switching.
   - Integrating Language switcher (EN 🇺🇸 / AR 🇸🇦) with flag indicator calls `useTranslation().setLanguage`, automatically updating `document.documentElement.dir`.
   - Transforming the raw role `<select>` into a User Profile Avatar Card with popover elevates user experience, displays user details, role badge, persona switching for Store Keepers (Sam / Mona / Unassigned), and session logout.
   - Adding a hamburger button `<Menu />` visible only below 1024px (`lg:hidden`) allows mobile users to toggle navigation drawer.

3. **Sidebar Specification Alignment (`Sidebar.tsx`)**:
   - Desktop width of `w-[260px]` (expanded) and `w-[70px]` (collapsed) satisfies DESIGN_SYSTEM.md §Sidebar exact dimensions.
   - Off-canvas drawer with backdrop overlay (`fixed inset-0 bg-black/60 z-50`) allows full mobile navigation (<1024px) with auto-close on link navigation or backdrop click.
   - Collapse chevron mirroring (`rtl:rotate-180`) ensures arrows point in the correct semantic direction in Arabic RTL mode.
   - Active navigation item styling with `bg-[#F5F6FD] text-[#212B59] dark:bg-[#1b2e4b] dark:text-white font-semibold rounded-xl` matches DESIGN_SYSTEM.md §1.2 Surface Tokens and replaces obsolete teal/slate colors.
   - Bilingual support with Arabic and English labels ensures full localization parity.

4. **PageHeader Specification Alignment (`PageHeader.tsx`)**:
   - Incorporating breadcrumb trail with home icon and `<ChevronRight className="rtl:rotate-180" />` provides clear contextual navigation.
   - Replacing hardcoded `-ml-2` with directional `-ml-1 rtl:-ml-0 rtl:-mr-1` and mirroring the back arrow (`<ArrowLeft className="rtl:rotate-180" />`) ensures seamless RTL operation.
   - Maintaining full backwards compatibility with all existing props (`title`, `subtitle`, `description`, `action`, `actions`, `onBack`).

5. **Layout Orchestrator Alignment (`Layout.tsx`)**:
   - Manages desktop collapse persistence (`localStorage.getItem('hse_sidebar_collapsed')`).
   - Manages mobile drawer toggle (`isMobileSidebarOpen`) and auto-closes on route changes.
   - Encapsulates operational alert banners (Employee Master offline, Unassigned Store Keeper restricted access, Nightly cron feedback).
   - Enforces the 1400px boxed container: `max-w-[1400px] mx-auto p-4 sm:p-6 bg-[#F5F6FD] dark:bg-[#060818] min-h-[calc(100vh-70px)]`.

---

## 3. Caveats

1. **NotificationCenter Styling**:
   - `NotificationCenter` is an existing internal component located in `src/components/ui/NotificationCenter.tsx`. It is cleanly embedded in `Header.tsx`. If further token alignment (such as dark mode popover borders) is required for `NotificationCenter`, that falls under Milestone 2 UI components refinement.
2. **Search Action Execution**:
   - The global search bar in `Header.tsx` provides the complete input UI, visual styling, keyboard shortcut badge (`⌘K`), and clear button. Hooking global search to a unified modal/palette (e.g. Cmd+K command palette) can be added as an optional enhancement.
3. **Simulation Banners**:
   - The operational alert banners for Employee Master service and Unassigned Store Keeper are vital for demonstrating system resilience and RBAC rules. They are cleanly rendered in `Layout.tsx` directly beneath `Header.tsx` so they never displace the fixed navigation header.

---

## 4. Conclusion & Complete Implementation Guide

Below are the complete, ready-to-implement TypeScript code blocks for all four components. The proposed files are also available in `.agents/teamwork/explorer_m2_shell/` as `proposed_Header.tsx`, `proposed_Sidebar.tsx`, `proposed_PageHeader.tsx`, and `proposed_Layout.tsx`.

### 4.1 `src/components/layout/Header.tsx`

```tsx
import * as React from 'react';
import { 
  Search, Menu, X, Sun, Moon, Monitor, Wifi, WifiOff, 
  Play, ChevronDown, LogOut, Check, Command, CheckCircle2
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useThemeStore } from '../../store/themeStore';
import { Role } from '../../types';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  onToggleSidebarMobile: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onRunCronFeedback?: (feedback: string) => void;
  className?: string;
}

export function Header({
  onToggleSidebarMobile,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onRunCronFeedback,
  className
}: HeaderProps) {
  const { t, language, setLanguage } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { 
    currentUser, 
    setCurrentUser, 
    employees, 
    selectedStoreKeeperPersonaId, 
    setSelectedStoreKeeperPersonaId,
    isEmployeeMasterOnline, 
    toggleEmployeeMasterStatus,
    runNightlyCronJobs,
    locations
  } = usePPEStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const themeMenuRef = React.useRef<HTMLDivElement>(null);
  const langMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine Store Keeper's assigned location count
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    return locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser.id]);

  // Handle switching top-level Role persona
  const handleRoleSelect = (roleName: Role) => {
    if (roleName === 'Store Keeper') {
      const keeper = employees.find(e => e.id === selectedStoreKeeperPersonaId) || employees.find(e => e.role === 'Store Keeper');
      if (keeper) setCurrentUser(keeper);
    } else {
      const targetUser = employees.find(e => e.role === roleName && e.active) || employees[0];
      setCurrentUser(targetUser);
    }
  };

  const handleStoreKeeperSubSelect = (keeperId: string) => {
    setSelectedStoreKeeperPersonaId(keeperId);
  };

  const handleRunNightlyCron = () => {
    const res = runNightlyCronJobs();
    const msg = `Cron finished: ${res.reminderCount} reminders evaluated, ${res.overdueLoanCount} overdue loans flagged, ${res.autoPurgedCount} trash purged.`;
    if (onRunCronFeedback) {
      onRunCronFeedback(msg);
    }
  };

  return (
    <header 
      className={cn(
        "h-[70px] sticky top-0 z-30 bg-white dark:bg-[#0e1726] border-b border-[#E2E8F0] dark:border-[#17263c] px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors duration-200 select-none",
        className
      )}
    >
      {/* Start / Left Section: Mobile Menu Button & Global Search Bar */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button (<1024px) */}
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="p-2 -ml-1 rounded-xl text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32] hover:text-[#212B59] dark:hover:text-white transition-colors cursor-pointer lg:hidden"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-2 bg-[#F7F8FC] dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c] rounded-xl px-3 py-2 w-48 sm:w-64 md:w-80 lg:w-96 transition-all focus-within:ring-2 focus-within:ring-[#212B59]/20 focus-within:border-[#212B59] dark:focus-within:border-white/30">
            <Search className="w-4 h-4 text-[#8A9AAF] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث عام (المعدات، الموظفين، العمليات)...' : 'Global search (Items, Employees, Ops)...'}
              className="w-full bg-transparent text-xs sm:text-sm text-[#1E293B] dark:text-white placeholder:text-[#B0BEC5] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#8A9AAF] hover:text-[#1E293B] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#8A9AAF] bg-white dark:bg-[#181f32] border border-[#E2E8F0] dark:border-[#17263c] rounded-md shadow-2xs">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* End / Right Section: Simulation Controls, Notifications, Theme, Language, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulation 1: Employee Master Service Status Toggle */}
        <button
          type="button"
          onClick={toggleEmployeeMasterStatus}
          className={cn(
            "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs",
            isEmployeeMasterOnline
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/80 hover:bg-red-100 dark:hover:bg-red-950/60 animate-pulse"
          )}
          title="Toggle Employee Master Connection (Simulate Outage & Cached Mode)"
        >
          {isEmployeeMasterOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Master: Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Master: Cached</span>
            </>
          )}
        </button>

        {/* Simulation 2: Run Nightly Cron Jobs Button */}
        <button
          type="button"
          onClick={handleRunNightlyCron}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F6FD] dark:bg-[#1b2e4b] text-[#212B59] dark:text-slate-200 border border-[#E2E8F0] dark:border-[#17263c] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
          title="Simulate Running Nightly Background Cron (Reminders, Overdue Loans, Trash Purge)"
        >
          <Play className="w-3 h-3 text-[#805dca] fill-current" />
          <span>Nightly Jobs</span>
        </button>

        {/* In-App Notification Center */}
        <NotificationCenter />

        {/* Theme Switcher Popover (Light / Dark / System) */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setThemeMenuOpen(prev => !prev)}
            className="p-2 rounded-xl text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32] hover:text-[#212B59] dark:hover:text-white border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#17263c] transition-all cursor-pointer shadow-2xs"
            title={`Current theme: ${theme} (${resolvedTheme})`}
            aria-label="Toggle theme mode"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-warning" />
            ) : (
              <Sun className="w-4 h-4 text-warning" />
            )}
          </button>

          {themeMenuOpen && (
            <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-36 rounded-xl bg-white dark:bg-[#0e1726] border border-[#E2E8F0] dark:border-[#17263c] shadow-lg py-1 z-50 text-xs">
              <button
                type="button"
                onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-start transition-colors cursor-pointer",
                  theme === 'light' 
                    ? "bg-[#F5F6FD] text-[#212B59] font-bold dark:bg-[#1b2e4b] dark:text-white" 
                    : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32]"
                )}
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-warning" /> Light
                </span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-start transition-colors cursor-pointer",
                  theme === 'dark' 
                    ? "bg-[#F5F6FD] text-[#212B59] font-bold dark:bg-[#1b2e4b] dark:text-white" 
                    : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32]"
                )}
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-warning" /> Dark
                </span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => { setTheme('system'); setThemeMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-start transition-colors cursor-pointer",
                  theme === 'system' 
                    ? "bg-[#F5F6FD] text-[#212B59] font-bold dark:bg-[#1b2e4b] dark:text-white" 
                    : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32]"
                )}
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-info" /> System
                </span>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Language Switcher Dropdown (en / ar with Flag Indicator) */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#17263c] bg-[#F7F8FC] dark:bg-[#121e32] text-xs font-bold text-[#212B59] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            title="Switch Language & Direction"
          >
            <span className="text-sm leading-none">{language === 'en' ? '🇺🇸' : '🇸🇦'}</span>
            <span className="uppercase">{language}</span>
            <ChevronDown className="w-3 h-3 text-[#8A9AAF]" />
          </button>

          {langMenuOpen && (
            <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-32 rounded-xl bg-white dark:bg-[#0e1726] border border-[#E2E8F0] dark:border-[#17263c] shadow-lg py-1 z-50 text-xs">
              <button
                type="button"
                onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-start transition-colors cursor-pointer",
                  language === 'en'
                    ? "bg-[#F5F6FD] text-[#212B59] font-bold dark:bg-[#1b2e4b] dark:text-white"
                    : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span>🇺🇸</span> English
                </span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => { setLanguage('ar'); setLangMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-start transition-colors cursor-pointer font-sans",
                  language === 'ar'
                    ? "bg-[#F5F6FD] text-[#212B59] font-bold dark:bg-[#1b2e4b] dark:text-white"
                    : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] dark:hover:bg-[#181f32]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span>🇸🇦</span> العربية
                </span>
                {language === 'ar' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar Card & Dropdown Popover */}
        <div className="relative pl-1 rtl:pl-0 rtl:pr-1" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F5F6FD] dark:hover:bg-[#181f32] transition-colors cursor-pointer"
            aria-label="Open User Menu"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#212B59] to-[#805dca] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white dark:ring-[#0e1726]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-start leading-tight">
              <span className="text-xs font-bold text-[#1E293B] dark:text-white truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-[#8A9AAF] truncate">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#8A9AAF] hidden md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-72 rounded-xl bg-white dark:bg-[#0e1726] border border-[#E2E8F0] dark:border-[#17263c] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#17263c]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#212B59] to-[#805dca] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1E293B] dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-[#8A9AAF] font-mono">{currentUser.employeeCode || 'EMP-001'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#212B59]/10 text-[#212B59] dark:bg-[#1b2e4b] dark:text-white">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Simulation Switcher: Active Role */}
              <div className="py-2.5 border-b border-[#E2E8F0] dark:border-[#17263c] space-y-1.5">
                <span className="text-[10px] font-bold text-[#8A9AAF] uppercase tracking-wider block">
                  Switch Active Role Persona
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Admin', 'HSE Supervisor', 'Store Keeper', 'Direct Supervisor'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[11px] font-semibold text-start transition-all cursor-pointer border",
                        currentUser.role === r
                          ? "bg-[#212B59] text-white border-[#212B59] dark:bg-white dark:text-[#060818] dark:border-white shadow-2xs"
                          : "bg-[#F7F8FC] dark:bg-[#121e32] text-[#506690] dark:text-[#888ea8] border-[#E2E8F0] dark:border-[#17263c] hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {r === 'Admin' && 'Admin'}
                      {r === 'HSE Supervisor' && 'HSE Super'}
                      {r === 'Store Keeper' && 'Store Keeper'}
                      {r === 'Direct Supervisor' && 'Direct Super'}
                    </button>
                  ))}
                </div>

                {/* Sub-Selector for Store Keeper persona */}
                {currentUser.role === 'Store Keeper' && (
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
                      Store Keeper Warehouse Persona
                    </label>
                    <select
                      value={selectedStoreKeeperPersonaId}
                      onChange={(e) => handleStoreKeeperSubSelect(e.target.value)}
                      className="w-full bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="emp-8">Sam (Cairo Stores)</option>
                      <option value="emp-11">Mona (Alexandria Stores)</option>
                      <option value="emp-13">Unassigned Keeper (0 Locs - Blocked)</option>
                    </select>

                    {/* Scope Summary Badge */}
                    <p className="mt-1.5 text-[11px] text-[#64748B] dark:text-[#888ea8]">
                      {assignedLocations.length > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Assigned: {assignedLocations.map(l => l.nameEn).join(', ')}
                        </span>
                      ) : (
                        <span className="text-danger font-semibold">
                          Access Blocked: 0 Assigned Locations
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    const defaultAdmin = employees.find(e => e.role === 'Admin') || employees[0];
                    setCurrentUser(defaultAdmin);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-danger hover:bg-danger-light/30 dark:hover:bg-red-950/40 font-semibold transition-colors cursor-pointer text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تسجيل الخروج (إعادة تعيين الجلسة)' : 'Log Out (Reset Active Session)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default Header;
```

---

### 4.2 `src/components/layout/Sidebar.tsx`

```tsx
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Box, Tags, Layers, MapPin, Briefcase, 
  PackageSearch, ClipboardList, ShieldAlert, Settings, Trash2, 
  ArrowRightLeft, Users, Clock, ShieldCheck, AlertTriangle, 
  ChevronLeft, X, FileSpreadsheet
} from 'lucide-react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Role } from '../../types';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  className?: string;
}

interface NavItemConfig {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelAr: string;
  roles: Role[];
  exact?: boolean;
}

interface NavGroupConfig {
  titleEn: string;
  titleAr: string;
  items: NavItemConfig[];
}

// 7 Primary Navigation Epics for Enterprise HSE Operations
const NAV_GROUPS: NavGroupConfig[] = [
  {
    titleEn: 'Analytics & Dashboards',
    titleAr: 'التحليلات ولوحات المعلومات',
    items: [
      { to: '/', icon: LayoutDashboard, labelEn: 'PPE Dashboard', labelAr: 'لوحة قيادة معدات الوقاية', roles: ['Admin', 'HSE Supervisor', 'Store Keeper', 'Direct Supervisor'], exact: true },
    ]
  },
  {
    titleEn: 'PPE Catalog & Master Data',
    titleAr: 'كتالوج المعدات والبيانات الأساسية',
    items: [
      { to: '/catalog', icon: Box, labelEn: 'PPE Catalog', labelAr: 'كتالوج معدات الوقاية', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/attributes', icon: Tags, labelEn: 'Attributes & Values', labelAr: 'السمات والمواصفات', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/item-groups', icon: Layers, labelEn: 'Item Groups', labelAr: 'مجموعات العناصر', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/kits', icon: Briefcase, labelEn: 'Job-Specific Kits', labelAr: 'أطقم الوظائف المحددة', roles: ['Admin', 'HSE Supervisor'] },
    ]
  },
  {
    titleEn: 'Locations & Access Control',
    titleAr: 'المواقع وإدارة الصلاحيات',
    items: [
      { to: '/locations', icon: MapPin, labelEn: 'Warehouse Locations', labelAr: 'مواقع المستودعات', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/settings/store-keeper-assignments', icon: ShieldCheck, labelEn: 'Store Keeper Access Matrix', labelAr: 'مصفوفة وصول أمناء المخازن', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/stock', icon: PackageSearch, labelEn: 'Stock Levels & Alerts', labelAr: 'مستويات المخزون والتنبيهات', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/transfers', icon: ArrowRightLeft, labelEn: 'Stock Transfers', labelAr: 'مناقلات المخزون', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]
  },
  {
    titleEn: 'Stock Management',
    titleAr: 'إدارة وتعديل المخزون',
    items: [
      { to: '/stock/adjustments', icon: ClipboardList, labelEn: 'Stock Adjustments (OB/IN/OUT)', labelAr: 'تعديلات المخزون (افتتاحي/وارد/صادر)', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]
  },
  {
    titleEn: 'Issuances, Returns & Loans',
    titleAr: 'الصرف والمرتجعات والإعارات',
    items: [
      { to: '/issuances', icon: ShieldAlert, labelEn: 'Employee Issuances', labelAr: 'صرف معدات الموظفين', roles: ['Admin', 'HSE Supervisor', 'Store Keeper', 'Direct Supervisor'] },
      { to: '/issuances/open-loans', icon: Clock, labelEn: 'Visitor & Contractor Loans', labelAr: 'قروض الزوار والمقاولين', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/issuances/replacements-due', icon: AlertTriangle, labelEn: 'Replacements Due', labelAr: 'الاستبدالات المستحقة', roles: ['Admin', 'HSE Supervisor', 'Store Keeper', 'Direct Supervisor'] },
    ]
  },
  {
    titleEn: 'Personnel & Historical Data',
    titleAr: 'شؤون الموظفين والبيانات التاريخية',
    items: [
      { to: '/employees', icon: Users, labelEn: 'Employee Directory & Timeline', labelAr: 'دليل الموظفين والسجل الزمني', roles: ['Admin', 'HSE Supervisor', 'Store Keeper', 'Direct Supervisor'] },
      { to: '/employees/historical-import', icon: FileSpreadsheet, labelEn: 'Import Historical Issuances', labelAr: 'استيراد السجلات السابقة', roles: ['Admin'] },
    ]
  },
  {
    titleEn: 'System Foundation',
    titleAr: 'إدارة وتأسيس النظام',
    items: [
      { to: '/trash', icon: Trash2, labelEn: 'Shared Trash Bin', labelAr: 'سلة المهملات المشتركة', roles: ['Admin'] },
      { to: '/audit-logs', icon: ShieldCheck, labelEn: 'Immutable Audit Log', labelAr: 'سجل التدقيق غير القابل للتعديل', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/settings', icon: Settings, labelEn: 'Module Settings', labelAr: 'إعدادات النظام', roles: ['Admin'] },
    ]
  }
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  className
}: SidebarProps) {
  const { language } = useTranslation();
  const { currentUser, locations } = usePPEStore();

  const isRtl = language === 'ar';
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    return locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser.id]);

  const isUnassignedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Render Inner Navigation Content (Shared across Desktop & Mobile)
  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Brand Logo Box: Exactly 70px height to align with Header */}
      <div className="h-[70px] border-b border-[#E2E8F0] dark:border-[#17263c] px-4 flex items-center justify-between shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#212B59] to-[#805dca] flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
              HSE
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base tracking-tight text-[#212B59] dark:text-white block">
                SPARK <span className="font-normal text-[#805dca]">PPE</span>
              </span>
              <span className="text-[10px] text-[#8A9AAF] font-mono tracking-wider uppercase">
                ENTERPRISE HSE
              </span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#212B59] to-[#805dca] flex items-center justify-center font-black text-white text-sm shadow-md mx-auto">
            HSE
          </div>
        )}

        {/* Desktop Collapse Toggle Button (Hidden on Mobile) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-[#8A9AAF] hover:text-[#212B59] dark:hover:text-white hover:bg-[#F5F6FD] dark:hover:bg-[#181f32] transition-colors cursor-pointer"
          title={collapsed ? (isRtl ? "توسيع القائمة" : "Expand sidebar") : (isRtl ? "طي القائمة" : "Collapse sidebar")}
          aria-label="Toggle Sidebar Collapse"
        >
          <ChevronLeft 
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              isRtl 
                ? (collapsed ? "rotate-0" : "rotate-180")
                : (collapsed ? "rotate-180" : "rotate-0")
            )} 
          />
        </button>

        {/* Mobile Close Button (<1024px) */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#8A9AAF] hover:text-[#212B59] dark:hover:text-white hover:bg-[#F5F6FD] dark:hover:bg-[#181f32] transition-colors cursor-pointer"
          aria-label="Close sidebar drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Session User Scope Indicator Card */}
      {!collapsed ? (
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-[#F7F8FC] dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c] text-xs shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary dark:text-primary-light">
              {isRtl ? 'الجلسة النشطة' : 'Active Session'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#212B59]/10 text-[#212B59] dark:bg-[#1b2e4b] dark:text-white">
              {currentUser.role}
            </span>
          </div>
          <p className="font-bold text-[#1E293B] dark:text-white mt-1 truncate">{currentUser.name}</p>
          <p className="text-[11px] text-[#64748B] dark:text-[#888ea8] truncate">
            {currentUser.role === 'Store Keeper' ? (
              isUnassignedKeeper ? (
                <span className="text-danger font-semibold">
                  {isRtl ? '0 مواقع معينة (محظور)' : '0 Assigned Locs (Blocked)'}
                </span>
              ) : (
                <span>{assignedLocations.map(l => isRtl ? (l.nameAr || l.nameEn) : l.nameEn).join(', ')}</span>
              )
            ) : (
              <span>{isRtl ? 'نطاق النظام العام' : 'Global System Scope'}</span>
            )}
          </p>
        </div>
      ) : (
        <div className="flex justify-center my-2 shrink-0" title={`${currentUser.name} (${currentUser.role})`}>
          <div className="w-8 h-8 rounded-lg bg-[#212B59]/10 dark:bg-[#1b2e4b] text-[#212B59] dark:text-white flex items-center justify-center font-bold text-xs ring-1 ring-[#E2E8F0] dark:ring-[#17263c]">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      )}

      {/* Scrollable Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3 custom-scrollbar">
        {NAV_GROUPS.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed ? (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A9AAF] dark:text-[#888ea8] pt-1">
                  {isRtl ? group.titleAr : group.titleEn}
                </h4>
              ) : (
                <div className="border-t border-[#E2E8F0]/80 dark:border-[#17263c] my-2 mx-1" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={onCloseMobile}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group cursor-pointer",
                      isActive 
                        ? "bg-[#F5F6FD] text-[#212B59] dark:bg-[#1b2e4b] dark:text-white font-semibold shadow-2xs" 
                        : "text-[#506690] dark:text-[#888ea8] hover:bg-[#F5F6FD] hover:text-[#212B59] dark:hover:bg-[#181f32] dark:hover:text-white",
                      collapsed && "justify-center px-0 py-2.5"
                    )}
                    title={collapsed ? (isRtl ? item.labelAr : item.labelEn) : undefined}
                  >
                    <item.icon className="w-4 h-4 shrink-0 transition-colors text-inherit" />
                    {!collapsed && (
                      <span className="truncate">{isRtl ? item.labelAr : item.labelEn}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#17263c] text-[10px] text-[#8A9AAF] font-mono text-center shrink-0">
        {!collapsed ? (
          <span>Bitwise HSE Spark • 2026</span>
        ) : (
          <span>•</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (>= 1024px) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 z-40 bg-white dark:bg-[#0e1726] border-r rtl:border-r-0 rtl:border-l border-[#E2E8F0] dark:border-[#17263c] transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[70px]" : "w-[260px]",
          className
        )}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* 2. Mobile Off-Canvas Drawer Backdrop (< 1024px) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Off-Canvas Drawer (< 1024px) */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 w-[260px] bg-white dark:bg-[#0e1726] shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out",
          isRtl
            ? (isMobileOpen ? "right-0 translate-x-0" : "right-0 translate-x-full")
            : (isMobileOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full")
        )}
        aria-label="Mobile Navigation Drawer"
      >
        {renderSidebarContent(false)}
      </aside>
    </>
  );
}
export default Sidebar;
```

---

### 4.3 `src/components/layout/PageHeader.tsx`

```tsx
import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs,
  action,
  actions,
  onBack,
  className
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  const displayAction = action || actions;

  return (
    <div className={cn("mb-6 space-y-2 select-none", className)}>
      {/* Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#8A9AAF] flex-wrap">
          <Link 
            to="/" 
            className="hover:text-[#212B59] dark:hover:text-white transition-colors flex items-center gap-1 p-0.5 rounded"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-[#8A9AAF] rtl:rotate-180 shrink-0" />
                {crumb.href && !isLast ? (
                  <Link 
                    to={crumb.href} 
                    className="hover:text-[#212B59] dark:hover:text-white transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(
                    isLast 
                      ? "font-semibold text-[#212B59] dark:text-white" 
                      : "font-medium text-[#64748B] dark:text-[#888ea8]"
                  )}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Title, Subtitle and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title + Back Button Group */}
        <div className="flex items-start sm:items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-xl text-[#506690] dark:text-[#888ea8] hover:bg-white dark:hover:bg-[#1b2e4b] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#17263c] hover:text-[#212B59] dark:hover:text-white transition-all cursor-pointer shadow-2xs shrink-0"
              title="Back"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 shrink-0" />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E293B] dark:text-white font-sans">
              {title}
            </h1>
            {displaySubtitle && (
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#888ea8] mt-1 leading-relaxed">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right / Start Action Buttons */}
        {displayAction && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            {displayAction}
          </div>
        )}
      </div>
    </div>
  );
}
export default PageHeader;
```

---

### 4.4 `src/components/layout/Layout.tsx`

```tsx
import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { usePPEStore } from '../../store/useStore';
import { AlertTriangle, AlertOctagon, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Layout() {
  const location = useLocation();
  const { 
    currentUser, 
    locations,
    isEmployeeMasterOnline, 
    toggleEmployeeMasterStatus 
  } = usePPEStore();

  // Desktop sidebar collapsed state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('hse_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer open state (<1024px)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState<boolean>(false);

  // Temporary feedback toast/banner from running nightly cron jobs
  const [cronFeedback, setCronFeedback] = React.useState<string | null>(null);

  // Synchronize desktop collapse state to localStorage
  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hse_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  // Close mobile drawer automatically when navigating between pages
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Determine Store Keeper's assigned location status
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    return locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser.id]);

  const isUnassignedKeeper = isStoreKeeper && assignedLocations.length === 0;

  const handleCronFeedback = (msg: string) => {
    setCronFeedback(msg);
    setTimeout(() => setCronFeedback(null), 5000);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F6FD] dark:bg-[#060818] text-[#1E293B] dark:text-white font-sans antialiased overflow-x-hidden select-none">
      {/* 1. Responsive Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header: Exactly 70px height, fixed/sticky at top, z-30 */}
        <Header
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(prev => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          onRunCronFeedback={handleCronFeedback}
        />

        {/* Global Operational Alert Banners */}
        {/* Banner A: Employee Master Service Unreachable Warning */}
        {!isEmployeeMasterOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-amber-600 shadow-xs shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>
                Employee Master service is temporarily unreachable. Operating in Cached Mode. Personnel records are marked <strong>'Unverified'</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={toggleEmployeeMasterStatus}
              className="text-[11px] underline hover:text-black font-extrabold cursor-pointer"
            >
              Restore Connection
            </button>
          </div>
        )}

        {/* Banner B: Store Keeper Unassigned Location Warning */}
        {isUnassignedKeeper && (
          <div className="bg-red-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-white shrink-0" />
              <span>
                You are logged in as an Unassigned Store Keeper (0 locations assigned). Access to stock levels, transfers, issuances, and warehouse operations is strictly blocked.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded font-mono">
              Access Restricted
            </span>
          </div>
        )}

        {/* Banner C: Nightly Background Cron Feedback Banner */}
        {cronFeedback && (
          <div className="bg-[#805dca] text-white px-4 py-2 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in shadow-xs">
            <Sparkles className="w-4 h-4 text-purple-200 shrink-0" />
            <span>{cronFeedback}</span>
          </div>
        )}

        {/* 3. Boxed Page Container Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5F6FD] dark:bg-[#060818] min-h-[calc(100vh-70px)]">
          <div className="max-w-[1400px] mx-auto h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global In-App Toast Container */}
      <ToastContainer />
    </div>
  );
}
export default Layout;
```

---

## 5. Verification Method

To independently verify the architecture and implementation:

1. **File Inspection**:
   - Verify that all four proposed files exist in `.agents/teamwork/explorer_m2_shell/`:
     * `proposed_Header.tsx`
     * `proposed_Sidebar.tsx`
     * `proposed_PageHeader.tsx`
     * `proposed_Layout.tsx`
   - Inspect the imports and verify full compatibility with `src/store/themeStore.ts`, `src/i18n/useTranslation.ts`, and `src/store/useStore.ts`.

2. **TypeScript Compilation & Packaging Check**:
   - Run the client build command:
     ```bash
     npm run build
     ```
   - Must complete with zero TypeScript (`tsc`) and Vite packaging errors.

3. **Backend & Test Verification**:
   - Run the server build:
     ```bash
     npm run build:server
     ```
   - Run test suites to ensure zero regressions:
     ```bash
     npm run test:server
     ```

4. **Visual & Behavioral Invalidation Conditions**:
   - Header height is not exactly 70px (`h-[70px]`) -> INVALID
   - Sidebar desktop width is not 260px expanded / 70px collapsed -> INVALID
   - Mobile screen (<1024px) fails to toggle off-canvas drawer with backdrop overlay -> INVALID
   - Switching language to Arabic does not mirror sidebar position, chevrons (`rtl:rotate-180`), or breadcrumb chevrons -> INVALID
   - Page container width exceeds 1400px or fails `#F5F6FD` / `#060818` background colors -> INVALID
