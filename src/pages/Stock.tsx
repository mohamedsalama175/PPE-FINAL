import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { PackageSearch, ArrowRightLeft, ShieldAlert, CheckCircle2, AlertTriangle, Layers, X } from 'lucide-react';
import { StockBalance, PPEItem, Location, Batch } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function Stock() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { stockBalances, ppeItems, locations, batches, currentUser, quarantineBatch, releaseQuarantineBatch } = usePPEStore();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const addToast = useToastStore(s => s.addToast);
  
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(initialFilter || 'all');
  const [locationFilter, setLocationFilter] = React.useState('all');

  // Quarantine Batch Inspection Modal
  const [batchModal, setBatchModal] = React.useState<{ item: PPEItem; loc: Location } | null>(null);
  const [quarantineReason, setQuarantineReason] = React.useState('');
  const [quarantineQty, setQuarantineQty] = React.useState(1);

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper, locations]);

  const viewableLocations = isStoreKeeper ? locations.filter(l => myLocations.includes(l.id)) : locations;

  const enrichedBalances = React.useMemo(() => {
    return stockBalances.map(b => {
      const item = ppeItems.find(i => i.id === b.ppeItemId);
      const loc = locations.find(l => l.id === b.locationId);
      const quarantined = b.quarantinedOnHand || 0;
      const available = Math.max(0, b.quantityOnHand - quarantined);
      
      const locReorder = item?.locationReorderLevels?.find(lr => lr.locationId === b.locationId)?.reorderLevel;
      const effectiveReorder = locReorder !== undefined ? locReorder : item?.reorderLevel;

      let status: 'inStock' | 'lowStock' | 'outOfStock' = 'inStock';
      if (available === 0 && b.quantityOnHand === 0) status = 'outOfStock';
      else if (effectiveReorder !== undefined && effectiveReorder > 0 && available < effectiveReorder) status = 'lowStock';

      return {
        ...b,
        item,
        loc,
        available,
        quarantined,
        effectiveReorder,
        status
      };
    }).filter(b => {
      if (isStoreKeeper && !myLocations.includes(b.locationId)) return false;
      if (locationFilter !== 'all' && b.locationId !== locationFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'out_of_stock' && b.status !== 'outOfStock') return false;
        if (statusFilter === 'low_stock' && b.status !== 'lowStock') return false;
        if (statusFilter === 'quarantined' && (b.quarantinedOnHand || 0) <= 0) return false;
      }
      if (search && b.item) {
        const q = search.toLowerCase();
        return b.item.itemCode.toLowerCase().includes(q) || b.item.nameEn.toLowerCase().includes(q) || b.item.nameAr.includes(q);
      }
      return true;
    });
  }, [stockBalances, ppeItems, locations, isStoreKeeper, myLocations, locationFilter, statusFilter, search]);

  const activeBatchesInModal = React.useMemo(() => {
    if (!batchModal) return [];
    return batches.filter(b => b.ppeItemId === batchModal.item.id && b.locationId === batchModal.loc.id);
  }, [batchModal, batches]);

  const handleApplyQuarantine = (batch: Batch) => {
    if (!quarantineReason || quarantineReason.length < 5) {
      addToast('A valid reason (minimum 5 characters) is mandatory to quarantine a batch.', 'error');
      return;
    }
    if (quarantineQty <= 0 || quarantineQty > batch.availableQty) {
      addToast(`Quantity must be between 1 and ${batch.availableQty}.`, 'error');
      return;
    }
    quarantineBatch(batch.id, quarantineQty, quarantineReason, currentUser.id);
    addToast('Batch quantity quarantined successfully.', 'success');
    setQuarantineReason('');
  };

  const handleReleaseQuarantine = (batch: Batch) => {
    const qQty = batch.quarantinedQty || 0;
    if (qQty <= 0) return;
    releaseQuarantineBatch(batch.id, qQty, currentUser.id);
    addToast('Quarantine released and returned to available stock.', 'success');
  };

  if (isStoreKeeper && myLocations.length === 0) {
    return (
      <div>
        <PageHeader title={t('stock')} />
        <EmptyState 
          icon={<PackageSearch />} 
          title="No locations assigned" 
          description="You must be assigned to at least one location to view stock." 
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={t('stock')} 
        subtitle="Real-time multi-location stock on hand, available balances, and batch quarantine"
        actions={
          <div className="flex gap-2">
            {['Admin', 'HSE Supervisor'].includes(currentUser.role) && (
              <Button variant="secondary" onClick={() => navigate('/stock/opening-balances/new')}>Opening Balance</Button>
            )}
            <Button onClick={() => navigate('/stock/transfers/new')}><ArrowRightLeft className="w-4 h-4 mr-2" /> {t('transfer')}</Button>
          </div>
        } 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-48">
          <option value="all">All Locations</option>
          {viewableLocations.map(l => (
            <option key={l.id} value={l.id}>{language === 'en' ? l.nameEn : l.nameAr}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="all">All Stock Statuses</option>
          <option value="low_stock">Low Stock (≤ Reorder)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
          <option value="quarantined">Has Quarantined</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={enrichedBalances}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<PackageSearch />} title="No stock records found" />}
        columns={[
          { key: 'item', header: 'PPE Item', render: (b) => (
            <div>
              <div className="font-semibold text-ink">{b.item ? (language === 'en' ? b.item.nameEn : b.item.nameAr) : b.ppeItemId}</div>
              <div className="text-xs font-mono text-body">{b.item?.itemCode} &middot; Reorder at {b.item?.reorderLevel} {b.item?.uom}</div>
            </div>
          )},
          { key: 'location', header: 'Location', render: (b) => (
            <div>
              <div className="font-medium text-ink">{b.loc ? (language === 'en' ? b.loc.nameEn : b.loc.nameAr) : b.locationId}</div>
              <div className="text-[11px] text-body">{b.loc?.site} &middot; {b.loc?.locationType}</div>
            </div>
          )},
          { key: 'available', header: 'Available (G9)', render: (b) => (
            <div className="text-center font-bold text-sm text-safety-green">
              {b.available} <span className="text-[11px] font-normal text-body">{b.item?.uom || ''}</span>
            </div>
          )},
          { key: 'quarantined', header: 'Quarantined', render: (b) => (
            <div className="text-center font-bold text-sm text-safety-amber-signal">
              {b.quarantined > 0 ? (
                <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {b.quarantined} {b.item?.uom || ''}
                </span>
              ) : (
                <span className="text-body font-normal">0</span>
              )}
            </div>
          )},
          { key: 'total', header: 'Total On Hand', render: (b) => (
            <div className="text-right font-bold text-sm text-ink font-mono">
              {b.quantityOnHand} {b.item?.uom || ''}
            </div>
          )},
          { key: 'status', header: 'Status', render: (b) => (
            <StatusBadge 
              status={b.status === 'outOfStock' ? 'error' : b.status === 'lowStock' ? 'warning' : 'success'} 
              label={b.status === 'outOfStock' ? 'Out of Stock' : b.status === 'lowStock' ? 'Low Stock' : 'In Stock'} 
            />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (b) => (
            b.item && b.loc ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setBatchModal({ item: b.item!, loc: b.loc! })}
                title="Inspect Batches & Quarantine"
              >
                <Layers className="w-3.5 h-3.5 mr-1" /> Batches
              </Button>
            ) : null
          )}
        ]}
      />

      {/* Batch & Quarantine Inspection Modal (G9) */}
      {batchModal && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-canvas">
              <div>
                <h3 className="font-bold text-ink text-sm">
                  Batches & Quarantine Management: {batchModal.item.nameEn}
                </h3>
                <p className="text-xs text-body mt-0.5">
                  Location: <span className="font-semibold text-ink">{batchModal.loc.nameEn}</span>
                </p>
              </div>
              <button onClick={() => setBatchModal(null)} className="text-body hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Batch #</th>
                      <th className="p-2.5">Expiry Date</th>
                      <th className="p-2.5 text-right">Available</th>
                      <th className="p-2.5 text-right">Quarantined</th>
                      <th className="p-2.5 text-right">Cost/Unit</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeBatchesInModal.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-body italic">
                          No active batch records found for this item at this location.
                        </td>
                      </tr>
                    ) : (
                      activeBatchesInModal.map((b) => (
                        <tr key={b.id} className="hover:bg-canvas/50">
                          <td className="p-2.5 font-mono font-bold text-ink">{b.batchNumber}</td>
                          <td className="p-2.5">{format(new Date(b.expiryDate), 'yyyy-MM-dd')}</td>
                          <td className="p-2.5 text-right font-bold text-safety-green">{b.availableQty}</td>
                          <td className="p-2.5 text-right font-bold text-safety-amber-signal">
                            {b.quarantinedQty || 0}
                            {b.quarantineReason && (
                              <div className="text-[10px] text-body italic font-normal">{b.quarantineReason}</div>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono">{b.costPerUnit ? `EGP ${b.costPerUnit.toFixed(2)}` : '-'}</td>
                          <td className="p-2.5 text-right">
                            {(b.quarantinedQty || 0) > 0 && (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="text-[11px] h-7 px-2"
                                onClick={() => handleReleaseQuarantine(b)}
                              >
                                Release
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Quarantine Action Form */}
              {activeBatchesInModal.some(b => b.availableQty > 0) && (
                <div className="bg-canvas p-4 rounded border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-safety-amber-signal" />
                    Quarantine Stock Batch (Rule G9)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-body mb-1">Target Batch</label>
                      <select 
                        id="targetBatchSelect"
                        className="w-full text-xs p-2 rounded border border-border bg-surface"
                      >
                        {activeBatchesInModal.filter(b => b.availableQty > 0).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} (Avail: {b.availableQty})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-body mb-1">Qty to Quarantine</label>
                      <input 
                        type="number"
                        min="1"
                        value={quarantineQty}
                        onChange={e => setQuarantineQty(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-xs p-2 rounded border border-border bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-body mb-1">Mandatory Reason</label>
                      <input 
                        type="text"
                        placeholder="e.g. Quality inspection hold..."
                        value={quarantineReason}
                        onChange={e => setQuarantineReason(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-border bg-surface"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => {
                        const selectEl = document.getElementById('targetBatchSelect') as HTMLSelectElement;
                        const bId = selectEl?.value;
                        const targetBatch = activeBatchesInModal.find(b => b.id === bId);
                        if (targetBatch) handleApplyQuarantine(targetBatch);
                      }}
                    >
                      Quarantine Selected Batch
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-canvas flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setBatchModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
