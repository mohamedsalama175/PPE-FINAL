import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { PackageX, PackageMinus, Clock, AlertTriangle, ClipboardList, PackageSearch } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { t, language } = useTranslation();
  const { currentUser, stockBalances, ppeItems, stockAdjustments, issuances, batches, locations } = usePPEStore();

  // Scope to store keeper locations if needed
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
        
        if (qty < item.reorderLevel) {
          return { item, location: loc, qty, reorderLevel: item.reorderLevel };
        }
        return null;
      }).filter(Boolean) as { item: any, location: any, qty: number, reorderLevel: number }[];
    });
  }, [ppeItems, locations, stockBalances, myLocations]);

  const outOfStockCount = scopedBalances.filter(b => b.quantityOnHand === 0).length;
  
  const lowStockCount = scopedBalances.filter(b => {
    if (b.quantityOnHand === 0) return false;
    const item = ppeItems.find(i => i.id === b.ppeItemId);
    return item && b.quantityOnHand < item.reorderLevel;
  }).length;

  const pendingAdjustments = scopedAdjustments.filter(a => a.status === 'pending').length;
  const openLoans = scopedIssuances.filter(i => i.expectedReturnDate && i.status === 'issued').length;

  // Mock expiry logic for dashboard
  const expiringSoonCount = 2; // Hardcoded mock for prototype feel
  const overdueCount = 1;

  const recentIssuances = scopedIssuances
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  const statCards = [
    { label: t('outOfStock'), count: outOfStockCount, icon: PackageX, color: 'text-safety-red', bg: 'bg-safety-red/10', link: '/stock?filter=out_of_stock' },
    { label: t('lowStock'), count: lowStockCount, icon: PackageMinus, color: 'text-safety-amber-signal', bg: 'bg-safety-amber-signal/10', link: '/stock?filter=low_stock' },
    { label: t('expiringSoon'), count: expiringSoonCount, icon: Clock, color: 'text-safety-amber-signal', bg: 'bg-safety-amber-signal/10', link: '/issuances?filter=expiring' },
    { label: 'Overdue Expiry', count: overdueCount, icon: AlertTriangle, color: 'text-safety-red', bg: 'bg-safety-red/10', link: '/issuances?filter=overdue' },
    { label: 'Pending Approvals', count: pendingAdjustments, icon: ClipboardList, color: 'text-accent', bg: 'bg-accent/10', link: '/stock/adjustments?filter=pending' },
    { label: t('openLoans'), count: openLoans, icon: PackageSearch, color: 'text-ink', bg: 'bg-border', link: '/issuances/open-loans' },
  ];

  if (currentUser.role === 'Employee') {
    return (
      <div>
        <PageHeader title={t('dashboard')} />
        <div className="bg-surface p-6 rounded-lg border border-border text-center">
          <p className="text-body mb-4">You are logged in as an Employee.</p>
          <Link to="/my-ppe" className="text-accent hover:underline">Go to My PPE</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={t('dashboard')} 
        subtitle="Real-time compliance and stock tracking" 
        action={<Button onClick={() => window.location.href='/issuances/new'}>Issue New PPE</Button>}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
            {statCards.map((stat, idx) => (
              <Link key={idx} to={stat.link} className={`block p-4 bg-surface border border-border hover:bg-canvas transition-colors ${stat.count === 0 ? 'opacity-60 grayscale' : ''}`}>
                <div className="text-[12px] font-bold text-body uppercase tracking-wider mb-2">{stat.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-semibold ${stat.color}`}>{String(stat.count).padStart(2, '0')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-sm p-5 flex flex-col justify-center items-center text-center">
          <div className="text-[12px] font-bold text-body uppercase tracking-wider mb-4">Total Inventory Value</div>
          <div className="text-4xl font-semibold text-ink">EGP {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-body mt-2">Based on current stock across all locations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-surface border border-border rounded-sm flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center bg-canvas">
            <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-safety-amber-signal" />
              Low Stock Alerts
            </h3>
            <span className="text-[11px] font-medium text-body bg-safety-amber-signal/20 text-safety-amber-signal px-2 py-0.5 rounded-full">{lowStockAlerts.length} Action Needed</span>
          </div>
          <div className="flex-1 overflow-auto">
            {lowStockAlerts.length === 0 ? (
              <div className="p-8 text-center text-body">
                <PackageSearch className="w-8 h-8 mx-auto mb-3 text-body/50" />
                <p>All stock levels are optimal.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {lowStockAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 hover:bg-canvas transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-ink">{language === 'en' ? alert.item.nameEn : alert.item.nameAr}</div>
                      <div className="text-xs text-body">{language === 'en' ? alert.location.nameEn : alert.location.nameAr}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-safety-red">{alert.qty} {alert.item.uom || 'Unit'}</div>
                      <div className="text-[10px] text-body">Reorder at {alert.reorderLevel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-sm flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center bg-canvas">
            <h3 className="text-xs font-bold uppercase tracking-wider text-body">Recent Issuances</h3>
            <Link to="/issuances" className="text-[11px] font-medium text-body cursor-pointer hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-hidden">
            <DataTable 
              data={recentIssuances}
              keyExtractor={(item) => item.id}
              columns={[
                { key: 'issueDate', header: 'Date', render: (i) => format(new Date(i.issueDate), 'MMM d, yyyy') },
                { key: 'target', header: 'Issued To', render: (i) => {
                  if (i.employeeId) {
                    const emp = usePPEStore.getState().employees.find(e => e.id === i.employeeId);
                    return emp?.name || i.employeeId;
                  }
                  return `${i.holderName}`;
                }},
                { key: 'item', header: 'Item', render: (i) => {
                  if (i.ppeItemId) {
                    const ppe = ppeItems.find(p => p.id === i.ppeItemId);
                    return ppe ? (language === 'en' ? ppe.nameEn : ppe.nameAr) : i.ppeItemId;
                  }
                  if (i.kitId) {
                    const kit = usePPEStore.getState().kits?.find(k => k.id === i.kitId);
                    return kit ? (language === 'en' ? kit.nameEn : kit.nameAr) + ' (Kit)' : 'Kit';
                  }
                  return 'Unknown';
                }},
                { key: 'qty', header: 'Qty', render: (i) => i.quantity },
                { key: 'status', header: 'Status', render: (i) => (
                  <StatusBadge 
                    status={i.status === 'issued' ? 'info' : i.status === 'returned' ? 'success' : 'error'} 
                    label={i.status} 
                  />
                )},
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
