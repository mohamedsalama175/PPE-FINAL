import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Modal } from '../components/ui/Modal';
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { useToastStore } from '../store/toastStore';
import { useSwal } from '../lib/useSwal';
import { 
  Plus, ArrowDownLeft, ArrowUpRight, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, FileSpreadsheet, Lock, AlertOctagon, 
  Download, Eye, RotateCcw, Clock, Check, X, Shield, Info, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { StockAdjustment, Batch, PPEItem } from '../types';

export default function StockAdjustments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);
  const { showConfirm, showDeleteReason } = useSwal();

  const { 
    currentUser, 
    locations, 
    ppeItems, 
    batches, 
    stockAdjustments, 
    recordStockIn, 
    recordStockOut, 
    postOpeningBalance, 
    closeOpeningBalanceForLocation, 
    reviewAdjustment, 
    releaseQuarantine,
    itemGroups,
    attributes
  } = usePPEStore();

  // Tab management: 'in' | 'out' | 'ob' | 'queue'
  const activeTab = (searchParams.get('tab') as 'in' | 'out' | 'ob' | 'queue') || 'in';
  const setTab = (tab: 'in' | 'out' | 'ob' | 'queue') => {
    setSearchParams({ tab });
  };

  // Scoped locations (BD-I462)
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap');
    }
    return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap' && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // ----------------------------------------------------
  // TAB 1: STOCK IN STATE & HANDLERS (NEW-02)
  // ----------------------------------------------------
  const [inLocationId, setInLocationId] = React.useState('');
  const [inItemId, setInItemId] = React.useState('');
  const [inVariantKey, setInVariantKey] = React.useState('');
  const [inBatchMode, setInBatchMode] = React.useState<'new' | 'existing'>('new');
  const [inBatchNumber, setInBatchNumber] = React.useState('');
  const [inExistingBatchId, setInExistingBatchId] = React.useState('');
  const [inQuantity, setInQuantity] = React.useState<number>(100);
  const [inExpiryDate, setInExpiryDate] = React.useState('');
  const [inSupplierNote, setInSupplierNote] = React.useState('');
  const [inReasonCategory, setInReasonCategory] = React.useState<'Purchase Receipt' | 'Stock Count Correction' | 'Manual Correction' | 'Other'>('Purchase Receipt');
  const [inReasonDetail, setInReasonDetail] = React.useState('');
  const [inSubmitting, setInSubmitting] = React.useState(false);

  // Set default location
  React.useEffect(() => {
    if (assignedLocations.length > 0 && !inLocationId) {
      setInLocationId(assignedLocations[0].id);
    }
  }, [assignedLocations, inLocationId]);

  const selectedInItem = React.useMemo(() => ppeItems.find(p => p.id === inItemId), [ppeItems, inItemId]);
  const selectedInLoc = React.useMemo(() => locations.find(l => l.id === inLocationId), [locations, inLocationId]);

  // Available items for selected location (must be linked to location)
  const availableInItems = React.useMemo(() => {
    if (!inLocationId) return [];
    return ppeItems.filter(p => p.active && !p.deletedAt && (p.locationIds || []).includes(inLocationId));
  }, [ppeItems, inLocationId]);

  // Variants for selected Item
  const availableInVariants = React.useMemo(() => {
    if (!selectedInItem) return [];
    const group = itemGroups.find(g => g.id === selectedInItem.itemGroupId);
    if (!group || group.assignedAttributeIds.length === 0) return ['Standard'];
    // Generate simple combinations or common sizes
    const groupAttrs = attributes.filter(a => group.assignedAttributeIds.includes(a.id));
    const sizeAttr = groupAttrs.find(a => a.code.toUpperCase() === 'SIZE');
    if (sizeAttr && sizeAttr.values.length > 0) {
      return sizeAttr.values.map(v => v.valueEn);
    }
    return ['Standard', 'Size M', 'Size L', 'Size XL'];
  }, [selectedInItem, itemGroups, attributes]);

  // Existing batches of same item+variant+location
  const existingBatchesForIn = React.useMemo(() => {
    if (!inItemId || !inLocationId) return [];
    return batches.filter(b => b.ppeItemId === inItemId && b.locationId === inLocationId);
  }, [batches, inItemId, inLocationId]);

  const handleSelectExistingBatch = (batchId: string) => {
    setInExistingBatchId(batchId);
    const b = batches.find(x => x.id === batchId);
    if (b) {
      setInBatchNumber(b.batchNumber);
      if (b.expiryDate) {
        setInExpiryDate(b.expiryDate);
      }
    }
  };

  const isInApprovalRequired = selectedInItem?.riskCategory === 'Category III' && inReasonCategory !== 'Purchase Receipt';

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inLocationId || !inItemId || !inBatchNumber.trim()) {
      addToast('Please fill all mandatory fields (Location, Item, Batch Number).', 'error');
      return;
    }
    if (inQuantity <= 0) {
      addToast('Quantity must be greater than zero.', 'error');
      return;
    }
    if (inReasonCategory !== 'Purchase Receipt' && inReasonDetail.trim().length < 10) {
      addToast('Reason detail must be at least 10 characters for corrections.', 'error');
      return;
    }
    if (inExpiryDate && new Date(inExpiryDate) < new Date()) {
      addToast('Manufacturer expiry date cannot be in the past.', 'error');
      return;
    }

    setInSubmitting(true);
    const result = recordStockIn({
      locationId: inLocationId,
      ppeItemId: inItemId,
      variantKey: inVariantKey || availableInVariants[0] || 'Standard',
      batchNumber: inBatchNumber.trim(),
      quantity: inQuantity,
      manufacturerExpiryDate: inExpiryDate || undefined,
      supplierDeliveryNote: inSupplierNote.trim() || undefined,
      reasonCategory: inReasonCategory,
      reasonDetail: inReasonDetail.trim() || `Stock IN received under ${inReasonCategory}`
    });
    setInSubmitting(false);

    if (result.requiresApproval) {
      addToast(`Adjustment ${result.reference} submitted for HSE Supervisor approval.`, 'info');
    } else {
      addToast(`Stock IN posted successfully (${result.reference}).`, 'success');
      // Reset form
      setInBatchNumber('');
      setInReasonDetail('');
      setInSupplierNote('');
    }
  };

  // ----------------------------------------------------
  // TAB 2: STOCK OUT & QUARANTINE STATE & HANDLERS (NEW-03)
  // ----------------------------------------------------
  const [outLocationId, setOutLocationId] = React.useState('');
  const [outItemId, setOutItemId] = React.useState('');
  const [outBatchId, setOutBatchId] = React.useState('');
  const [outQuantity, setOutQuantity] = React.useState<number>(1);
  const [outReasonCategory, setOutReasonCategory] = React.useState<
    'Expired Disposal' | 'Physical Damage' | 'Stock Count Discrepancy' | 'Supplier Return' | 'Quarantine' | 'Manual Correction' | 'Other'
  >('Physical Damage');
  const [outReasonDetail, setOutReasonDetail] = React.useState('');
  const [outQuarantineReason, setOutQuarantineReason] = React.useState('');
  const [outSubmitting, setOutSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (assignedLocations.length > 0 && !outLocationId) {
      setOutLocationId(assignedLocations[0].id);
    }
  }, [assignedLocations, outLocationId]);

  // Inactive items ARE allowed here (BD-I444 / NEW-03)
  const availableOutItems = React.useMemo(() => {
    if (!outLocationId) return [];
    return ppeItems.filter(p => !p.deletedAt && (p.locationIds || []).includes(outLocationId));
  }, [ppeItems, outLocationId]);

  const selectedOutItem = React.useMemo(() => ppeItems.find(p => p.id === outItemId), [ppeItems, outItemId]);
  const selectedOutBatch = React.useMemo(() => batches.find(b => b.id === outBatchId), [batches, outBatchId]);

  // Eligible batches for chosen location & item
  const eligibleOutBatches = React.useMemo(() => {
    if (!outLocationId || !outItemId) return [];
    return batches.filter(b => b.locationId === outLocationId && b.ppeItemId === outItemId);
  }, [batches, outLocationId, outItemId]);

  const isOutApprovalRequired = selectedOutItem?.riskCategory === 'Category III';
  const isQuarantineSelected = outReasonCategory === 'Quarantine';

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outLocationId || !outItemId || !outBatchId || !selectedOutBatch) {
      addToast('Please select Location, Item, and Batch.', 'error');
      return;
    }
    if (outQuantity <= 0) {
      addToast('Quantity must be greater than zero.', 'error');
      return;
    }
    if (outQuantity > selectedOutBatch.availableQty) {
      addToast(`Insufficient stock. Available: ${selectedOutBatch.availableQty}. Requested: ${outQuantity}.`, 'error');
      return;
    }
    if (outReasonDetail.trim().length < 10) {
      addToast('Reason detail must be at least 10 characters long.', 'error');
      return;
    }
    if (isQuarantineSelected && outQuarantineReason.trim().length < 20) {
      addToast('Quarantine justification must be at least 20 characters long.', 'error');
      return;
    }

    setOutSubmitting(true);
    const result = recordStockOut({
      locationId: outLocationId,
      ppeItemId: outItemId,
      variantKey: selectedOutBatch.variantKey || 'Standard',
      batchNumber: selectedOutBatch.batchNumber,
      quantity: outQuantity,
      reasonCategory: outReasonCategory,
      reasonDetail: outReasonDetail.trim(),
      quarantineReason: isQuarantineSelected ? outQuarantineReason.trim() : undefined
    });
    setOutSubmitting(false);

    if (result.requiresApproval) {
      addToast(`Stock OUT adjustment ${result.reference} requires HSE Supervisor approval.`, 'info');
    } else {
      addToast(
        isQuarantineSelected
          ? `Batch ${selectedOutBatch.batchNumber} has been placed in Quarantine (${result.reference}).`
          : `Stock OUT deduction posted successfully (${result.reference}).`,
        'success'
      );
      setOutQuantity(1);
      setOutReasonDetail('');
      setOutQuarantineReason('');
    }
  };

  // ----------------------------------------------------
  // TAB 3: OPENING BALANCE STATE & HANDLERS (NEW-01)
  // ----------------------------------------------------
  const [obLocationId, setObLocationId] = React.useState('');
  const [obLines, setObLines] = React.useState<Array<{
    id: string;
    ppeItemId: string;
    variantKey: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
  }>>([
    { id: '1', ppeItemId: '', variantKey: 'Standard', batchNumber: 'OB-2026-001', quantity: 50, expiryDate: '2028-12-31' }
  ]);
  const [obSimulatedErrors, setObSimulatedErrors] = React.useState<string[]>([]);
  const [showObCloseModal, setShowObCloseModal] = React.useState(false);

  React.useEffect(() => {
    if (assignedLocations.length > 0 && !obLocationId) {
      setObLocationId(assignedLocations[0].id);
    }
  }, [assignedLocations, obLocationId]);

  const selectedObLoc = React.useMemo(() => locations.find(l => l.id === obLocationId), [locations, obLocationId]);
  const isObClosed = selectedObLoc?.openingBalanceStatus === 'Closed';

  const handleAddObLine = () => {
    setObLines(prev => [
      ...prev,
      {
        id: String(Date.now()),
        ppeItemId: availableInItems[0]?.id || '',
        variantKey: 'Standard',
        batchNumber: `OB-2026-${Math.floor(100 + Math.random() * 900)}`,
        quantity: 25,
        expiryDate: '2028-12-31'
      }
    ]);
  };

  const handleRemoveObLine = (id: string) => {
    setObLines(prev => prev.filter(l => l.id !== id));
  };

  const handleLoadExcelSimulation = () => {
    // Demo 40 rows: 38 valid, 2 simulated duplicate batch errors
    const demoLines = [
      { id: '1', ppeItemId: ppeItems[0]?.id || '', variantKey: 'Yellow', batchNumber: 'BATCH-EXCEL-01', quantity: 40, expiryDate: '2028-06-30' },
      { id: '2', ppeItemId: ppeItems[1]?.id || '', variantKey: 'Size L', batchNumber: 'BATCH-EXCEL-02', quantity: 120, expiryDate: '2027-12-31' },
      { id: '3', ppeItemId: ppeItems[2]?.id || '', variantKey: 'Standard', batchNumber: 'BATCH-EXCEL-03', quantity: 15, expiryDate: '2029-01-01' },
      { id: '4', ppeItemId: ppeItems[0]?.id || '', variantKey: 'Yellow', batchNumber: 'BATCH-EXCEL-01', quantity: 10, expiryDate: '2028-06-30' } // Duplicate!
    ];
    setObLines(demoLines);
    setObSimulatedErrors(['Row 4: Duplicate batch "BATCH-EXCEL-01" for same item at this location. Skipped.']);
 addToast('Excel template simulation loaded (4 rows, 1 flagged error).', 'info');
 };

 const handlePostOpeningBalance = () => {
 if (!obLocationId) {
 addToast('Please select a location.', 'error');
 return;
 }
 if (isObClosed) {
 addToast('Opening balance is closed for this location. Use a stock adjustment.', 'error');
 return;
 }

 const validLines = obLines.filter(l => l.ppeItemId && l.batchNumber && l.quantity > 0);
 if (validLines.length === 0) {
 addToast('Please enter at least one valid line.', 'error');
      return;
    }

    postOpeningBalance(obLocationId, validLines);
    addToast(`Opening balance successfully posted for ${selectedObLoc?.nameEn} (${validLines.length} lines).`, 'success');
  };

  const handleCloseOpeningBalance = () => {
    if (!obLocationId) return;
    closeOpeningBalanceForLocation(obLocationId);
    setShowObCloseModal(false);
    addToast(`Opening balance permanently locked for ${selectedObLoc?.nameEn}.`, 'success');
  };

  // ----------------------------------------------------
  // TAB 4: ADJUSTMENTS & APPROVALS QUEUE
  // ----------------------------------------------------
  const [queueStatusFilter, setQueueStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected' | 'applied'>('all');
  const [queueTypeFilter, setQueueTypeFilter] = React.useState<'all' | 'IN' | 'OUT'>('all');
  const [selectedAdjustment, setSelectedAdjustment] = React.useState<StockAdjustment | null>(null);

  const canApprove = ['Admin', 'HSE Supervisor'].includes(currentUser.role);

  const filteredAdjustments = React.useMemo(() => {
    return stockAdjustments
      .filter(a => {
        if (isStoreKeeper && !assignedLocations.some(l => l.id === a.locationId)) return false;
        if (queueStatusFilter !== 'all' && a.status !== queueStatusFilter) return false;
        if (queueTypeFilter !== 'all' && a.type !== queueTypeFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockAdjustments, isStoreKeeper, assignedLocations, queueStatusFilter, queueTypeFilter]);

  const handleReviewAction = async (adjId: string, action: 'approved' | 'rejected') => {
    if (action === 'approved') {
      const confirmed = await showConfirm(
        'Approve Adjustment?',
        'Are you sure you want to approve and apply this adjustment to stock inventory?',
        'Yes, Approve',
        false
      );
      if (!confirmed) return;
    } else {
      const reason = await showDeleteReason(
        'Reject Adjustment',
        'State reason for rejecting this adjustment...',
        'Rejection reason is required'
      );
      if (!reason) return;
    }

    const res = reviewAdjustment(adjId, action, currentUser.id);
    if (!res.success) {
      addToast(res.error || 'Review failed.', 'error');
    } else {
      addToast(`Adjustment ${action === 'approved' ? 'approved and applied' : 'rejected'}.`, 'success');
    }
  };

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

  const handleConfirmReleaseQuarantine = () => {
    if (!quarantineModal.batch) return;
    if (quarantineModal.reason.trim().length < 20) {
      setQuarantineModal(prev => ({
        ...prev,
        error: 'Release reason must contain at least 20 characters.'
      }));
      return;
    }
    releaseQuarantine(quarantineModal.batch.id, quarantineModal.reason.trim());
    addToast(`Quarantine released for batch ${quarantineModal.batch.batchNumber}.`, 'success');
    setQuarantineModal({ isOpen: false, batch: null, reason: '' });
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted (0 Assigned Locations)</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from stock management and adjustments.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('adjustments')}
        subtitle="Post Initial Balances (NEW-01), Record Stock IN (NEW-02), Record Stock OUT & Quarantine (NEW-03), and HSE Approvals"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'in' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('in')}
            >
              <ArrowDownLeft className="w-4 h-4 me-1.5" /> Stock IN
            </Button>
            <Button
              variant={activeTab === 'out' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('out')}
            >
              <ArrowUpRight className="w-4 h-4 me-1.5" /> Stock OUT
            </Button>
            <Button
              variant={activeTab === 'ob' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('ob')}
            >
              <FileSpreadsheet className="w-4 h-4 me-1.5" /> Opening Balance
            </Button>
            <Button
              variant={activeTab === 'queue' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('queue')}
            >
              <Clock className="w-4 h-4 me-1.5" /> Approvals & History
              {stockAdjustments.filter(a => a.status === 'pending').length > 0 && (
                <span className="ms-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                  {stockAdjustments.filter(a => a.status === 'pending').length}
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: RECORD STOCK IN (NEW-02) */}
      {/* ========================================================================= */}
      {activeTab === 'in' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ContainerCard className="lg:col-span-2 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  Record Stock IN (NEW-02)
                </h3>
                <p className="text-xs text-slate-500 ">Record received or discovered physical stock with batch traceability.</p>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 ">
                ADJ-IN-{new Date().getFullYear()}-XXXXX
              </span>
            </div>

            {isInApprovalRequired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">HSE Supervisor Approval Required:</span> This item is classified as{' '}
                  <span className="font-semibold">Risk Category III (Lethal/Irreversible Risk)</span> and the reason is a correction. Saving this entry will submit it for review before stock is increased.
                </div>
              </div>
            )}

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receiving Location <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={inLocationId}
                    onChange={e => {
                      setInLocationId(e.target.value);
                      setInItemId('');
                    }}
                    required
                  >
                    {assignedLocations.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {language === 'en' ? l.nameEn : l.nameAr} ({l.stockCondition})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PPE Item <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={inItemId}
                    onChange={e => {
                      setInItemId(e.target.value);
                      setInBatchNumber('');
                    }}
                    required
                  >
                    <option value="">Select linked active item...</option>
                    {availableInItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} — {language === 'en' ? item.nameEn : item.nameAr} ({item.riskCategory})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Variant / Size</label>
                  <Select value={inVariantKey} onChange={e => setInVariantKey(e.target.value)}>
                    {availableInVariants.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Add <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={inQuantity}
                    onChange={e => setInQuantity(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Batch Options */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="batchMode"
                      checked={inBatchMode === 'new'}
                      onChange={() => setInBatchMode('new')}
                    />
                    Create New Batch
                  </label>
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="batchMode"
                      checked={inBatchMode === 'existing'}
                      onChange={() => setInBatchMode('existing')}
                    />
                    Add to Existing Batch
                  </label>
                </div>

                {inBatchMode === 'new' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        New Batch Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. BATCH-2026-0099"
                        value={inBatchNumber}
                        onChange={e => setInBatchNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Manufacturer Expiry Date (Optional)
                      </label>
                      <Input
                        type="date"
                        value={inExpiryDate}
                        onChange={e => setInExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Existing Batch</label>
                    <Select
                      value={inExistingBatchId}
                      onChange={e => handleSelectExistingBatch(e.target.value)}
                    >
                      <option value="">Select batch...</option>
                      {existingBatchesForIn.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} (Current Available: {b.availableQty}) {b.expiryDate ? `- Exp: ${b.expiryDate}` : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={inReasonCategory}
                    onChange={e => setInReasonCategory(e.target.value as any)}
                  >
                    <option value="Purchase Receipt">Purchase Receipt</option>
                    <option value="Stock Count Correction">Stock Count Correction</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Delivery Note (Optional)</label>
                  <Input
                    placeholder="e.g. SafeTech Ltd / DN-2026-441"
                    value={inSupplierNote}
                    onChange={e => setInSupplierNote(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason Detail {inReasonCategory !== 'Purchase Receipt' && <span className="text-red-500">* (min 10 chars)</span>}
                </label>
                <textarea
                  className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder={
                    inReasonCategory === 'Purchase Receipt'
                      ? 'Optional note about shipment or PO...'
                      : 'Provide clear justification for physical stock increase (min 10 characters)...'
                  }
                  value={inReasonDetail}
                  onChange={e => setInReasonDetail(e.target.value)}
                  required={inReasonCategory !== 'Purchase Receipt'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 ">
                <Button type="button" variant="secondary" onClick={() => setTab('queue')}>
                  View History
                </Button>
                <Button type="submit" variant="primary" disabled={inSubmitting}>
                  {isInApprovalRequired ? 'Submit for HSE Approval' : 'Post Stock IN'}
                </Button>
              </div>
            </form>
          </ContainerCard>

          {/* Right Side Info Box */}
          <div className="space-y-4">
            <ContainerCard className="p-5 space-y-4 bg-slate-50 ">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" /> Stock IN Invariants
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc ps-4">
                <li>
                  <span className="font-semibold text-slate-800 ">Scrap Prevention:</span> Scrap-condition locations cannot receive Stock IN.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Risk Category III:</span> Corrections (non-purchase) on Category III items freeze until HSE Supervisor approves.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Used Stock:</span> Items added to a Used location are automatically tagged <span className="font-mono text-emerald-700 font-medium">Reused</span>.
                </li>
              </ul>
            </ContainerCard>

            {selectedInLoc && (
              <ContainerCard className="p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 ">Target Location Snapshot</h4>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Location:</span>
                    <span className="font-medium text-slate-800 ">{selectedInLoc.nameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Condition:</span>
                    <span className="font-semibold text-slate-700 ">{selectedInLoc.stockCondition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Capacity:</span>
                    <span className="font-mono text-slate-800 ">{selectedInLoc.capacityUnits ?? 'Unlimited'} units</span>
                  </div>
                </div>
              </ContainerCard>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECORD STOCK OUT & QUARANTINE (NEW-03) */}
      {/* ========================================================================= */}
      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ContainerCard className="lg:col-span-2 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                  Record Stock OUT & Quarantine (NEW-03)
                </h3>
                <p className="text-xs text-slate-500 ">Deduct stock for disposal, write-off, or immediately quarantine suspect batches.</p>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 ">
                ADJ-OUT-{new Date().getFullYear()}-XXXXX
              </span>
            </div>

            {isOutApprovalRequired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">HSE Supervisor Approval Required:</span> Category III item deductions require approval before deduction occurs. If quarantine is chosen, the batch is placed in quarantine immediately while deduction approval is pending.
                </div>
              </div>
            )}

            <form onSubmit={handleStockOutSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={outLocationId}
                    onChange={e => {
                      setOutLocationId(e.target.value);
                      setOutItemId('');
                      setOutBatchId('');
                    }}
                    required
                  >
                    {assignedLocations.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {language === 'en' ? l.nameEn : l.nameAr}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PPE Item <span className="text-red-500">* (Inactive allowed)</span>
                  </label>
                  <Select
                    value={outItemId}
                    onChange={e => {
                      setOutItemId(e.target.value);
                      setOutBatchId('');
                    }}
                    required
                  >
                    <option value="">Select item...</option>
                    {availableOutItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} — {language === 'en' ? item.nameEn : item.nameAr} {!item.active ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Batch <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={outBatchId}
                    onChange={e => setOutBatchId(e.target.value)}
                    required
                  >
                    <option value="">Select batch to deduct from...</option>
                    {eligibleOutBatches.map(b => {
                      const isQuarantined = b.status === 'Quarantined';
                      const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                      return (
                        <option key={b.id} value={b.id} disabled={isQuarantined}>
                          {b.batchNumber} (Avail: {b.availableQty}) [{b.status}] {isExpired ? '(Expired)' : ''}
                        </option>
                      );
                    })}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Deduct / Hold <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedOutBatch?.availableQty || 9999}
                    value={outQuantity}
                    onChange={e => setOutQuantity(parseInt(e.target.value) || 0)}
                    required
                  />
                  {selectedOutBatch && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      Max available in batch: <span className="font-mono font-bold text-slate-700">{selectedOutBatch.availableQty}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={outReasonCategory}
                  onChange={e => setOutReasonCategory(e.target.value as any)}
                >
                  <option value="Physical Damage">Physical Damage</option>
                  <option value="Quarantine">Quarantine (Immediate lock from issuing/transfers)</option>
                  <option value="Expired Disposal">Expired Disposal</option>
                  <option value="Stock Count Discrepancy">Stock Count Discrepancy</option>
                  <option value="Supplier Return">Supplier Return</option>
                  <option value="Manual Correction">Manual Correction</option>
                  <option value="Other">Other</option>
                </Select>
              </div>

              {isQuarantineSelected && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md space-y-2">
                  <label className="block text-xs font-bold text-purple-900">
                    Quarantine Justification <span className="text-red-600">* (min 20 characters)</span>
                  </label>
                  <p className="text-[11px] text-purple-700">
                    Batch quantity will be removed from <span className="font-semibold">Available</span> immediately and locked from single/kit issuing and transfers.
                  </p>
                  <textarea
                    className="w-full text-xs rounded border border-purple-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    rows={2}
                    placeholder="Enter detailed quarantine justification (e.g. recall notice, suspected counterfeit, physical failure during field test)..."
                    value={outQuarantineReason}
                    onChange={e => setOutQuarantineReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason Detail <span className="text-red-500">* (min 10 characters)</span>
                </label>
                <textarea
                  className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="Provide detailed explanation for this deduction..."
                  value={outReasonDetail}
                  onChange={e => setOutReasonDetail(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 ">
                <Button type="button" variant="secondary" onClick={() => setTab('queue')}>
                  View History
                </Button>
                <Button type="submit" variant="primary" disabled={outSubmitting}>
                  {isQuarantineSelected
                    ? 'Quarantine Batch'
                    : isOutApprovalRequired
                    ? 'Submit Deduction for Approval'
                    : 'Post Stock OUT'}
                </Button>
              </div>
            </form>
          </ContainerCard>

          {/* Right Side Summary */}
          <div className="space-y-4">
            <ContainerCard className="p-5 space-y-4 bg-slate-50 ">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" /> Stock OUT Rules
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc ps-4">
                <li>
                  <span className="font-semibold text-slate-800 ">Inactive Items:</span> Permitted in Stock OUT to purge dead or obsolete inventory.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Zero Stock Batches:</span> Zero-quantity batches remain preserved in the database for 7-year audit compliance.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Quarantine Logic:</span> Quarantined stock remains in <span className="font-medium text-slate-700 ">On Hand</span>, but drops to 0 in <span className="font-medium text-emerald-700 ">Available</span>.
                </li>
              </ul>
            </ContainerCard>

            {selectedOutBatch && (
              <ContainerCard className="p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 ">Selected Batch Details</h4>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Batch Number:</span>
                    <span className="font-mono font-medium text-slate-800 ">{selectedOutBatch.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Status:</span>
                    <span className="font-semibold text-slate-700 ">{selectedOutBatch.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Available Qty:</span>
                    <span className="font-mono text-emerald-700 font-bold">{selectedOutBatch.availableQty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 ">Quarantined Qty:</span>
                    <span className="font-mono text-purple-700 font-bold">{selectedOutBatch.quarantinedQty}</span>
                  </div>
                </div>
              </ContainerCard>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OPENING BALANCE (NEW-01) */}
      {/* ========================================================================= */}
      {activeTab === 'ob' && (
        <div className="space-y-6">
          <ContainerCard className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 ">Post Opening Balance (NEW-01)</h3>
                  {selectedObLoc && (
                    <StatusBadge
                      status={isObClosed ? 'neutral' : 'success'}
                      size="sm"
                      label={selectedObLoc.openingBalanceStatus}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter go-live inventory counts line-by-line or via Excel upload before locking the warehouse opening balance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={obLocationId}
                  onChange={e => setObLocationId(e.target.value)}
                  className="w-64"
                >
                  {assignedLocations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.nameEn} ({l.openingBalanceStatus})
                    </option>
                  ))}
                </Select>

                {!isObClosed && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowObCloseModal(true)}
                  >
                    <Lock className="w-3.5 h-3.5 me-1.5" /> Close Opening Balance
                  </Button>
                )}
              </div>
            </div>

            {isObClosed ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Opening Balance is Closed for this Location</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Opening balance entry has been permanently locked for <span className="font-semibold">{selectedObLoc?.nameEn}</span>. To make subsequent adjustments or add receipts, please use the <span className="font-semibold text-slate-700">Stock IN</span> or <span className="font-semibold text-slate-700">Stock OUT</span> tabs.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleAddObLine}>
                      <Plus className="w-3.5 h-3.5 me-1" /> Add Line
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleLoadExcelSimulation}>
                      <FileSpreadsheet className="w-3.5 h-3.5 me-1 text-emerald-600" /> Load Demo Excel (40 items)
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addToast('Template downloaded: PPE_Opening_Balance_Template.xlsx', 'info')}
                  >
                    <Download className="w-3.5 h-3.5 me-1" /> Download Template (.xlsx)
                  </Button>
                </div>

                {/* Line Grid */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">PPE Item</th>
                        <th className="p-2.5">Variant</th>
                        <th className="p-2.5">Batch Number</th>
                        <th className="p-2.5 w-24">Quantity</th>
                        <th className="p-2.5 w-36">Expiry Date</th>
                        <th className="p-2.5 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {obLines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <Select
                              value={line.ppeItemId}
                              onChange={e => {
                                const val = e.target.value;
                                setObLines(prev => prev.map(l => l.id === line.id ? { ...l, ppeItemId: val } : l));
                              }}
                            >
                              <option value="">Select Item...</option>
                              {ppeItems.filter(p => p.active && !p.deletedAt).map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.itemCode} — {p.nameEn}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="p-2.5">
                            <Input
                              value={line.variantKey}
                              onChange={e => {
                                const val = e.target.value;
                                setObLines(prev => prev.map(l => l.id === line.id ? { ...l, variantKey: val } : l));
                              }}
                              placeholder="e.g. Size M"
                            />
                          </td>
                          <td className="p-2.5">
                            <Input
                              value={line.batchNumber}
                              onChange={e => {
                                const val = e.target.value;
                                setObLines(prev => prev.map(l => l.id === line.id ? { ...l, batchNumber: val } : l));
                              }}
                              placeholder="e.g. BATCH-2026-001"
                            />
                          </td>
                          <td className="p-2.5">
                            <Input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setObLines(prev => prev.map(l => l.id === line.id ? { ...l, quantity: val } : l));
                              }}
                            />
                          </td>
                          <td className="p-2.5">
                            <Input
                              type="date"
                              value={line.expiryDate || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setObLines(prev => prev.map(l => l.id === line.id ? { ...l, expiryDate: val } : l));
                              }}
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveObLine(line.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Preview & Error Reporting (NEW-01) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-500">Valid Lines:</span>{' '}
                        <span className="font-bold text-emerald-700">
                          {obLines.filter(l => l.ppeItemId && l.batchNumber && l.quantity > 0).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Error Lines:</span>{' '}
                        <span className="font-bold text-red-600">{obSimulatedErrors.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Quantity:</span>{' '}
                        <span className="font-bold text-slate-800 font-mono">
                          {obLines.reduce((acc, l) => acc + (l.quantity || 0), 0)} pcs
                        </span>
                      </div>
                    </div>

                    {obSimulatedErrors.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => addToast('Opening_Balance_Error_Report.xlsx downloaded', 'info')}
                      >
                        <Download className="w-3.5 h-3.5 me-1 text-red-600" /> Download Error Report
                      </Button>
                    )}
                  </div>

                  {obSimulatedErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 space-y-1">
                      {obSimulatedErrors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setObLines([])}>
                    Clear Lines
                  </Button>
                  <Button variant="primary" onClick={handlePostOpeningBalance}>
                    <Check className="w-4 h-4 me-1.5" /> Confirm & Post Opening Balance
                  </Button>
                </div>
              </div>
            )}
          </ContainerCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADJUSTMENTS & APPROVALS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <FilterBar>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={queueStatusFilter}
                onChange={e => setQueueStatusFilter(e.target.value as any)}
                className="w-40 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="applied">Applied Directly</option>
              </Select>

              <Select
                value={queueTypeFilter}
                onChange={e => setQueueTypeFilter(e.target.value as any)}
                className="w-36 text-xs"
              >
                <option value="all">All Types</option>
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </Select>
            </div>
          </FilterBar>

          <ContainerCard noPadding className="overflow-hidden">
            <DataTable
              data={filteredAdjustments}
            keyExtractor={item => item.id}
            emptyState={<EmptyState icon={<Clock />} title="No adjustments found" />}
            columns={[
              {
                key: 'reference',
                header: 'Reference',
                render: a => <span className="font-mono text-xs font-medium text-slate-800">{a.reference}</span>
              },
              {
                key: 'createdAt',
                header: 'Date',
                render: a => format(new Date(a.createdAt), 'MMM d, yyyy')
              },
              {
                key: 'type',
                header: 'Type',
                render: a => (
                  <StatusBadge
                    status={a.type === 'IN' ? 'success' : 'error'}
                    label={a.type === 'IN' ? 'Stock IN' : 'Stock OUT'}
                    icon={false}
                  />
                )
              },
              {
                key: 'item',
                header: 'Item',
                render: a => {
                  const item = ppeItems.find(p => p.id === a.ppeItemId);
                  return (
                    <div>
                      <div className="font-medium text-slate-800">
                        {item ? (language === 'en' ? item.nameEn : item.nameAr) : a.ppeItemId}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {a.variantKey ? `Variant: ${a.variantKey}` : ''} | Batch: {a.batchNumber}
                      </div>
                    </div>
                  );
                }
              },
              {
                key: 'location',
                header: 'Location',
                render: a => {
                  const loc = locations.find(l => l.id === a.locationId);
                  return loc ? loc.nameEn : a.locationId;
                }
              },
              {
                key: 'delta',
                header: 'Quantity',
                render: a => (
                  <span
                    className={`font-mono font-bold ${
                      a.quantityDelta > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
 >
 {a.quantityDelta > 0 ? `+${a.quantityDelta}` : a.quantityDelta}
                  </span>
                )
              },
              {
                key: 'reason',
                header: 'Reason',
                render: a => (
                  <div className="max-w-[200px]">
                    <div className="font-semibold text-slate-800 text-xs">{a.reasonCategory}</div>
                    <div className="text-[11px] text-slate-500 truncate" title={a.reasonDetail}>
                      {a.reasonDetail}
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: a => (
                  <StatusBadge
                    status={
                      a.status === 'approved' || a.status === 'applied'
                        ? 'success'
                        : a.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    label={a.status === 'applied' ? 'Applied' : a.status}
                  />
                )
              },
              {
                key: 'actions',
                header: '',
                className: 'text-end',
                render: a => {
                  if (a.status === 'pending' && canApprove) {
                    return (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReviewAction(a.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReviewAction(a.id, 'approved')}
                        >
                          Approve
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAdjustment(a)}
                    >
                      <Eye className="w-3.5 h-3.5 me-1" /> View
                    </Button>
                  );
                }
              }
            ]}
          />
          </ContainerCard>
        </div>
      )}

      {/* Close Opening Balance Confirmation Modal */}
      <Modal
        opened={showObCloseModal}
        onClose={() => setShowObCloseModal(false)}
        title="Close Opening Balance?"
        icon={<Lock className="w-5 h-5 text-red-500" />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowObCloseModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleCloseOpeningBalance}>
              Lock Opening Balance
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to permanently close Opening Balance for{' '}
          <span className="font-semibold text-slate-900 ">{selectedObLoc?.nameEn}</span>? Once closed, no further opening balance entries can be posted. Any future stock changes will require a documented Stock IN or Stock OUT adjustment.
        </p>
      </Modal>

      {/* Adjustment Details SlideOver Drawer */}
      <SlideOverDrawer
        isOpen={!!selectedAdjustment}
        onClose={() => setSelectedAdjustment(null)}
        title={selectedAdjustment ? `Adjustment ${selectedAdjustment.reference}` : 'Adjustment Details'}
      >
        {selectedAdjustment && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-800">{selectedAdjustment.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold capitalize text-slate-800">{selectedAdjustment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created At:</span>
                <span className="text-slate-700">{format(new Date(selectedAdjustment.createdAt), 'PPpp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted By:</span>
                <span className="font-medium text-slate-800">{selectedAdjustment.submittedBy}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Transaction Details</h4>
              <div className="grid grid-cols-2 gap-2 p-3 border border-slate-200 rounded">
                <div>
                  <span className="text-slate-500 block">Type:</span>
                  <span className="font-bold text-slate-800">{selectedAdjustment.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Delta:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedAdjustment.quantityDelta > 0 ? `+${selectedAdjustment.quantityDelta}` : selectedAdjustment.quantityDelta}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Batch Number:</span>
                  <span className="font-mono text-slate-800">{selectedAdjustment.batchNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Variant:</span>
                  <span className="text-slate-800">{selectedAdjustment.variantKey || 'Standard'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">Reason Category & Detail</h4>
              <p className="font-medium text-slate-800">{selectedAdjustment.reasonCategory}</p>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                {selectedAdjustment.reasonDetail}
              </p>
            </div>

            {selectedAdjustment.quarantineReason && (
              <div className="space-y-1">
                <h4 className="font-bold text-purple-900">Quarantine Reason</h4>
                <p className="text-purple-800 bg-purple-50 p-2.5 rounded border border-purple-200">
                  {selectedAdjustment.quarantineReason}
                </p>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
