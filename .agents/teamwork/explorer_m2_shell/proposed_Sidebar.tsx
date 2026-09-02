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
              // In LTR: pointing left collapses; pointing right expands.
              // In RTL: rtl:rotate-180 mirrors direction automatically.
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
