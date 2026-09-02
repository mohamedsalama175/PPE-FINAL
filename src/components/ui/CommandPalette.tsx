import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Box, Users, ArrowRightLeft, ShieldAlert, 
  Settings, Clock, LayoutGrid, PackageSearch, Layers, 
  MapPin, Briefcase, FileSpreadsheet, ShieldCheck, 
  Trash2, Sliders, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { cn } from '../../lib/utils';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandResultItem {
  label: string;
  sublabel?: string;
  path: string;
  category: string;
  icon: React.ReactNode;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { language, setLanguage } = useTranslation();
  const isRtl = language === 'ar';
  const { ppeItems, employees } = usePPEStore();

  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input whenever opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Pre-configured Navigation Destinations
  const navItems: CommandResultItem[] = React.useMemo(() => [
    { label: isRtl ? 'لوحة القيادة التنفيذية' : 'Executive Dashboard', path: '/', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <LayoutGrid className="w-4 h-4 text-primary" /> },
    { label: isRtl ? 'مركز المخزون والمستودعات' : 'Stock Management Hub', path: '/stock', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <PackageSearch className="w-4 h-4 text-blue-600" /> },
    { label: isRtl ? 'مستويات المخزون والتنبيهات' : 'Stock Levels & Alerts', path: '/stock/levels', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <PackageSearch className="w-4 h-4 text-blue-600" /> },
    { label: isRtl ? 'مناقلات المخزون' : 'Stock Transfers', path: '/stock/transfers', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <ArrowRightLeft className="w-4 h-4 text-purple-600" /> },
    { label: isRtl ? 'مركز الصرف والإعارات' : 'Issuances & Loans Hub', path: '/issuances', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <ShieldAlert className="w-4 h-4 text-amber-600" /> },
    { label: isRtl ? 'سجل صرف الموظفين' : 'Employee Issuances', path: '/issuances/records', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <ShieldAlert className="w-4 h-4 text-amber-600" /> },
    { label: isRtl ? 'قروض الزوار والمقاولين' : 'Visitor & Contractor Loans', path: '/issuances/open-loans', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <Clock className="w-4 h-4 text-purple-600" /> },
    { label: isRtl ? 'الاستبدالات المستحقة' : 'Replacements Due', path: '/issuances/replacements-due', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
    { label: isRtl ? 'كتالوج معدات الوقاية' : 'PPE Catalog', path: '/catalog', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <Box className="w-4 h-4 text-indigo-600" /> },
    { label: isRtl ? 'دليل الموظفين والسجل الزمني' : 'Employee Directory', path: '/employees', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <Users className="w-4 h-4 text-teal-600" /> },
    { label: isRtl ? 'مركز إعدادات النظام' : 'System Settings Hub', path: '/settings', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <Settings className="w-4 h-4 text-slate-700" /> },
    { label: isRtl ? 'سجل التدقيق غير القابل للتعديل' : 'Immutable Audit Log', path: '/audit-logs', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <ShieldCheck className="w-4 h-4 text-indigo-600" /> },
    { label: isRtl ? 'سلة المهملات المشتركة' : 'Shared Trash Bin', path: '/trash', category: isRtl ? 'التنقل السريع' : 'Navigation', icon: <Trash2 className="w-4 h-4 text-rose-600" /> },
  ], [isRtl]);

  // Filter Catalog Items
  const filteredCatalog: CommandResultItem[] = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ppeItems
      .filter(item => 
        item.itemCode.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        (item.nameAr && item.nameAr.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(item => ({
        label: `${item.itemCode} • ${isRtl && item.nameAr ? item.nameAr : item.nameEn}`,
        sublabel: `${item.category} • ${item.uom}`,
        path: `/catalog/${item.id}/edit`,
        category: isRtl ? 'أصناف الكتالوج' : 'PPE Catalog Items',
        icon: <Box className="w-4 h-4 text-indigo-600" />
      }));
  }, [ppeItems, query, isRtl]);

  // Filter Employees
  const filteredEmployees: CommandResultItem[] = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return employees
      .filter(emp => 
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(emp => ({
        label: `${emp.employeeCode} • ${emp.name}`,
        sublabel: `${emp.role} • ${emp.department || 'Operations'}`,
        path: `/employees/${emp.id}`,
        category: isRtl ? 'الموظفين' : 'Personnel',
        icon: <Users className="w-4 h-4 text-teal-600" />
      }));
  }, [employees, query, isRtl]);

  // Filtered Nav Items
  const filteredNav: CommandResultItem[] = React.useMemo(() => {
    if (!query.trim()) return navItems.slice(0, 8);
    const q = query.toLowerCase();
    return navItems.filter(item => item.label.toLowerCase().includes(q));
  }, [navItems, query]);

  // Combined Results List
  const allResults: CommandResultItem[] = React.useMemo(() => {
    return [...filteredNav, ...filteredCatalog, ...filteredEmployees];
  }, [filteredNav, filteredCatalog, filteredEmployees]);

  // Handle Enter selection
  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % (allResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isRtl ? 'ابحث في النظام (الأصناف، الموظفين، الصفحات)...' : 'Type a command, search items, employees, or pages...'}
            className="w-full bg-transparent text-sm font-medium text-[#1E293B] placeholder:text-[#8A9AAF] focus:outline-none"
          />
          {query ? (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#8A9AAF] hover:text-[#1E293B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] font-mono font-bold text-[#8A9AAF] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-[#E2E8F0]/40 custom-scrollbar">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8A9AAF]">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#1E293B]">{isRtl ? 'لا توجد نتائج مطابقة' : 'No matching results'}</p>
              <p className="mt-1">{isRtl ? 'جرّب البحث باسم الصنف، الكود أو الموظف' : 'Try searching by item code, name, or employee ID'}</p>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-xs select-none',
                    isSelected ? 'bg-[#F5F6FD] text-primary' : 'text-[#1E293B] hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs shrink-0', isSelected && 'border-primary/40')}>
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <p className={cn('font-bold text-sm truncate', isSelected ? 'text-primary' : 'text-[#1E293B]')}>
                        {item.label}
                      </p>
                      {'sublabel' in item && item.sublabel && (
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {item.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-[#8A9AAF] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#8A9AAF]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#E2E8F0] px-1 rounded">↑</kbd>
              <kbd className="font-mono bg-white border border-[#E2E8F0] px-1 rounded">↓</kbd>
              <span>{isRtl ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#E2E8F0] px-1.5 rounded">↵</kbd>
              <span>{isRtl ? 'للاختيار' : 'Select'}</span>
            </span>
          </div>
          <span className="font-semibold text-primary">SPARK Enterprise HSE</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
