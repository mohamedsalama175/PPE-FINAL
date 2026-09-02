import * as React from 'react';
import { 
  Search, Menu, X, Sun, Moon, Monitor, Wifi, WifiOff, 
  Play, ChevronDown, LogOut, User, Check, Command, 
  Shield, Building, CheckCircle2
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
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
                    // Reset to default admin or trigger logout flow
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
