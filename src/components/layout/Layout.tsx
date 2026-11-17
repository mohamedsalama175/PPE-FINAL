import * as React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { usePPEStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { ToastContainer } from '../ui/Toast';
import {
  LayoutDashboard, Box, Tags, Layers, MapPin, Briefcase,
  PackageSearch, ClipboardList, ShieldAlert, Settings, Trash2,
  Menu, Globe, User, LogOut, ChevronRight, ArrowRightLeft,
  Clock, Users, Upload, Sliders, History, Ruler, ScanBarcode
} from 'lucide-react';
import { Role } from '../../types';

export function Layout() {
  const { t, language, setLanguage } = useTranslation();
  const { currentUser, employees, setCurrentUser } = usePPEStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  // Phones (Store Keeper screens): the sidebar is a drawer opened from the header
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const location = useLocation();
  React.useEffect(() => setMobileNavOpen(false), [location.pathname]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const emp = employees.find(emp => emp.id === e.target.value);
    if (emp) setCurrentUser(emp);
  };

  const navItems = [
    { epic: 'Dashboard', items: [
      { to: '/', icon: LayoutDashboard, label: t('dashboard'), roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'] },
      { to: '/my-ppe', icon: ShieldAlert, label: t('myPpe'), roles: ['Employee'] },
    ]},
    { epic: 'Catalog & Structure', items: [
      { to: '/catalog', icon: Box, label: t('catalog'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/attributes', icon: Tags, label: t('attributes'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/item-groups', icon: Layers, label: t('itemGroups'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/locations', icon: MapPin, label: t('locations'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/kits', icon: Briefcase, label: t('kits'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/units', icon: Ruler, label: t('unitsOfMeasure'), roles: ['Admin', 'HSE Supervisor'] },
    ]},
    { epic: 'Inventory & Stock', items: [
      { to: '/stock', icon: PackageSearch, label: t('stock'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/adjustments', icon: ClipboardList, label: t('adjustments'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/transfers', icon: ArrowRightLeft, label: 'Transfers', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/opening-balances', icon: ClipboardList, label: 'Opening Balances', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/serials', icon: ScanBarcode, label: t('serialNumbers'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]},
    { epic: 'Operations & Custody', items: [
      { to: '/issuances', icon: ShieldAlert, label: t('issuance'), roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'] },
      { to: '/issuances/open-loans', icon: Clock, label: t('openLoans'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/replacements-due', icon: Clock, label: 'Replacements Due', roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor'] },
      { to: '/scrap', icon: Trash2, label: t('scrapAndReturns'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]},
    { epic: 'Personnel & Legacy', items: [
      { to: '/employees', icon: Users, label: 'Employee Tracking', roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor'] },
      { to: '/import-historical', icon: Upload, label: 'Historical Import', roles: ['Admin', 'HSE Supervisor'] },
    ]},
    { epic: 'System & Governance', items: [
      { to: '/settings', icon: Sliders, label: 'Module Settings', roles: ['Admin', 'HSE Supervisor'] },
      { to: '/audit-logs', icon: History, label: 'Audit Trail (G1)', roles: ['Admin', 'HSE Supervisor'] },
    ]},
  ];

  return (
    <div className="flex h-screen bg-canvas overflow-hidden font-sans">
      {/* Sidebar */}
      {mobileNavOpen && <div className="fixed inset-0 bg-ink/50 z-30 md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden />}
      <aside
        className={cn(
          "bg-ink text-white transition-all duration-300 flex-col h-full w-60",
          sidebarCollapsed ? "md:w-16" : "md:w-60",
          mobileNavOpen ? "fixed inset-y-0 start-0 z-40 flex" : "hidden md:flex"
        )}
      >
        <div className="p-5 mb-2 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded"></div>
              <span className="font-bold text-lg tracking-tight">BITWISE<span className="font-normal opacity-60">HSE</span></span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-6 h-6 bg-accent rounded mx-auto"></div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto pr-1">
          {navItems.map((group, idx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="mb-3">
                {!sidebarCollapsed && (
                  <h4 className="px-4 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    {group.epic}
                  </h4>
                )}
                <div className="flex flex-col">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) => cn(
                        "px-4 py-2 text-[12.5px] flex items-center gap-3 transition-colors",
                        isActive ? "opacity-100 bg-white/10 border-l-[3px] border-accent font-semibold" : "opacity-70 hover:opacity-100 border-l-[3px] border-transparent"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", sidebarCollapsed ? "mx-auto" : "")} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          {['Admin'].includes(currentUser.role) && (
            <NavLink to="/trash" className={({ isActive }) => cn(
              "px-4 py-2 text-[12.5px] flex items-center gap-3 transition-colors",
              isActive ? "opacity-100 bg-white/10 border-l-[3px] border-accent font-semibold" : "opacity-50 hover:opacity-100 border-l-[3px] border-transparent"
            )}>
              <Trash2 className={cn("w-4 h-4 shrink-0", sidebarCollapsed ? "mx-auto" : "")} />
              {!sidebarCollapsed && <span>{t('trashBin')} (G10)</span>}
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas h-full">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between gap-2 px-3 md:px-6 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button type="button" className="md:hidden p-2 -ms-2 text-body hover:text-ink" onClick={() => setMobileNavOpen(true)} aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline text-xs font-medium text-body capitalize">Dashboard</span>
            <span className="hidden sm:inline text-border">/</span>
            <span className="text-xs font-semibold capitalize">{location.pathname.split('/')[1] || t('overview')}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-6 min-w-0">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
              <span className="hidden sm:inline text-[11px] font-bold text-body uppercase tracking-wider">Language</span>
              <div className="flex text-[11px] font-bold border border-border rounded overflow-hidden">
                <div className={cn("px-2 py-1 transition-colors", language === 'en' ? "bg-surface" : "bg-[#F1F1EF] opacity-60")}>EN</div>
                <div className={cn("border-l border-border px-2 py-1 transition-colors", language === 'ar' ? "bg-surface" : "bg-[#F1F1EF] opacity-60")}>AR</div>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-[11px] font-bold text-body uppercase tracking-wider">Role</span>
              <select
                value={currentUser.id}
                onChange={handleRoleChange}
                className="bg-[#F1F1EF] border border-border rounded px-2.5 py-1 text-xs font-semibold focus:outline-none max-w-[9rem] sm:max-w-none"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role}){emp.status === 'Terminated' ? ' [Terminated]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-auto p-3 md:p-6">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
