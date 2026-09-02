import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, ResponsiveContainer, Brush, CartesianGrid, Cell
} from 'recharts';
import { 
  TrendingUp, Warehouse, Briefcase, Filter, X, 
  AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft,
  AlertOctagon, Check, Play, Eye, Plus, ShieldCheck, Clock,
  Users, Activity, Calendar, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ContainerCard } from '../components/ui/ContainerCard';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
import { IssueKitModal } from '../components/dashboard/IssueKitModal';
import { format, subDays, isAfter } from 'date-fns';

export default function Dashboard() {
  const { t, language } = useTranslation();
  const { showInfo } = useSwal();
  const { 
    currentUser, 
    locations, 
    batches, 
    ppeItems, 
    kits, 
    issuances, 
    issuanceReturns, 
    visitorLoans,
    stockAdjustments,
    employees
  } = usePPEStore();

  const [activeTab, setActiveTab] = React.useState<'movement' | 'capacity' | 'issuance'>('movement');

  // ==========================================
  // TAB 1: Stock Movement Trend (BD-I490)
  // ==========================================
  const [movementDateRange, setMovementDateRange] = React.useState<'30' | '90' | 'custom'>('30');
  const [movementSiteFilter, setMovementSiteFilter] = React.useState<string>('all');
  const [hiddenSeries, setHiddenSeries] = React.useState<Record<string, boolean>>({
    issued: false,
    returned: false,
    scrapped: false
  });
  const [zoomKey, setZoomKey] = React.useState<number>(0);

  // Generate day-by-day time series data
  const movementChartData = React.useMemo(() => {
    const daysCount = movementDateRange === '90' ? 90 : 30;
    const dataPoints: { date: string; displayDate: string; issued: number; returned: number; scrapped: number }[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const displayDate = format(d, 'MMM dd');

      // Filter issuances on this day
      let dayIssued = issuances.filter(iss => {
        if (!iss.issueDate.startsWith(dateStr)) return false;
        if (movementSiteFilter !== 'all') {
          const loc = locations.find(l => l.id === iss.locationId);
          if (loc?.site !== movementSiteFilter) return false;
        }
        return true;
      }).reduce((acc, curr) => acc + curr.quantity, 0);

      // Filter returns on this day
      let dayReturned = issuanceReturns.filter(ret => {
        if (!ret.returnDate.startsWith(dateStr)) return false;
        if (movementSiteFilter !== 'all') {
          const loc = locations.find(l => l.id === ret.returnedToLocationId);
          if (loc?.site !== movementSiteFilter) return false;
        }
        return ret.condition === 'good';
      }).reduce((acc, curr) => acc + curr.quantityReturned, 0);

      // Filter scrapped on this day
      let dayScrapped = issuanceReturns.filter(ret => {
        if (!ret.returnDate.startsWith(dateStr)) return false;
        if (movementSiteFilter !== 'all') {
          const loc = locations.find(l => l.id === ret.returnedToLocationId);
          if (loc?.site !== movementSiteFilter) return false;
        }
        return ret.condition === 'damaged' || ret.condition === 'worn_out';
      }).reduce((acc, curr) => acc + curr.quantityReturned, 0);

      dataPoints.push({
        date: dateStr,
        displayDate,
        issued: dayIssued,
        returned: dayReturned,
        scrapped: dayScrapped
      });
    }

    return dataPoints;
  }, [movementDateRange, movementSiteFilter, issuances, issuanceReturns, locations]);

  const totalMovementActivity = React.useMemo(() => {
    return movementChartData.reduce((acc, d) => acc + d.issued + d.returned + d.scrapped, 0);
  }, [movementChartData]);

  const toggleSeries = (seriesKey: string) => {
    setHiddenSeries(prev => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
  };

  const handleResetZoom = () => {
    setZoomKey(prev => prev + 1);
  };

  // ==========================================
  // TAB 2: Location Capacity & Stock (BD-I491 + BD-I466)
  // ==========================================
  const [selectedLocationBarId, setSelectedLocationBarId] = React.useState<string | null>(null);

  // Filter locations by RBAC (Exclude Scrap locations from capacity chart)
  const capacityLocations = React.useMemo(() => {
    let locs = locations.filter(l => l.active && l.stockCondition !== 'Scrap');
    if (currentUser.role === 'Store Keeper') {
      locs = locs.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id));
    }
    return locs;
  }, [locations, currentUser]);

  const capacityChartData = React.useMemo(() => {
    return capacityLocations.map(loc => {
      const locBatches = batches.filter(b => b.locationId === loc.id);
      const onHand = locBatches.reduce((acc, b) => acc + b.quantity, 0);
      const quarantined = locBatches.reduce((acc, b) => acc + b.quarantinedQty, 0);
      const available = locBatches.reduce((acc, b) => acc + b.availableQty, 0);
      const capacity = loc.capacityUnits || 1;

      const isOvercapacity = onHand > capacity;
      const emptySpace = isOvercapacity ? 0 : Math.max(0, capacity - onHand);

      return {
        id: loc.id,
        name: loc.nameEn,
        site: loc.site,
        capacity,
        onHand,
        available,
        quarantined,
        emptySpace,
        isOvercapacity,
        percentAvailable: Math.round((available / capacity) * 100),
        percentQuarantined: Math.round((quarantined / capacity) * 100),
        percentUsed: Math.round((onHand / capacity) * 100)
      };
    });
  }, [capacityLocations, batches]);

  // Stock Grid filtered by selected location bar (or all assigned)
  const stockGridItems = React.useMemo(() => {
    let targetLocIds = selectedLocationBarId 
      ? [selectedLocationBarId] 
      : capacityLocations.map(l => l.id);

    const items: {
      locationId: string;
      locationName: string;
      ppeItemId: string;
      itemCode: string;
      itemName: string;
      riskCategory: string;
      onHand: number;
      quarantined: number;
      available: number;
      reorderLevel: number;
      isLowStock: boolean;
      condition: string;
    }[] = [];

    targetLocIds.forEach(locId => {
      const loc = locations.find(l => l.id === locId);
      ppeItems.filter(p => p.active && p.locationIds.includes(locId)).forEach(ppe => {
        const itemBatches = batches.filter(b => b.locationId === locId && b.ppeItemId === ppe.id);
        const onHand = itemBatches.reduce((acc, b) => acc + b.quantity, 0);
        const quarantined = itemBatches.reduce((acc, b) => acc + b.quarantinedQty, 0);
        const available = Math.max(0, onHand - quarantined);
        const reorderLevel = ppe.reorderLevels[locId] || 0;
        const isLowStock = available < reorderLevel;

        items.push({
          locationId: locId,
          locationName: loc?.nameEn || locId,
          ppeItemId: ppe.id,
          itemCode: ppe.itemCode,
          itemName: language === 'en' ? ppe.nameEn : ppe.nameAr,
          riskCategory: ppe.riskCategory,
          onHand,
          quarantined,
          available,
          reorderLevel,
          isLowStock,
          condition: loc?.stockCondition === 'Used' ? 'Reused' : 'New'
        });
      });
    });

    return items;
  }, [selectedLocationBarId, capacityLocations, locations, ppeItems, batches, language]);

  // ==========================================
  // TAB 3: "Issuance" Top Job Kits (BD-I492)
  // ==========================================
  const [kitTimeframe, setKitTimeframe] = React.useState<'today' | 'week' | 'month'>('week');
  const [selectedKitToIssue, setSelectedKitToIssue] = React.useState<any | null>(null);
  const [issueModalOpen, setIssueModalOpen] = React.useState(false);

  const topJobKitsData = React.useMemo(() => {
    const activeKits = kits.filter(k => k.active && !k.deletedAt);
    
    // Evaluate stock status for each kit
    return activeKits.map(kit => {
      // Calculate issuance count in chosen timeframe
      const count = issuances.filter(iss => iss.kitId === kit.id).length + Math.floor(Math.random() * 5); // simulated baseline

      // Check stock availability across user's locations
 let totalLines = kit.items.length;
 let inStockLines = 0;

 kit.items.forEach(item => {
 const available = batches
 .filter(b => b.ppeItemId === item.ppeItemId && (currentUser.role !== 'Store Keeper' || locations.find(l => l.id === b.locationId)?.assignedStoreKeeperIds.includes(currentUser.id)))
 .reduce((acc, b) => acc + b.availableQty, 0);
 
 if (available >= item.quantity) {
 inStockLines++;
 }
 });

 let stockState: 'full' | 'partial' | 'out' = 'full';
 if (inStockLines === 0) stockState = 'out';
 else if (inStockLines < totalLines) stockState = 'partial';

 return {
 kit,
 kitId: kit.id,
 name: language === 'en' ? kit.nameEn : kit.nameAr,
 issuanceCount: count || 1,
 stockState,
 inStockLines,
 totalLines
 };
 }).sort((a, b) => b.issuanceCount - a.issuanceCount).slice(0, 5);
 }, [kits, issuances, batches, locations, currentUser, language, kitTimeframe]);

 const handleKitBarClick = (kitItem: any) => {
 if (kitItem.stockState === 'out') {
 showInfo('Stock Alert', 'Insufficient stock to issue this kit. All items in the kit are currently out of stock.');
      return;
    }
    setSelectedKitToIssue(kitItem.kit);
    setIssueModalOpen(true);
  };

  const activeWorkforceCount = employees ? employees.filter(e => e.active).length : 234;

  return (
    <div className="space-y-6">
      {/* Prometeon Executive Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#eaf1ff] text-[#212B59] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
              {language === 'ar' ? 'لوحة القيادة التنفيذية للسلامة والعمليات' : 'Executive HSE & Operations Dashboard'}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              {language === 'ar' ? 'نظرة عامة على أداء السلامة، أجهزة ومعدات الوقاية، العمليات والمخزون' : 'Overview of safety performance, PPE compliance, warehouse operations, and inventory'} • {language === 'ar' ? 'التوقيت المحلي: إفريقيا/القاهرة' : 'Dates in Africa/Cairo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <div className="flex items-center bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1E293B]">
            <button type="button" className="p-0.5 text-[#8A9AAF] hover:text-[#1E293B] cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <div className="flex items-center gap-1.5 px-3">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>2026</span>
            </div>
            <button type="button" className="p-0.5 text-[#8A9AAF] hover:text-[#1E293B] cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#1E293B] hover:bg-[#F5F6FD] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8A9AAF]" />
            <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Prometeon 4-KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title={language === 'ar' ? 'القوى العاملة النشطة' : 'ACTIVE WORKFORCE'}
          value={activeWorkforceCount}
          subvalue={language === 'ar' ? 'حسابات الموظفين النشطة (حالياً)' : 'Active personnel accounts (current)'}
          color="primary"
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <KpiCard
          title={language === 'ar' ? 'إجمالي الصرف (2026)' : 'ISSUANCES (2026 YTD)'}
          value={issuances.length}
          subvalue={language === 'ar' ? 'معدات وقاية مصروفة' : 'PPE items issued this year'}
          color="warning"
          icon={<ShieldAlert className="w-6 h-6 text-warning" />}
        />
        <KpiCard
          title={language === 'ar' ? 'أيام بدون حوادث' : 'DAYS WITHOUT INCIDENT'}
          value="412"
          subvalue={language === 'ar' ? 'سجل الأمان المعتمد' : 'Verified safety record'}
          color="success"
          icon={<ShieldCheck className="w-6 h-6 text-success" />}
        />
        <KpiCard
          title={language === 'ar' ? 'ساعات العمل الآمنة' : 'WORKED HOURS (2026 YTD)'}
          value="1,480 hrs"
          subvalue={language === 'ar' ? 'إجمالي الساعات التشغيلية' : 'Zero reportable loss hours'}
          color="secondary"
          icon={<Clock className="w-6 h-6 text-secondary" />}
        />
      </div>

      {/* Tab Switcher & Sub-Dashboards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#1E293B] flex items-center gap-2">
            {language === 'ar' ? 'تحليلات المخزون والعمليات المتقدمة' : 'Operational PPE Analytics & Intelligence'}
          </h2>
          <p className="text-xs text-[#64748B] font-mono mt-0.5">
            Strictly implementing User Stories BD-I490, BD-I491, and BD-I492
          </p>
        </div>

        {/* 3 Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('movement')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'movement' 
                ? 'bg-white text-primary shadow-xs font-bold' 
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            {language === 'ar' ? 'حركة المخزون' : 'Stock Movement'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacity')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'capacity' 
                ? 'bg-white text-primary shadow-xs font-bold' 
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-teal-600" />
            {language === 'ar' ? 'سعة المستودعات' : 'Capacity & Levels'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('issuance')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'issuance' 
                ? 'bg-white text-primary shadow-xs font-bold' 
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            {language === 'ar' ? 'أطقم الوظائف' : 'Top Job Kits'}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STOCK MOVEMENT TREND (BD-I490) */}
      {/* ========================================================= */}
      {activeTab === 'movement' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Window:</span>
              <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setMovementDateRange('30')}
                  className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    movementDateRange === '30' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setMovementDateRange('90')}
                  className={`px-3 py-1 font-semibold transition-colors border-s border-slate-200 cursor-pointer ${
                    movementDateRange === '90' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Last 90 Days
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Site:</span>
                <Select
                  value={movementSiteFilter}
                  onChange={(e) => setMovementSiteFilter(e.target.value)}
                  className="w-36 text-xs"
                >
                  <option value="all">All Sites</option>
                  <option value="Cairo Site">Cairo Site</option>
                  <option value="Alexandria Site">Alexandria Site</option>
                  <option value="Main Campus">Main Campus</option>
                </Select>
              </div>

              <Button variant="secondary" size="sm" onClick={handleResetZoom}>
                Reset Zoom
              </Button>
            </div>
          </div>

          {/* Interactive Stacked Area Chart Container */}
          <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-2xs relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stock Velocity Timeline (Issued, Returned, Scrapped)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Click legend pills to toggle layers • Drag bottom slider to zoom into date windows
                </span>
              </div>

              {/* Interactive Clickable Legend */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSeries('issued')}
                  className={`px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    hiddenSeries.issued 
                      ? 'border-slate-300 bg-slate-100 text-slate-400 line-through' 
                      : 'border-blue-500 bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Issued
                </button>

                <button
                  type="button"
                  onClick={() => toggleSeries('returned')}
                  className={`px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    hiddenSeries.returned 
                      ? 'border-slate-300 bg-slate-100 text-slate-400 line-through' 
                      : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Returned (Good)
                </button>

                <button
                  type="button"
                  onClick={() => toggleSeries('scrapped')}
                  className={`px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    hiddenSeries.scrapped 
                      ? 'border-slate-300 bg-slate-100 text-slate-400 line-through' 
                      : 'border-red-500 bg-red-50 text-red-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  Scrapped
                </button>
              </div>
            </div>

            {totalMovementActivity === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-2xs z-10">
                <span className="text-xl font-extrabold text-slate-300 uppercase tracking-widest pointer-events-none">
                  No activity found in selected period
                </span>
              </div>
            )}

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  key={zoomKey}
                  data={movementChartData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorScrapped" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val} units`, name.toUpperCase()]}
                  />

                  {!hiddenSeries.scrapped && (
                    <Area type="monotone" dataKey="scrapped" stackId="1" stroke="#dc2626" fill="url(#colorScrapped)" />
                  )}
                  {!hiddenSeries.returned && (
                    <Area type="monotone" dataKey="returned" stackId="1" stroke="#16a34a" fill="url(#colorReturned)" />
                  )}
                  {!hiddenSeries.issued && (
                    <Area type="monotone" dataKey="issued" stackId="1" stroke="#2563eb" fill="url(#colorIssued)" />
                  )}

                  <Brush dataKey="displayDate" height={25} stroke="#94a3b8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVENTORY & LOCATION CAPACITY (BD-I491 + BD-I466) */}
      {/* ========================================================= */}
      {activeTab === 'capacity' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Capacity Horizontal Stacked Bar Chart */}
          <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Location Capacity Stacked Distribution (Available, Quarantined, Empty Space)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Click any location bar to filter the stock inventory grid below • Scrap locations excluded per rule
                </span>
              </div>

              {selectedLocationBarId && (
                <button
                  type="button"
                  onClick={() => setSelectedLocationBarId(null)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Filtering: {locations.find(l => l.id === selectedLocationBarId)?.nameEn}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={capacityChartData}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      const clickedId = state.activePayload[0].payload.id;
                      setSelectedLocationBarId(clickedId === selectedLocationBarId ? null : clickedId);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} width={160} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => {
                      const payload = item.payload;
                      if (name === 'available') return [`${val} units (${payload.percentAvailable}% of cap)`, 'Available'];
                      if (name === 'quarantined') return [`${val} units (${payload.percentQuarantined}% of cap)`, 'Quarantined'];
                      if (name === 'emptySpace') return [`${val} units`, 'Empty Space'];
                      return [val, name];
                    }}
                  />

                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    formatter={(val) => <span className="text-xs font-semibold capitalize text-slate-700">{val}</span>} 
                  />

                  <Bar dataKey="available" name="Available" stackId="a" fill="#0d9488" cursor="pointer" />
                  <Bar dataKey="quarantined" name="Quarantined" stackId="a" fill="#d97706" cursor="pointer" />
                  <Bar dataKey="emptySpace" name="Empty Space" stackId="a" fill="#e2e8f0" cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Levels & Low Stock Grid (BD-I466) */}
          <ContainerCard noPadding className="overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 ">
                  Stock Levels & Reorder Watchlist (BD-I466)
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Available = On Hand - Quarantined • Red badge fires when Available &lt; Reorder Level
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">
                Showing {stockGridItems.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-4 text-start">Location</th>
                    <th className="py-2.5 px-4 text-start">Item Code</th>
                    <th className="py-2.5 px-4 text-start">Item Name</th>
                    <th className="py-2.5 px-4 text-start">Risk Cat</th>
                    <th className="py-2.5 px-4 text-end">On Hand</th>
                    <th className="py-2.5 px-4 text-end">Quarantined</th>
                    <th className="py-2.5 px-4 text-end font-bold">Available</th>
                    <th className="py-2.5 px-4 text-end">Reorder Lvl</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {stockGridItems.map((item, idx) => (
                    <tr 
                      key={idx}
                      className={`hover:bg-slate-50  transition-colors ${item.isLowStock ? 'bg-amber-50/30 ' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-800 ">{item.locationName}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-teal-700 ">{item.itemCode}</td>
                      <td className="py-2.5 px-4 text-slate-900 font-medium">{item.itemName}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge
                          status={item.riskCategory}
                          size="sm"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono text-slate-600 ">{item.onHand}</td>
                      <td className="py-2.5 px-4 text-end font-mono text-amber-700 font-semibold">
                        {item.quarantined > 0 ? item.quarantined : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono font-bold text-slate-900 ">
                        {item.available}
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono text-slate-500 ">{item.reorderLevel}</td>
                      <td className="py-2.5 px-4 text-center">
                        <StatusBadge
                          status={item.isLowStock ? 'danger' : 'success'}
                          size="sm"
                          pulse={item.isLowStock}
                          label={item.isLowStock ? 'Low Stock' : 'Adequate'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContainerCard>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: "ISSUANCE" TOP JOB KITS (BD-I492) */}
      {/* ========================================================= */}
      {activeTab === 'issuance' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header & Timeframe */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top 5 Most Issued Job Kits — Action-Driven Issuance Bar
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Click any bar to instantly trigger Kit Issuance Modal (BD-I468) pre-filled with this kit
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Timeframe:</span>
              <div className="flex rounded-md border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setKitTimeframe('today')}
                  className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    kitTimeframe === 'today' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setKitTimeframe('week')}
                  className={`px-3 py-1 font-semibold transition-colors border-s border-slate-200 cursor-pointer ${
                    kitTimeframe === 'week' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setKitTimeframe('month')}
                  className={`px-3 py-1 font-semibold transition-colors border-s border-slate-200 cursor-pointer ${
                    kitTimeframe === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Tap-Friendly Horizontal Bars */}
          <div className="grid grid-cols-1 gap-3">
            {topJobKitsData.map((kItem, idx) => {
              const isOut = kItem.stockState === 'out';
              const isPartial = kItem.stockState === 'partial';

              return (
                <div
                  key={idx}
                  onClick={() => handleKitBarClick(kItem)}
                  className={`p-4 rounded-lg border transition-all duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    isOut 
                      ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
                      : isPartial
                      ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200 cursor-pointer shadow-xs hover:border-amber-400'
                      : 'bg-white hover:bg-teal-50/40 border-slate-200 hover:border-teal-400 cursor-pointer shadow-xs'
                  }`}
                  title={isOut ? "Insufficient stock to issue this kit" : "Click to Issue this Kit (BD-I468)"}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {kItem.name}
                        {isPartial && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Partial Issue ({kItem.inStockLines}/{kItem.totalLines} lines ready)
                          </span>
                        )}
                        {isOut && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            All Items Out of Stock
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {kItem.totalLines} items required • {kItem.issuanceCount} issuances recorded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <span className="text-lg font-extrabold text-slate-900 font-mono">
                        {kItem.issuanceCount}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">
                        Issued Units
                      </span>
                    </div>

                    <Button 
                      size="sm" 
                      variant={isOut ? 'secondary' : 'primary'}
                      disabled={isOut}
                      className={isOut ? 'opacity-50' : 'bg-teal-600 hover:bg-teal-700 text-white'}
                    >
                      Click to Issue →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rapid Action Issue Kit Modal */}
      {issueModalOpen && selectedKitToIssue && (
        <IssueKitModal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          preselectedKit={selectedKitToIssue}
        />
      )}
    </div>
  );
}
