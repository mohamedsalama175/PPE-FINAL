import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { CommandPalette } from '../ui/CommandPalette';
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

  // Command Palette Open state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="flex min-h-screen bg-[#F5F6FD] text-[#1E293B] font-sans antialiased overflow-x-hidden select-none">
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
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5F6FD] min-h-[calc(100vh-70px)]">
          <div className="max-w-[1400px] mx-auto h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Global In-App Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default Layout;
