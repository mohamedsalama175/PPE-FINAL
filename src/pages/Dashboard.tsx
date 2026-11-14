import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PackageX, PackageMinus, Clock, AlertTriangle, ClipboardList, 
  PackageSearch, TrendingUp, BarChart3, Briefcase, Layers, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { currentUser, stockBalances, ppeItems, stockAdjustments, issuances, issuanceReturns, scrapEntries, batches, locations, kits } = usePPEStore();

  const [activeTab, setActiveTab] = React.useState<'overview' | 'movements' | 'capacity' | 'kits'>('overview');
  
  // Tab 1 (PPE-045) Controls
  const [movementDays, setMovementDays] = React.useState<30 | 90>(30);
  const [visibleLayers, setVisibleLayers] = React.useState({ issued: true, returned: true, scrapped: true });

  // Tab 2 (PPE-046) Controls
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);

  // Store Keeper location scoping
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : locations.map(l => l.id);
  }, [currentUser.id, isStoreKeeper, locations]);

  const scopedBalances = stockBalances.filter(b => myLocations.includes(b.locationId));
  const scopedAdjustments = stockAdjustments.filter(a => myLocations.includes(a.locationId));
  const scopedIssuances = issuances.filter(i => myLocations.includes(i.locationId));

  const totalValuation = React.useMemo(() => {
    const scopedBatches = batches.filter(b => myLocations.includes(b.locationId) && b.status !== 'Scrapped');
    return scopedBatches.reduce((sum, b) => sum + (b.availableQty * (b.costPerUnit || 0)), 0);
  }, [batches, myLocations]);

  const lowStockAlerts = React.useMemo(() => {
    return ppeItems.flatMap(item => {
      return locations.filter(l => myLocations.includes(l.id)).map(loc => {
        if (!item.locationIds.includes(loc.id)) return null;
        const bal = stockBalances.find(b => b.ppeItemId === item.id && b.locationId === loc.id);
        const qty = bal ? bal.quantityOnHand : 0;
        
        if (qty <= item.reorderLevel) {
          return { item, location: loc, qty, reorderLevel: item.reorderLevel };
        }
        return null;
      }).filter(Boolean) as { item: any; location: any; qty: number; reorderLevel: number }[];
    });
  }, [ppeItems, locations, stockBalances, myLocations]);

  const outOfStockCount = scopedBalances.filter(b => b.quantityOnHand === 0).length;
  const lowStockCount = scopedBalances.filter(b => {
    if (b.quantityOnHand === 0) return false;
    const item = ppeItems.find(i => i.id === b.ppeItemId);
    return item && b.quantityOnHand <= item.reorderLevel;
  }).length;

  const pendingAdjustments = scopedAdjustments.filter(a => a.status === 'pending').length;
  const openLoans = scopedIssuances.filter(i => i.isLoan && i.status === 'issued').length;

  // Replacements due count
  const replacementsDueCount = issuances.filter(i => i.status === 'issued' && i.expectedReplacementDate && new Date(i.expectedReplacementDate) <= new Date()).length;

  // STAT CARDS
  const statCards = [
    { label: t('outOfStock'), count: outOfStockCount, icon: PackageX, color: 'text-safety-red', bg: 'bg-safety-red/10', link: '/stock?filter=out_of_stock' },
    { label: t('lowStock'), count: lowStockCount, icon: PackageMinus, color: 'text-safety-amber-signal', bg: 'bg-safety-amber-signal/10', link: '/stock?filter=low_stock' },
    { label: 'Replacements Due', count: replacementsDueCount, icon: Clock, color: 'text-safety-amber-signal', bg: 'bg-safety-amber-signal/10', link: '/replacements-due' },
    { label: 'Pending Adjustments', count: pendingAdjustments, icon: ClipboardList, color: 'text-accent', bg: 'bg-accent/10', link: '/stock/adjustments' },
    { label: t('openLoans'), count: openLoans, icon: PackageSearch, color: 'text-ink', bg: 'bg-border', link: '/issuances/open-loans' },
  ];

  // ----------------------------------------------------
  // TAB 1 DATA (PPE-045): Stock Movement Trend Chart
  // ----------------------------------------------------
  const movementTrendData = React.useMemo(() => {
    const today = new Date();
    const intervals: { label: string; start: Date; end: Date; issued: number; returned: number; scrapped: number }[] = [];
    const stepDays = movementDays === 30 ? 5 : 15;
    const numBuckets = movementDays / stepDays;

    for (let i = numBuckets - 1; i >= 0; i--) {
      const bucketEnd = subDays(today, i * stepDays);
      const bucketStart = subDays(bucketEnd, stepDays);
      const label = format(bucketEnd, 'MMM d');

      const issuedCount = scopedIssuances.filter(iss => {
        const d = new Date(iss.issueDate);
        return d >= bucketStart && d <= bucketEnd;
      }).reduce((sum, iss) => sum + iss.quantity, 0);

      const returnedCount = issuanceReturns.filter(ret => {
        const d = new Date(ret.returnDate);
        return d >= bucketStart && d <= bucketEnd;
      }).length;

      const scrappedCount = scrapEntries.filter(scr => {
        const d = new Date(scr.createdAt);
        return d >= bucketStart && d <= bucketEnd && !scr.reversed;
      }).reduce((sum, scr) => sum + scr.quantity, 0);

      intervals.push({
        label,
        start: bucketStart,
        end: bucketEnd,
        issued: issuedCount,
        returned: returnedCount,
        scrapped: scrappedCount
      });
    }

    return intervals;
  }, [movementDays, scopedIssuances, issuanceReturns, scrapEntries]);

  // Max value for scaling
  const maxMovementVal = Math.max(10, ...movementTrendData.map(d => (visibleLayers.issued ? d.issued : 0) + (visibleLayers.returned ? d.returned : 0) + (visibleLayers.scrapped ? d.scrapped : 0)));

  // ----------------------------------------------------
  // TAB 2 DATA (PPE-046): Location Capacity Stacked Bar
  // ----------------------------------------------------
  const locationCapacityData = React.useMemo(() => {
    return locations
      .filter(l => myLocations.includes(l.id))
      .map(loc => {
        const capacity = loc.capacityUnits || 500;
        const totalOnHand = stockBalances
          .filter(b => b.locationId === loc.id)
          .reduce((sum, b) => sum + b.quantityOnHand, 0);

        const quarantined = stockBalances
          .filter(b => b.locationId === loc.id)
          .reduce((sum, b) => sum + (b.quarantinedOnHand || 0), 0);

        const available = Math.max(0, totalOnHand - quarantined);
        const free = Math.max(0, capacity - totalOnHand);
        const utilizationPct = Math.round((totalOnHand / capacity) * 100);

        return {
          loc,
          capacity,
          available,
          quarantined,
          free,
          totalOnHand,
          utilizationPct,
          isNearCapacity: utilizationPct >= 90 && utilizationPct <= 100,
          isOverCapacity: utilizationPct > 100
        };
      });
  }, [locations, myLocations, stockBalances]);

  // Filtered inventory table for Tab 2
  const selectedLocationStock = React.useMemo(() => {
    if (!selectedLocationId) return [];
    return stockBalances
      .filter(b => b.locationId === selectedLocationId && b.quantityOnHand > 0)
      .map(b => ({
        ...b,
        item: ppeItems.find(p => p.id === b.ppeItemId)
      }));
  }, [selectedLocationId, stockBalances, ppeItems]);

  // ----------------------------------------------------
  // TAB 3 DATA (PPE-047): Top Job Kits
  // ----------------------------------------------------
  const topJobKitsData = React.useMemo(() => {
    return kits.map(kit => {
      const issueCount = issuances.filter(i => i.kitId === kit.id).length;
      
      // Stock health check across all items in kit
      let isFullyStocked = true;
      let hasSomeStock = false;

      kit.items.forEach(ki => {
        const totalAvail = stockBalances
          .filter(b => b.ppeItemId === ki.ppeItemId)
          .reduce((sum, b) => sum + Math.max(0, b.quantityOnHand - (b.quarantinedOnHand || 0)), 0);

        if (totalAvail < ki.qty) isFullyStocked = false;
        if (totalAvail > 0) hasSomeStock = true;
      });

      return {
        kit,
        issueCount,
        isFullyStocked,
        isPartial: !isFullyStocked && hasSomeStock,
        isOutOfStock: !hasSomeStock
      };
    }).sort((a, b) => b.issueCount - a.issueCount).slice(0, 5);
  }, [kits, issuances, stockBalances]);

  if (currentUser.role === 'Employee') {
    return (
      <div>
        <PageHeader title={t('dashboard')} />
        <div className="bg-surface p-8 rounded-lg border border-border text-center">
          <p className="text-body mb-4">You are logged in with Employee access permissions.</p>
          <Button onClick={() => navigate('/my-ppe')}>View My Issued PPE</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title={t('dashboard')} 
        subtitle="Real-time HSE inventory intelligence, trend analysis, and equipment compliance" 
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/issuances/new-kit')}>
              <Briefcase className="w-4 h-4 mr-1.5" /> Issue Kit
            </Button>
            <Button onClick={() => navigate('/issuances/new')}>
              Issue Single PPE
            </Button>
          </div>
        }
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => (
          <Link key={idx} to={stat.link} className="p-3.5 bg-surface border border-border rounded hover:bg-canvas transition-colors flex flex-col justify-between">
            <div className="text-[11px] font-bold text-body uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{stat.label}</span>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {String(stat.count).padStart(2, '0')}
            </div>
          </Link>
        ))}
        <div className="p-3.5 bg-surface border border-border rounded flex flex-col justify-between">
          <div className="text-[11px] font-bold text-body uppercase tracking-wider mb-1">Total Valuation</div>
          <div className="text-base font-bold text-ink">EGP {totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-[10px] text-body">Available stock</div>
        </div>
      </div>

      {/* Tabs Navigation (PPE-045, PPE-046, PPE-047) */}
      <div className="flex border-b border-border bg-surface rounded-t px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'overview' ? 'border-accent text-accent' : 'border-transparent text-body hover:text-ink'}`}
        >
          Alerts & Activity
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'movements' ? 'border-accent text-accent' : 'border-transparent text-body hover:text-ink'}`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Movement Trends (PPE-045)
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'capacity' ? 'border-accent text-accent' : 'border-transparent text-body hover:text-ink'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Location Capacity (PPE-046)
        </button>
        <button
          onClick={() => setActiveTab('kits')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'kits' ? 'border-accent text-accent' : 'border-transparent text-body hover:text-ink'}`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Top Job Kits (PPE-047)
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded flex flex-col h-full shadow-sm">
            <div className="p-4 border-b border-border flex justify-between items-center bg-canvas">
              <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-safety-amber-signal" />
                Low Stock Threshold Alerts (PPE-006)
              </h3>
              <span className="text-[11px] font-semibold text-safety-amber-signal bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {lowStockAlerts.length} Action Needed
              </span>
            </div>
            <div className="flex-1 overflow-auto max-h-80 divide-y divide-border">
              {lowStockAlerts.length === 0 ? (
                <div className="p-8 text-center text-body">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-safety-green" />
                  <p className="text-xs">All equipment levels are above reorder thresholds.</p>
                </div>
              ) : (
                lowStockAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-canvas transition-colors flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-ink">{language === 'en' ? alert.item.nameEn : alert.item.nameAr}</div>
                      <div className="text-body font-mono text-[11px]">{alert.item.itemCode} &middot; {alert.location.nameEn}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-safety-red">{alert.qty} {alert.item.uom}</div>
                      <div className="text-[10px] text-body">Reorder: {alert.reorderLevel}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded flex flex-col h-full shadow-sm">
            <div className="p-4 border-b border-border flex justify-between items-center bg-canvas">
              <h3 className="text-xs font-bold uppercase tracking-wider text-body">Recent Operations Log</h3>
              <Link to="/issuances" className="text-xs font-semibold text-accent hover:underline">View All &rarr;</Link>
            </div>
            <div className="flex-1 overflow-auto max-h-80">
              <DataTable 
                data={scopedIssuances.slice(0, 5)}
                keyExtractor={(item) => item.id}
                columns={[
                  { key: 'ref', header: 'Reference', render: (i) => <span className="font-mono text-xs font-semibold">{i.reference || i.id}</span> },
                  { key: 'date', header: 'Date', render: (i) => format(new Date(i.issueDate), 'MMM d') },
                  { key: 'qty', header: 'Qty', render: (i) => <span className="font-bold">{i.quantity}</span> },
                  { key: 'status', header: 'Status', render: (i) => (
                    <StatusBadge status={i.status === 'issued' ? 'info' : 'success'} label={i.status} />
                  )}
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 (PPE-045): Interactive Stock Movement Trend */}
      {activeTab === 'movements' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Interactive Stock Movement Trend (PPE-045)
              </h3>
              <p className="text-xs text-body mt-0.5">
                Stacked multi-layer analysis of Issued, Returned, and Scrapped equipment
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Filter */}
              <div className="flex border border-border rounded overflow-hidden text-xs font-semibold">
                <button
                  onClick={() => setMovementDays(30)}
                  className={`px-3 py-1.5 cursor-pointer ${movementDays === 30 ? 'bg-accent text-white' : 'bg-surface text-body'}`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setMovementDays(90)}
                  className={`px-3 py-1.5 cursor-pointer ${movementDays === 90 ? 'bg-accent text-white' : 'bg-surface text-body'}`}
                >
                  Last 90 Days
                </button>
              </div>

              {/* Interactive Legend Toggles (PPE-045) */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setVisibleLayers(prev => ({ ...prev, issued: !prev.issued }))}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                    visibleLayers.issued ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Issued
                </button>
                <button
                  onClick={() => setVisibleLayers(prev => ({ ...prev, returned: !prev.returned }))}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                    visibleLayers.returned ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Returned
                </button>
                <button
                  onClick={() => setVisibleLayers(prev => ({ ...prev, scrapped: !prev.scrapped }))}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                    visibleLayers.scrapped ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Scrapped
                </button>
              </div>
            </div>
          </div>

          {/* Stacked Visual Chart */}
          <div className="pt-4">
            <div className="h-64 flex items-end gap-3 border-b border-border pb-2 px-2">
              {movementTrendData.map((d, i) => {
                const issuedH = visibleLayers.issued ? (d.issued / maxMovementVal) * 100 : 0;
                const retH = visibleLayers.returned ? (d.returned / maxMovementVal) * 100 : 0;
                const scrH = visibleLayers.scrapped ? (d.scrapped / maxMovementVal) * 100 : 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-white text-[10px] p-2 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      <div className="font-bold border-b border-white/20 pb-0.5">{d.label}</div>
                      <div>Issued: {d.issued}</div>
                      <div>Returned: {d.returned}</div>
                      <div>Scrapped: {d.scrapped}</div>
                    </div>

                    {/* Stacked bar */}
                    <div className="w-full max-w-[40px] flex flex-col-reverse rounded-t overflow-hidden bg-gray-100">
                      {visibleLayers.issued && (
                        <div style={{ height: `${issuedH}%` }} className="w-full bg-blue-600 transition-all" />
                      )}
                      {visibleLayers.returned && (
                        <div style={{ height: `${retH}%` }} className="w-full bg-green-600 transition-all" />
                      )}
                      {visibleLayers.scrapped && (
                        <div style={{ height: `${scrH}%` }} className="w-full bg-red-600 transition-all" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-body mt-2">{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-body pt-2 px-2 font-mono">
              <span>Past Interval Start</span>
              <span>Today ({format(new Date(), 'MMM d, yyyy')})</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 (PPE-046): Location Capacity Stacked Bar & Click Filter */}
      {activeTab === 'capacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capacity Bars */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                Location Capacity Utilization (PPE-046)
              </h3>
              <p className="text-xs text-body mt-0.5">
                Click any location row below to filter and inspect its live stock inventory in the adjacent panel.
              </p>
            </div>

            <div className="space-y-4">
              {locationCapacityData.map(({ loc, capacity, available, quarantined, free, utilizationPct, isNearCapacity, isOverCapacity }) => {
                const isSelected = selectedLocationId === loc.id;
                const availPct = Math.round((available / capacity) * 100);
                const quarPct = Math.round((quarantined / capacity) * 100);
                const freePct = Math.max(0, 100 - availPct - quarPct);

                return (
                  <div 
                    key={loc.id} 
                    onClick={() => setSelectedLocationId(isSelected ? null : loc.id)}
                    className={`p-3.5 rounded border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                        : 'border-border bg-canvas/40 hover:bg-canvas'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div>
                        <span className="font-bold text-xs text-ink">{loc.nameEn}</span>
                        <span className="text-[11px] text-body ml-2 font-mono">({loc.code} &middot; {loc.site})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverCapacity && (
                          <span className="text-[10px] font-bold text-safety-red bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                            OVER CAPACITY
                          </span>
                        )}
                        {isNearCapacity && (
                          <span className="text-[10px] font-bold text-safety-amber-signal bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            ≥ 90% NEAR CAPACITY
                          </span>
                        )}
                        <span className={`text-xs font-bold font-mono ${isOverCapacity ? 'text-safety-red' : isNearCapacity ? 'text-safety-amber-signal' : 'text-ink'}`}>
                          {utilizationPct}% ({loc.capacityUnits} cap)
                        </span>
                      </div>
                    </div>

                    {/* Stacked bar: Available (green), Quarantined (amber), Free (gray) */}
                    <div className="w-full h-3.5 bg-gray-200 rounded overflow-hidden flex shadow-inner">
                      <div style={{ width: `${Math.min(100, availPct)}%` }} className="h-full bg-safety-green transition-all" title={`Available: ${available}`} />
                      <div style={{ width: `${Math.min(100, quarPct)}%` }} className="h-full bg-safety-amber-signal transition-all" title={`Quarantined: ${quarantined}`} />
                      <div style={{ width: `${freePct}%` }} className="h-full bg-gray-200" title={`Free Space: ${free}`} />
                    </div>

                    <div className="flex justify-between text-[10px] text-body mt-1.5 font-mono">
                      <span>Available: {available}</span>
                      <span>Quarantined: {quarantined}</span>
                      <span>Free Space: {free}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Adjacent Table (PPE-046) */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm flex flex-col">
            <div className="border-b border-border pb-3 mb-3">
              <h4 className="font-bold text-xs text-ink uppercase tracking-wider">
                {selectedLocationId ? `Stock at Selected Location` : 'Select a location to filter'}
              </h4>
              <p className="text-[11px] text-body">
                {selectedLocationId ? `Showing items currently on hand` : 'Click any location bar on the left'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {!selectedLocationId ? (
                <div className="p-8 text-center text-body text-xs italic">
                  No location selected. Click a bar to view inventory.
                </div>
              ) : selectedLocationStock.length === 0 ? (
                <div className="p-8 text-center text-body text-xs italic">
                  No positive stock balances at this location.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-body uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Available</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedLocationStock.map(b => (
                      <tr key={b.id} className="hover:bg-canvas/50">
                        <td className="p-2">
                          <div className="font-semibold text-ink">{b.item?.nameEn || b.ppeItemId}</div>
                          <div className="text-[10px] text-body font-mono">{b.item?.itemCode}</div>
                        </td>
                        <td className="p-2 text-right font-bold text-safety-green">
                          {Math.max(0, b.quantityOnHand - (b.quarantinedOnHand || 0))}
                        </td>
                        <td className="p-2 text-right font-bold text-ink">
                          {b.quantityOnHand}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 (PPE-047): Action-Driven Top Job Kits */}
      {activeTab === 'kits' && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent" />
              Action-Driven Top Job Kits (PPE-047)
            </h3>
            <p className="text-xs text-body mt-0.5">
              Top issued standardized kits with real-time stock availability and 1-click issue navigation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topJobKitsData.map(({ kit, issueCount, isFullyStocked, isPartial, isOutOfStock }) => (
              <div key={kit.id} className="p-4 rounded border border-border bg-canvas/40 hover:bg-canvas transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-ink">{kit.nameEn}</h4>
                      <p className="text-xs text-body font-mono mt-0.5">{kit.items.length} items bundled</p>
                    </div>

                    {isFullyStocked ? (
                      <span className="text-[11px] font-bold text-safety-green bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                        Full Stock Available
                      </span>
                    ) : isPartial ? (
                      <span className="text-[11px] font-bold text-safety-amber-signal bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Partial Stock (G8)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-safety-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-body">
                    <span className="font-bold text-accent font-mono">{issueCount} times</span> issued to date
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/issuances/new-kit?kitId=${kit.id}`)}
                  >
                    Issue this Kit <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
