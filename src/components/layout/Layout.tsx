import * as React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { usePPEStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { ToastContainer } from '../ui/Toast';
import { Select } from '../ui/Select';
import { 
  LayoutDashboard, Box, Tags, Layers, MapPin, Briefcase, 
  PackageSearch, ClipboardList, ShieldAlert, Settings, Trash2, 
  Menu, Globe, User, LogOut, ChevronRight, ArrowRightLeft
} from 'lucide-react';
import { Role } from '../../types';

export function Layout() {
  const { t, language, setLanguage } = useTranslation();
  const { currentUser, employees, setCurrentUser } = usePPEStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const location = useLocation();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const emp = employees.find(emp => emp.id === e.target.value);
    if (emp) setCurrentUser(emp);
  };

  const navItems = [
    { epic: 'Dashboard', items: [
      { to: '/', icon: LayoutDashboard, label: t('dashboard'), roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'] },
      { to: '/my-ppe', icon: ShieldAlert, label: t('myPpe'), roles: ['Employee'] },
    ]},
    { epic: 'Catalog', items: [
      { to: '/catalog', icon: Box, label: t('catalog'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/attributes', icon: Tags, label: t('attributes'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/item-groups', icon: Layers, label: t('itemGroups'), roles: ['Admin', 'HSE Supervisor'] },
    ]},
    { epic: 'Locations & Kits', items: [
      { to: '/locations', icon: MapPin, label: t('locations'), roles: ['Admin', 'HSE Supervisor'] },
      { to: '/kits', icon: Briefcase, label: t('kits'), roles: ['Admin', 'HSE Supervisor'] },
    ]},
    { epic: 'Inventory', items: [
      { to: '/stock', icon: PackageSearch, label: t('stock'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/adjustments', icon: ClipboardList, label: t('adjustments'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/transfers', icon: ArrowRightLeft, label: 'Transfers', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/stock/opening-balances', icon: ClipboardList, label: 'Opening Balances', roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]},
    { epic: 'Operations', items: [
      { to: '/issuances', icon: ShieldAlert, label: t('issuance'), roles: ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'] },
      { to: '/issuances/open-loans', icon: Clock, label: t('openLoans'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
      { to: '/scrap', icon: Trash2, label: t('scrapAndReturns'), roles: ['Admin', 'HSE Supervisor', 'Store Keeper'] },
    ]},
    { epic: 'Settings', items: [
      { to: '/settings/expiry', icon: Settings, label: t('expirySettings'), roles: ['Admin'] },
      { to: '/settings/store-keeper-assignments', icon: User, label: t('storeKeeperAssignments'), roles: ['Admin'] },
      { to: '/audit-logs', icon: ShieldAlert, label: 'Audit Logs', roles: ['Admin', 'HSE Supervisor'] },
    ]},
  ];

  return (
    <div className="flex h-screen bg-canvas overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-ink text-white transition-all duration-300 flex flex-col h-full",
          sidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        <div className="p-6 mb-4 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded"></div>
              <span className="font-bold text-lg tracking-tight">BITWISE<span className="font-normal opacity-60">HSE</span></span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-6 h-6 bg-accent rounded mx-auto"></div>
          )}
          {/* <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white/50 hover:text-white">
            <Menu className="w-4 h-4" />
          </button> */}
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          {navItems.map((group, idx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={idx} className="mb-4">
                {!sidebarCollapsed && (
                  <h4 className="px-4 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                    {group.epic}
                  </h4>
                )}
                <div className="flex flex-col">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        "px-4 py-2.5 text-[13px] flex items-center gap-3 transition-colors",
                        isActive ? "opacity-100 bg-white/5 border-l-[3px] border-accent" : "opacity-70 hover:opacity-100 border-l-[3px] border-transparent"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", sidebarCollapsed ? "mx-auto" : "")} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          {['Admin'].includes(currentUser.role) && (
            <NavLink to="/trash" className={({ isActive }) => cn(
              "px-4 py-2.5 text-[13px] flex items-center gap-3 transition-colors",
              isActive ? "opacity-100 bg-white/5 border-l-[3px] border-accent" : "opacity-40 hover:opacity-100 border-l-[3px] border-transparent"
            )}>
              <Trash2 className={cn("w-4 h-4 shrink-0", sidebarCollapsed ? "mx-auto" : "")} />
              {!sidebarCollapsed && <span>{t('trashBin')}</span>}
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas h-full">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-body capitalize">Dashboard</span>
            <span className="text-border">/</span>
            <span className="text-xs font-semibold capitalize">{location.pathname.split('/')[1] || t('overview')}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
              <span className="text-[11px] font-bold text-body uppercase tracking-wider">Language</span>
              <div className="flex text-[11px] font-bold border border-border rounded overflow-hidden">
                <div className={cn("px-2 py-1 transition-colors", language === 'en' ? "bg-surface" : "bg-[#F1F1EF] opacity-60")}>EN</div>
                <div className={cn("border-l border-border px-2 py-1 transition-colors", language === 'ar' ? "bg-surface" : "bg-[#F1F1EF] opacity-60")}>AR</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-body uppercase tracking-wider">Role</span>
              <select 
                value={currentUser.id} 
                onChange={handleRoleChange}
                className="bg-[#F1F1EF] border border-border rounded px-2 py-1 text-xs font-medium focus:outline-none"
              >
                {employees.filter(e => e.active).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      
      <ToastContainer />
    </div>
  )
}

function Clock(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
