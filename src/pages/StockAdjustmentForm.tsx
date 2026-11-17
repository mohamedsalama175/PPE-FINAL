import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { StockAdjustment } from '../types';
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SerialEntryBox } from '../components/serials/SerialEntryBox';
import { SerialPicker } from '../components/serials/SerialPicker';
import { useTranslation } from '../i18n/useTranslation';

export default function StockAdjustmentForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { ppeItems, locations, batches, stockBalances, currentUser, adjustStock, units, validateNewSerials } = usePPEStore();
  // PPE-057 / PPE-058: serials replace the quantity for a tracked item
  const [serialNumbers, setSerialNumbers] = React.useState<string[]>([]);
  const [serialIds, setSerialIds] = React.useState<string[]>([]);
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper 
      ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) 
      : locations;
  }, [isStoreKeeper, locations, currentUser.id]);

  const scrapLocations = React.useMemo(() => {
    return locations.filter(l => l.stockCondition === 'Scrap' || l.locationType === 'Scrap');
  }, [locations]);

  const addToast = useToastStore(s => s.addToast);

  const [type, setType] = React.useState<'IN' | 'OUT'>('IN');
  
  const [formData, setFormData] = React.useState<Partial<StockAdjustment>>({
    type: 'IN',
    ppeItemId: '',
    locationId: myLocations.find(l => l.stockCondition !== 'Scrap')?.id || myLocations[0]?.id || '',
    variantKey: '',
    batchNumber: '',
    quantityDelta: 1,
    reasonCategory: '',
    reason: '',
    manufacturerExpiryDate: '',
    supplierDeliveryNote: '',
    destinationLocationId: ''
  });

  // When type changes, reset some fields
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type,
      reasonCategory: '',
      batchNumber: '',
      variantKey: '',
      destinationLocationId: '',
      quantityDelta: 1
    }));
    setSerialNumbers([]);
    setSerialIds([]);
  }, [type]);

  const selectedItem = React.useMemo(() => {
    return ppeItems.find(p => p.id === formData.ppeItemId);
  }, [ppeItems, formData.ppeItemId]);

  const selectedLocation = React.useMemo(() => {
    return locations.find(l => l.id === formData.locationId);
  }, [locations, formData.locationId]);

  // Filter items linked to the selected location
  const availableItems = React.useMemo(() => {
    if (!formData.locationId) return [];
    return ppeItems.filter(p => p.active && !p.deletedAt && p.locationIds.includes(formData.locationId!));
  }, [ppeItems, formData.locationId]);

  // For Stock OUT: available batches
  const availableBatches = React.useMemo(() => {
    if (type !== 'OUT' || !formData.ppeItemId || !formData.locationId) return [];
    return batches.filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId && b.availableQty > 0);
  }, [type, formData.ppeItemId, formData.locationId, batches]);

  // For Stock IN: existing batches of this item at this location (if adding to existing)
  const existingBatchesAtLoc = React.useMemo(() => {
    if (type !== 'IN' || !formData.ppeItemId || !formData.locationId) return [];
    return batches.filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
  }, [type, formData.ppeItemId, formData.locationId, batches]);

  // Capacity Warning for Stock IN (PPE-025)
  const isOverCapacity = React.useMemo(() => {
    if (type !== 'IN' || !selectedLocation || !selectedLocation.capacityUnits) return false;
    const currentOnHand = stockBalances
      .filter(b => b.locationId === selectedLocation.id)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);
    return (currentOnHand + (Number(formData.quantityDelta) || 0)) > selectedLocation.capacityUnits;
  }, [type, selectedLocation, stockBalances, formData.quantityDelta]);

  // When picking a batch for OUT, auto fill batchNumber
  const handleBatchSelect = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      setFormData(prev => ({ 
        ...prev, 
        batchNumber: batch.batchNumber,
        variantKey: batch.variantKey || prev.variantKey
      }));
    }
  };

  const isCat3 = selectedItem?.riskCategory === 'III';
  const tracked = !!selectedItem?.serialTracked;
  const unitSymbol = units.find(u => u.id === selectedItem?.unitId)?.symbol || '';
  const qty = tracked ? (type === 'IN' ? serialNumbers.length : serialIds.length) : (Number(formData.quantityDelta) || 0);

  // reset serials when the item, location or batch changes
  React.useEffect(() => { setSerialNumbers([]); setSerialIds([]); }, [formData.ppeItemId, formData.locationId]);
  React.useEffect(() => { setSerialIds([]); }, [formData.batchNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tracked) {
      if (type === 'IN') {
        const errs = validateNewSerials(formData.ppeItemId!, serialNumbers);
        if (serialNumbers.length === 0) { addToast(`${selectedItem!.itemCode} is serial tracked: enter one serial number per unit.`, 'error'); return; }
        if (errs.length > 0) { addToast(errs[0].message, 'error'); return; }
      } else if (serialIds.length === 0) {
        addToast('Pick the serial numbers leaving stock.', 'error');
        return;
      }
      if (type === 'OUT' && formData.reasonCategory === 'Quarantined') {
        addToast('Quarantine is not available for a serial-tracked item.', 'error');
        return;
      }
    }
    const quantityDelta = tracked ? qty : formData.quantityDelta;
    if (!formData.ppeItemId || !formData.locationId || !quantityDelta || !formData.batchNumber || !formData.reasonCategory) {
      addToast('Please fill all required fields.', 'error');
      return;
    }

    if (quantityDelta <= 0) {
      addToast('Quantity must be greater than zero.', 'error');
      return;
    }

    if (formData.reasonCategory === 'Other' && (!formData.reason || formData.reason.length < 10)) {
      addToast('Reason detail must be at least 10 characters long when "Other" is selected.', 'error');
      return;
    }

    if (type === 'IN') {
      if (selectedLocation?.stockCondition === 'Scrap' || selectedLocation?.locationType === 'Scrap') {
        addToast('Scrap stock comes only from returns and Stock OUT (Rule G6 & PPE-025).', 'error');
        return;
      }
      if (formData.manufacturerExpiryDate) {
        const expDate = new Date(formData.manufacturerExpiryDate);
        if (expDate <= new Date()) {
          addToast('Manufacturer expiry date cannot be in the past (PPE-025).', 'error');
          return;
        }
      }
    }

    if (type === 'OUT') {
      const selectedBatch = batches.find(b => b.batchNumber === formData.batchNumber && b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
      if (!selectedBatch) {
         addToast('Invalid batch selected.', 'error');
         return;
      }
      if (quantityDelta > selectedBatch.availableQty) {
        addToast(`Quantity cannot exceed available stock (${selectedBatch.availableQty}).`, 'error');
        return;
      }
    }
    
    // Auto generate reference: ADJ-IN-YYYY-NNNNN or ADJ-OUT-YYYY-NNNNN
    const timestamp = Date.now().toString().slice(-5);
    const reference = `ADJ-${type}-${new Date().getFullYear()}-${timestamp}`;

    const delta = type === 'IN' ? quantityDelta : -quantityDelta;
    const status = isCat3 ? 'pending' : 'applied'; // Category III stock adjustments need approval (PPE-025, PPE-026)

    const res = adjustStock({
      ...formData,
      reference,
      quantityDelta: delta,
      status,
      submittedBy: currentUser.id,
      ...(tracked ? (type === 'IN' ? { serialNumbers } : { serialIds }) : {})
    } as StockAdjustment);
    if (!res.success) {
      addToast(res.message || 'Could not save the adjustment.', 'error');
      return; // keep the form as entered
    }
    
    if (status === 'pending') {
      addToast(`Category III stock adjustment submitted for HSE Supervisor approval (${reference}).`, 'info');
    } else {
      addToast(`Stock ${type} adjustment applied successfully (${reference}).`, 'success');
    }
    navigate('/stock/adjustments');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title={type === 'IN' ? 'Record Stock IN (PPE-025)' : 'Record Stock OUT (PPE-026)'}
        subtitle="Document receipts, counts, quarantines, damages, and inventory corrections"
        onBack={() => navigate('/stock/adjustments')}
      />
      
      {/* Type Selector Tabs */}
      <div className="flex bg-surface border border-border rounded-lg p-1 w-fit shadow-sm">
        <button 
          type="button"
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
            type === 'IN' ? 'bg-canvas text-accent shadow-sm border border-border' : 'text-body hover:bg-canvas/50'
          }`}
          onClick={() => setType('IN')}
        >
          Stock IN (PPE-025)
        </button>
        <button 
          type="button"
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
            type === 'OUT' ? 'bg-canvas text-accent shadow-sm border border-border' : 'text-body hover:bg-canvas/50'
          }`}
          onClick={() => setType('OUT')}
        >
          Stock OUT (PPE-026)
        </button>
      </div>

      {/* Category III Supervisor Approval Notice (PPE-025 & PPE-026) */}
      {isCat3 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-900 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Category III Item (Irreversible/Lethal): Stock adjustment will be queued for HSE Supervisor approval per Rule G14.</span>
        </div>
      )}

      {/* Capacity Warning Banner (PPE-025) */}
      {isOverCapacity && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-900 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Non-blocking capacity warning: Stock IN quantity will cause total stock to exceed the location capacity limit.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-6 shadow-sm">
        <FormSection title={type === 'IN' ? 'Receipt & Warehouse Parameters' : 'Deduction & Source Parameters'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Location *">
              <Select 
                value={formData.locationId} 
                onChange={e => setFormData({...formData, locationId: e.target.value, ppeItemId: '', batchNumber: ''})} 
                required
              >
                <option value="">Select Location...</option>
                {myLocations.filter(l => type === 'OUT' || l.stockCondition !== 'Scrap').map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name} ({l.stockCondition})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="PPE Item *">
              <Select 
                value={formData.ppeItemId} 
                onChange={e => setFormData({...formData, ppeItemId: e.target.value, batchNumber: '', variantKey: ''})} 
                required
              >
                <option value="">Select Linked Item...</option>
                {availableItems.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.itemCode} - {p.name} (Cat {p.riskCategory})
                  </option>
                ))}
              </Select>
            </FormGroup>
          </div>

          {/* Variant Selection if item has variants */}
          {selectedItem?.variantAttributeValueIds && selectedItem.variantAttributeValueIds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormGroup label="Variant / Attribute Value *">
                <Select
                  value={formData.variantKey || ''}
                  onChange={e => setFormData({...formData, variantKey: e.target.value})}
                  required
                >
                  <option value="">Select Variant...</option>
                  {selectedItem.variantAttributeValueIds.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </Select>
              </FormGroup>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {type === 'IN' ? (
              <FormGroup label="Batch Number *">
                <div className="space-y-1.5">
                  <Input 
                    value={formData.batchNumber} 
                    onChange={e => setFormData({...formData, batchNumber: e.target.value})} 
                    placeholder="e.g. BATCH-2026-0044" 
                    required 
                  />
                  {existingBatchesAtLoc.length > 0 && (
                    <p className="text-[11px] text-body">
                      Or select existing: {existingBatchesAtLoc.map(b => (
                        <button 
                          key={b.id} 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, batchNumber: b.batchNumber }))}
                          className="underline text-accent mr-2 cursor-pointer"
                        >
                          {b.batchNumber}
                        </button>
                      ))}
                    </p>
                  )}
                </div>
              </FormGroup>
            ) : (
              <FormGroup label="Available Batch *">
                <Select 
                  value={availableBatches.find(b => b.batchNumber === formData.batchNumber)?.id || ''} 
                  onChange={e => handleBatchSelect(e.target.value)} 
                  required
                >
                  <option value="">Select Available Batch...</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (Available: {b.availableQty})
                    </option>
                  ))}
                </Select>
                {formData.ppeItemId && formData.locationId && availableBatches.length === 0 && (
                  <p className="text-xs text-safety-red mt-1">No available batches for this item at this location.</p>
                )}
              </FormGroup>
            )}

            {tracked ? (
              <FormGroup label={`${t('quantity')}`}>
                <div className="input-base bg-canvas font-semibold" aria-live="polite">{qty} {unitSymbol}</div>
                <p className="text-[11px] text-body mt-1">= {type === 'IN' ? t('serialsEntered') : t('serialsPicked')}</p>
              </FormGroup>
            ) : (
            <FormGroup label={type === 'IN' ? `Quantity to Add (${unitSymbol || '-'}) *` : `Quantity to Deduct (${unitSymbol || '-'}) *`}>
              <Input 
                type="number" 
                min="1" 
                value={formData.quantityDelta} 
                onChange={e => setFormData({...formData, quantityDelta: parseInt(e.target.value, 10) || 1})} 
                required 
              />
            </FormGroup>
            )}
          </div>

          {/* PPE-057: serial entry on Stock IN / PPE-058: serial pick on Stock OUT */}
          {tracked && type === 'IN' && formData.ppeItemId && (
            <div className="mt-4">
              <FormGroup label={`${t('serialNumbers')} *`} htmlFor="serial-entry">
                <SerialEntryBox id="serial-entry" ppeItemId={formData.ppeItemId} value={serialNumbers} onChange={setSerialNumbers} />
              </FormGroup>
            </div>
          )}
          {tracked && type === 'OUT' && formData.ppeItemId && formData.batchNumber && (
            <div className="mt-4">
              <SerialPicker ppeItemId={formData.ppeItemId} locationId={formData.locationId} batchNumber={formData.batchNumber} value={serialIds} onChange={setSerialIds} />
            </div>
          )}

          {/* PPE-025: Optional Manufacturer Expiry Date & Supplier Delivery Note */}
          {type === 'IN' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormGroup label="Manufacturer Expiry Date (Optional)">
                <Input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.manufacturerExpiryDate || ''}
                  onChange={e => setFormData({...formData, manufacturerExpiryDate: e.target.value})}
                />
              </FormGroup>

              <FormGroup label="Supplier / Delivery Note (Optional)">
                <Input 
                  placeholder="e.g. ABC Safety / DN-4471"
                  value={formData.supplierDeliveryNote || ''}
                  onChange={e => setFormData({...formData, supplierDeliveryNote: e.target.value})}
                />
              </FormGroup>
            </div>
          )}

          {/* PPE-026: Destination Scrap Location when Damaged or Written Off */}
          {type === 'OUT' && (formData.reasonCategory === 'Damaged in Store' || formData.reasonCategory === 'Written Off') && (
            <div className="mt-4 p-3 bg-canvas border border-border rounded">
              <FormGroup label="Move Damaged Stock to Scrap Location (Optional)">
                <Select 
                  value={formData.destinationLocationId || ''} 
                  onChange={e => setFormData({...formData, destinationLocationId: e.target.value})}
                >
                  <option value="">Deduct Without Moving to Scrap</option>
                  {scrapLocations.map(sl => (
                    <option key={sl.id} value={sl.id}>{sl.code} - {sl.name} (Scrap)</option>
                  ))}
                </Select>
                <p className="text-[11px] text-body mt-1">
                  Selecting a Scrap location will automatically transfer and register an auto-scrap entry per Rule G6.
                </p>
              </FormGroup>
            </div>
          )}

          {/* PPE-026: Quarantine Info Banner */}
          {type === 'OUT' && formData.reasonCategory === 'Quarantined' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-semibold">
              <Info className="w-4 h-4 inline mr-1 text-amber-700" />
              Rule G9 Quarantine: Stock will not be removed from On Hand, but moved to Quarantined so Available drops by the specified quantity.
            </div>
          )}
        </FormSection>

        <FormSection title="Reason & Audit Documentation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Reason Category *">
              <Select 
                value={formData.reasonCategory} 
                onChange={e => setFormData({...formData, reasonCategory: e.target.value})} 
                required
              >
                <option value="">Select Reason Category...</option>
                {type === 'IN' ? (
                  <>
                    <option value="Purchase Receipt">Purchase Receipt</option>
                    <option value="Stock Count Correction">Stock Count Correction</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="Damaged in Store">Damaged in Store</option>
                    <option value="Written Off">Written Off</option>
                    <option value="Expired">Expired</option>
                    {!tracked && <option value="Quarantined">Quarantined</option>}
                    <option value="Stolen">Stolen</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </Select>
            </FormGroup>

            <FormGroup label="Reason Detail (Min 10 chars if 'Other') *">
              <Input 
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})} 
                placeholder="Audit explanation for this stock movement..." 
                required 
              />
            </FormGroup>
          </div>
        </FormSection>
        
        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock/adjustments')}>Cancel</Button>
          <Button type="submit">Submit Adjustment</Button>
        </div>
      </form>
    </div>
  );
}
