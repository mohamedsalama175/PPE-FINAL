import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  PackageSearch, AlertTriangle, ShieldAlert, CheckCircle2, 
  RotateCcw, ArrowRightLeft, Plus, Lock, AlertOctagon, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Batch } from '../types';

export default function Stock() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { 
    currentUser, 
    locations, 
    ppeItems, 
    batches, 
    releaseQuarantine 
  } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [locationFilter, setLocationFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [lowStockOnly, setLowStockOnly] = React.useState(false);

  // Quarantine release modal state
  const [quarantineModal, setQuarantineModal] = React.useState<{
    isOpen: boolean;
    batch: Batch | null;
    reason: string;
    error?: string;
  }>({
    isOpen: false,
    batch: null,
    reason: ''
  });

  // Scoped locations based on RBAC (BD-I462)
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt);
    }
    return locations.filter(l => l.active && !l.deletedAt && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Flatten batches with Item and Location details
  const stockRows = React.useMemo(() => {
    if (isBlockedKeeper) return [];

    const allowedLocIds = assignedLocations.map(l => l.id);

    return batches
      .filter(b => allowedLocIds.includes(b.locationId))
      .map(b => {
        const item = ppeItems.find(p => p.id === b.ppeItemId);
        const loc = locations.find(l => l.id === b.locationId);
        const reorderLevel = item?.reorderLevels[b.locationId] || 0;
        const isLow = b.availableQty < reorderLevel && reorderLevel > 0;

        return {
          batch: b,
          locationName: loc?.nameEn || b.locationId,
          locationSite: loc?.site || 'Unknown',
          locationCondition: loc?.stockCondition || 'New',
          itemCode: item?.itemCode || 'Unknown',
          itemName: item ? (language === 'en' ? item.nameEn : item.nameAr) : b.ppeItemId,
          category: item?.category || 'General',
          riskCategory: item?.riskCategory || 'Category I',
          uom: item?.uom || 'Piece',
          reorderLevel,
          isLow
        };
      })
      .filter(row => {
        const matchSearch = row.itemCode.toLowerCase().includes(search.toLowerCase()) ||
                            row.itemName.toLowerCase().includes(search.toLowerCase()) ||
                            row.batch.batchNumber.toLowerCase().includes(search.toLowerCase());
        const matchLoc = locationFilter === 'all' || row.batch.locationId === locationFilter;
        const matchStatus = statusFilter === 'all' || row.batch.status === statusFilter;
        const matchLow = !lowStockOnly || row.isLow;

        return matchSearch && matchLoc && matchStatus && matchLow;
      });
  }, [batches, assignedLocations, ppeItems, locations, isBlockedKeeper, search, locationFilter, statusFilter, lowStockOnly, language]);

  const handleOpenReleaseModal = (b: Batch) => {
    setQuarantineModal({
      isOpen: true,
      batch: b,
      reason: ''
    });
  };

  const handleConfirmRelease = () => {
    if (!quarantineModal.batch) return;
    if (quarantineModal.reason.trim().length < 20) {
      setQuarantineModal(prev => ({
        ...prev,
        error: 'Release justification requires a minimum of 20 characters.'
      }));
      return;
    }

    releaseQuarantine(quarantineModal.batch.id, quarantineModal.reason.trim());
    setQuarantineModal({ isOpen: false, batch: null, reason: '' });
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted (0 Assigned Locations)</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          You are signed in as an Unassigned Store Keeper. In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from stock management and inventory screens.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('stock')}
        subtitle="Batch-level inventory monitoring, quarantine management, and low-stock reorder triggers (BD-I466)"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/stock/transfers/new')}>
              <ArrowRightLeft className="w-3.5 h-3.5 me-1.5" /> Transfer Stock
            </Button>
            <Button size="sm" onClick={() => navigate('/stock/adjustments')}>
              <Plus className="w-3.5 h-3.5 me-1.5" /> Stock Adjustments
            </Button>
          </div>
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search batch, code or item name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-44">
          <option value="all">All Accessible Locations</option>
          {assignedLocations.map(l => (
            <option key={l.id} value={l.id}>{l.nameEn} ({l.stockCondition})</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Quarantined">Quarantined</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Depleted">Depleted</option>
        </Select>

        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
            className="rounded text-red-600 focus:ring-0"
          />
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock Only
          </span>
        </label>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={stockRows}
          keyExtractor={(item) => item.batch.id}
          emptyState={<EmptyState icon={<PackageSearch className="w-8 h-8 text-slate-400" />} title="No stock records match filters" />}
          columns={[
            {
              key: 'location',
              header: 'Location & Condition',
              className: 'w-44',
              render: (r) => (
                <div>
                  <span className="font-bold text-slate-900 block">{r.locationName}</span>
                  <div className="mt-1">
                    <StatusBadge
                      status={r.locationCondition === 'New' ? 'success' : r.locationCondition === 'Used' ? 'info' : 'danger'}
                      size="sm"
                      label={`${r.locationCondition} Pool`}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'item',
              header: 'Equipment Item',
              render: (r) => (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-teal-700 ">{r.itemCode}</span>
                    <span className="text-slate-400 ">•</span>
                    <span className="font-bold text-slate-900 ">{r.itemName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Variant: {r.batch.variantKey || 'Standard'} • Cat: {r.category}
                  </span>
                </div>
              )
            },
            {
              key: 'batchNumber',
              header: 'Batch No & Expiry',
              className: 'w-36 font-mono text-xs',
              render: (r) => (
                <div>
                  <span className="font-bold text-slate-800 block">{r.batch.batchNumber}</span>
                  <span className="text-[10px] text-slate-400 ">
                    Exp: {r.batch.manufacturerExpiryDate || '—'}
                  </span>
                </div>
              )
            },
            {
              key: 'stockMath',
              header: 'Stock Quantities (On Hand | Quarantined | Available)',
              className: 'w-64 text-end',
              render: (r) => (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-end gap-2 text-xs font-mono">
                    <span className="text-slate-500 " title="On Hand">{r.batch.quantity}</span>
                    <span className="text-slate-300 ">|</span>
                    <span className={`font-semibold ${r.batch.quarantinedQty > 0 ? 'text-amber-700 ' : 'text-slate-400 '}`} title="Quarantined">
                      {r.batch.quarantinedQty}
                    </span>
                    <span className="text-slate-300 ">|</span>
                    <span className="font-bold text-slate-900 text-sm" title="Available (On Hand - Quarantined)">
                      {r.batch.availableQty}
                    </span>
                    <span className="text-[10px] text-slate-400 ">{r.uom}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Reorder Trigger: {r.reorderLevel} {r.uom}
                  </span>
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status & Watchlist',
              className: 'w-36 text-center',
              render: (r) => (
                <div className="space-y-1 flex flex-col items-center">
                  <StatusBadge
                    status={
                      r.batch.status === 'Quarantined' ? 'warning' :
                      r.batch.status === 'Active' ? 'success' :
                      r.batch.status === 'Expired' ? 'danger' : 'neutral'
                    }
                    label={r.batch.status}
                  />

                  {r.isLow && (
                    <StatusBadge status="danger" size="sm" pulse>
                      <AlertTriangle className="w-2.5 h-2.5 me-0.5 inline" />
                      Low Stock
                    </StatusBadge>
                  )}
                </div>
              )
            },
            {
              key: 'actions',
              header: '',
              className: 'w-32 text-end',
              render: (r) => (
                <div className="flex items-center justify-end gap-1">
                  {r.batch.quarantinedQty > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      color="warning"
                      onClick={() => handleOpenReleaseModal(r.batch)}
                      className="text-[10px] h-7 px-2"
                    >
                      <RotateCcw className="w-3 h-3 me-1" /> Release
                    </Button>
                  )}
                </div>
              )
            }
          ]}
        />
      </ContainerCard>

      {/* Release Quarantine Modal (NEW-03) */}
      <Modal
        opened={quarantineModal.isOpen && !!quarantineModal.batch}
        onClose={() => setQuarantineModal({ isOpen: false, batch: null, reason: '' })}
        title="Release Batch from Quarantine (NEW-03)"
        icon={<RotateCcw className="w-5 h-5 text-amber-500" />}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setQuarantineModal({ isOpen: false, batch: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmRelease}>
              Confirm Release
            </Button>
          </div>
        }
      >
        {quarantineModal.batch && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 ">
              You are releasing <strong>{quarantineModal.batch.quarantinedQty} units</strong> of Batch{' '}
              <strong>{quarantineModal.batch.batchNumber}</strong> back into active available stock.
            </p>

            <Textarea
              label="Release Justification Reason (Min 20 characters)"
              required
              rows={3}
              value={quarantineModal.reason}
              onChange={e => setQuarantineModal(prev => ({ ...prev, reason: e.target.value, error: undefined }))}
              placeholder="State the technical inspection results or manufacturer clearance justifying release..."
              error={quarantineModal.error}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
