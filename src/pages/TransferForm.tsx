import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useToastStore } from '../store/toastStore';
import { ArrowLeft, ArrowRightLeft, AlertTriangle, AlertOctagon, Check } from 'lucide-react';

export default function TransferForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { currentUser, locations, ppeItems, batches, transferStock } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  // Scoped locations based on RBAC (BD-I462)
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    let locs = locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap');
    if (isStoreKeeper) {
      locs = locs.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id));
    }
    return locs;
  }, [locations, currentUser, isStoreKeeper]);

  const [selectedItemId, setSelectedItemId] = React.useState<string>(ppeItems[0]?.id || '');
  const [fromLocId, setFromLocId] = React.useState<string>(assignedLocations[0]?.id || '');
  const [selectedBatchNumber, setSelectedBatchNumber] = React.useState<string>('');
  const [toLocId, setToLocId] = React.useState<string>('');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [error, setError] = React.useState<string | null>(null);

  // Available batches at From Location
  const availableBatches = React.useMemo(() => {
    return batches.filter(b => 
      b.ppeItemId === selectedItemId && 
      b.locationId === fromLocId && 
      b.availableQty > 0
    );
  }, [batches, selectedItemId, fromLocId]);

  // Set default batch when available batches change
  React.useEffect(() => {
    if (availableBatches.length > 0) {
      setSelectedBatchNumber(availableBatches[0].batchNumber);
    } else {
      setSelectedBatchNumber('');
    }
  }, [availableBatches]);

  const selectedBatch = React.useMemo(() => {
    return availableBatches.find(b => b.batchNumber === selectedBatchNumber);
  }, [availableBatches, selectedBatchNumber]);

  // Target locations linked to item
  const validTargetLocations = React.useMemo(() => {
    const item = ppeItems.find(p => p.id === selectedItemId);
    if (!item) return [];

    return locations.filter(l => 
      l.active && 
      !l.deletedAt && 
      l.stockCondition !== 'Scrap' && 
      l.id !== fromLocId && 
      item.locationIds.includes(l.id)
    );
  }, [locations, selectedItemId, fromLocId, ppeItems]);

  React.useEffect(() => {
    if (validTargetLocations.length > 0 && !validTargetLocations.some(l => l.id === toLocId)) {
      setToLocId(validTargetLocations[0].id);
    }
  }, [validTargetLocations, toLocId]);

  const fromLoc = locations.find(l => l.id === fromLocId);
  const toLoc = locations.find(l => l.id === toLocId);

  // Transfer condition routing rule validation
  const isUsedToNewBlocked = fromLoc?.stockCondition === 'Used' && toLoc?.stockCondition === 'New';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatch) {
      setError('Please select an active batch with available stock.');
      return;
    }

    if (quantity <= 0 || quantity > selectedBatch.availableQty) {
      setError(`Transfer quantity must be between 1 and ${selectedBatch.availableQty}.`);
      return;
    }

    if (isUsedToNewBlocked) {
      setError('Transfer from a Used-condition location to a New-condition location is strictly BLOCKED.');
      return;
    }

    const result = transferStock({
      ppeItemId: selectedItemId,
      fromLocationId: fromLocId,
      toLocationId: toLocId,
      batchNumber: selectedBatch.batchNumber,
      quantity
    });

    if (!result.success) {
      setError(result.error || 'Transfer failed.');
      return;
    }

    if (result.overcapacityWarning) {
      addToast(`Transfer executed successfully. Warning: Destination warehouse "${toLoc?.nameEn}" has exceeded capacity.`, 'info');
    } else {
      addToast(`Transferred ${quantity} units from ${fromLoc?.nameEn} to ${toLoc?.nameEn}.`, 'success');
    }

    navigate('/stock/transfers');
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="secondary" size="sm" onClick={() => navigate('/stock/transfers')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Transfers
        </Button>
      </div>

      <PageHeader
        title="Execute Stock Transfer (BD-I464)"
        subtitle="Move equipment between warehouses. Enforces condition rules: Used->New blocked, New->Used marked Reused"
      />

      <ContainerCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Item Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Equipment Item <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
            >
              {ppeItems.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>
                  {p.itemCode} — {p.nameEn} ({p.riskCategory})
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Source Facility and Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Source Facility (From) <span className="text-red-500">*</span>
              </label>
              <Select
                value={fromLocId}
                onChange={e => setFromLocId(e.target.value)}
              >
                {assignedLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nameEn} ({l.stockCondition})
                  </option>
                ))}
              </Select>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Condition: {fromLoc?.stockCondition}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Source Batch Number <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedBatchNumber}
                disabled={availableBatches.length === 0}
                onChange={e => setSelectedBatchNumber(e.target.value)}
              >
                {availableBatches.length === 0 ? (
                  <option value="">No available batches at this location</option>
                ) : (
                  availableBatches.map(b => (
                    <option key={b.id} value={b.batchNumber}>
                      {b.batchNumber} ({b.availableQty} Avail • {b.condition})
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>

          {/* 3. Destination Facility */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Destination Facility (To) <span className="text-red-500">*</span>
            </label>
            <Select
              value={toLocId}
              disabled={validTargetLocations.length === 0}
              onChange={e => setToLocId(e.target.value)}
            >
              {validTargetLocations.length === 0 ? (
                <option value="">No other assigned locations linked to this item</option>
              ) : (
                validTargetLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nameEn} ({l.site} • {l.stockCondition})
                  </option>
                ))
              )}
            </Select>

            {/* Condition Routing Matrix Alerts */}
            {isUsedToNewBlocked && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 font-bold mt-2 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                <span>Routing Rule Violation: Transfer from a Used location ({fromLoc?.nameEn}) to a New location ({toLoc?.nameEn}) is strictly blocked.</span>
              </div>
            )}

            {fromLoc?.stockCondition === 'New' && toLoc?.stockCondition === 'Used' && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px] mt-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>New → Used transfer permitted: Moved inventory will be designated as <strong>Reused</strong> in the destination pool.</span>
              </div>
            )}
          </div>

          {/* 4. Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Transfer Quantity <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <Input
                type="number"
                min={1}
                max={selectedBatch?.availableQty || 1}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                Max: {selectedBatch?.availableQty || 0}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ">
            <Button type="button" variant="secondary" onClick={() => navigate('/stock/transfers')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedBatch || isUsedToNewBlocked || validTargetLocations.length === 0}
            >
              Execute Transfer
            </Button>
          </div>
        </form>
      </ContainerCard>
    </div>
  );
}
