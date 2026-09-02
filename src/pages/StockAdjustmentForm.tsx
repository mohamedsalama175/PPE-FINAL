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

export default function StockAdjustmentForm() {
  const navigate = useNavigate();
  const { ppeItems, locations, batches, currentUser, adjustStock } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);
  const addToast = useToastStore(s => s.addToast);

  const [type, setType] = React.useState<'IN' | 'OUT'>('IN');
  
  const [formData, setFormData] = React.useState<Partial<StockAdjustment>>({
    type: 'IN',
    ppeItemId: '',
    locationId: myLocations[0]?.id || '',
    batchNumber: '',
    quantityDelta: 1,
    reasonCategory: '',
    reason: ''
  });

  // When type changes, reset some fields
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type,
      reasonCategory: '',
      batchNumber: type === 'OUT' ? '' : prev.batchNumber,
      quantityDelta: 1
    }));
  }, [type]);

  const availableBatches = React.useMemo(() => {
    if (type !== 'OUT' || !formData.ppeItemId || !formData.locationId) return [];
    return batches.filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId && b.availableQty > 0);
  }, [type, formData.ppeItemId, formData.locationId, batches]);

  // When picking a batch for OUT, auto fill location if possible or just rely on selected location
  const handleBatchSelect = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      setFormData(prev => ({ ...prev, batchNumber: batch.batchNumber, locationId: batch.locationId }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ppeItemId || !formData.locationId || !formData.quantityDelta || !formData.batchNumber || !formData.reasonCategory) {
      addToast('Please fill all required fields.', 'error');
      return;
    }

    if (formData.quantityDelta <= 0) {
      addToast('Quantity must be greater than zero.', 'error');
      return;
    }

    if (!formData.reason || formData.reason.length < 10) {
      addToast('Reason detail must be at least 10 characters long.', 'error');
      return;
    }

    if (type === 'OUT') {
      const selectedBatch = batches.find(b => b.batchNumber === formData.batchNumber && b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
      if (!selectedBatch) {
         addToast('Invalid batch selected.', 'error');
         return;
      }
      if (formData.quantityDelta > selectedBatch.availableQty) {
        addToast(`Quantity cannot exceed available stock (${selectedBatch.availableQty}).`, 'error');
        return;
      }
    }
    
    const isManualCorrection = formData.reasonCategory === 'Manual Correction';
    const status = isManualCorrection ? 'pending' : 'applied';
    
    // Auto generate reference
    const timestamp = new Date().getTime().toString().slice(-5);
    const reference = `ADJ-${type}-PPE-2026-${timestamp}`;

    const delta = type === 'IN' ? formData.quantityDelta : -formData.quantityDelta;

    adjustStock({
      ...formData,
      reference,
      quantityDelta: delta,
      status,
      submittedBy: currentUser.id
    } as StockAdjustment);
    
    if (status === 'pending') {
      addToast('Manual Correction submitted for approval.', 'success');
    } else {
      addToast('Stock adjusted successfully.', 'success');
    }
    navigate('/stock/adjustments');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Stock Adjustment" />
      
      <div className="flex bg-surface border border-border rounded-lg p-1 mb-6 w-fit">
        <button 
          className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${type === 'IN' ? 'bg-canvas text-ink shadow-sm' : 'text-body hover:bg-canvas/50'}`}
          onClick={() => setType('IN')}
        >
          Stock IN
        </button>
        <button 
          className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${type === 'OUT' ? 'bg-canvas text-ink shadow-sm' : 'text-body hover:bg-canvas/50'}`}
          onClick={() => setType('OUT')}
        >
          Stock OUT
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title={`${type === 'IN' ? 'Stock IN Details' : 'Stock OUT Details'}`}>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Item">
              <Select value={formData.ppeItemId} onChange={e => setFormData({...formData, ppeItemId: e.target.value})} required>
                <option value="">Select Item...</option>
                {ppeItems.map(p => <option key={p.id} value={p.id}>{p.nameEn} ({p.itemCode})</option>)}
              </Select>
            </FormGroup>
            
            <FormGroup label="Location">
              <Select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})} required disabled={type === 'OUT' && !!formData.batchNumber}>
                <option value="">Select Location...</option>
                {myLocations.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === 'IN' ? (
              <FormGroup label="Batch Number">
                <Input value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} placeholder="e.g. BATCH-2026-0051" required />
              </FormGroup>
            ) : (
              <FormGroup label="Batch">
                <Select value={availableBatches.find(b => b.batchNumber === formData.batchNumber)?.id || ''} onChange={e => handleBatchSelect(e.target.value)} required>
                  <option value="">Select Batch...</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.availableQty})</option>
                  ))}
                </Select>
                {formData.ppeItemId && formData.locationId && availableBatches.length === 0 && (
                  <p className="text-xs text-safety-red mt-1">No available batches for this item at this location.</p>
                )}
              </FormGroup>
            )}

            <FormGroup label={type === 'IN' ? 'Quantity' : 'Quantity to Deduct'}>
              <Input type="number" min="1" value={formData.quantityDelta} onChange={e => setFormData({...formData, quantityDelta: parseInt(e.target.value, 10) || 0})} required />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Reason & Documentation">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Reason Category">
              <Select value={formData.reasonCategory} onChange={e => setFormData({...formData, reasonCategory: e.target.value})} required>
                <option value="">Select Category...</option>
                {type === 'IN' ? (
                  <>
                    <option value="New Delivery">New Delivery</option>
                    <option value="Employee Return">Employee Return</option>
                    <option value="Supplier Return">Supplier Return</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="Physical Damage">Physical Damage</option>
                    <option value="Lifespan Expired Disposal">Lifespan Expired Disposal</option>
                    <option value="Stock Count Discrepancy">Stock Count Discrepancy</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-1 mt-4">
            <FormGroup label="Reason Detail (Min 10 chars)">
              <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Detailed explanation..." required />
            </FormGroup>
          </div>
          
          {formData.reasonCategory === 'Manual Correction' && (
             <div className="mt-4 p-3 bg-warning-subtle text-warning-strong border border-warning rounded text-sm">
               Note: Manual Corrections require Supervisor approval before stock is updated.
             </div>
          )}
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock/adjustments')}>Cancel</Button>
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
    </div>
  )
}
