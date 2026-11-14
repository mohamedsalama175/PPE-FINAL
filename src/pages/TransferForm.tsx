import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { AlertTriangle, Info, ArrowRight } from 'lucide-react';

export default function TransferForm() {
  const navigate = useNavigate();
  const { ppeItems, locations, batches, stockBalances, currentUser, transferStock } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  
  // From Location: Assigned to user, active, not Scrap (Rule G6 & PPE-027)
  const sourceLocations = React.useMemo(() => {
    return locations.filter(l => {
      if (!l.active || l.deletedAt) return false;
      if (l.stockCondition === 'Scrap' || l.locationType === 'Scrap') return false;
      if (isStoreKeeper && !l.assignedStoreKeeperIds.includes(currentUser.id)) return false;
      return true;
    });
  }, [locations, isStoreKeeper, currentUser.id]);

  const addToast = useToastStore(s => s.addToast);

  const [formData, setFormData] = React.useState({
    ppeItemId: '',
    fromLocationId: sourceLocations[0]?.id || '',
    toLocationId: '',
    batchNumber: '',
    quantity: 1,
  });

  const selectedItem = React.useMemo(() => {
    return ppeItems.find(p => p.id === formData.ppeItemId);
  }, [ppeItems, formData.ppeItemId]);

  const fromLoc = React.useMemo(() => {
    return locations.find(l => l.id === formData.fromLocationId);
  }, [locations, formData.fromLocationId]);

  const toLoc = React.useMemo(() => {
    return locations.find(l => l.id === formData.toLocationId);
  }, [locations, formData.toLocationId]);

  // Destination locations: Active, not Scrap, different from source
  const validDestinationLocations = React.useMemo(() => {
    return locations.filter(l => {
      if (!l.active || l.deletedAt) return false;
      if (l.stockCondition === 'Scrap' || l.locationType === 'Scrap') return false; // Blocked per Rule G6
      if (l.id === formData.fromLocationId) return false;
      return true;
    });
  }, [locations, formData.fromLocationId]);

  // Available batches at From Location
  const availableBatches = React.useMemo(() => {
    if (!formData.ppeItemId || !formData.fromLocationId) return [];
    return batches.filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.fromLocationId && b.availableQty > 0);
  }, [formData.ppeItemId, formData.fromLocationId, batches]);

  const selectedBatch = React.useMemo(() => {
    return batches.find(b => b.batchNumber === formData.batchNumber && b.ppeItemId === formData.ppeItemId && b.locationId === formData.fromLocationId);
  }, [batches, formData.batchNumber, formData.ppeItemId, formData.fromLocationId]);

  // Rule G6 Condition Check
  const conditionViolation = React.useMemo(() => {
    if (!fromLoc || !toLoc) return '';
    if ((fromLoc.stockCondition === 'Used' || fromLoc.locationType === 'Used') && toLoc.stockCondition === 'New') {
      return 'Stock moved from a Used location to a New location is blocked (Rule G6).';
    }
    return '';
  }, [fromLoc, toLoc]);

  // Item linked to destination check (PPE-027)
  const isItemLinkedToDestination = React.useMemo(() => {
    if (!selectedItem || !toLoc) return true;
    return selectedItem.locationIds.includes(toLoc.id);
  }, [selectedItem, toLoc]);

  // Capacity Warning for destination
  const isDestinationOverCapacity = React.useMemo(() => {
    if (!toLoc || !toLoc.capacityUnits) return false;
    const destOnHand = stockBalances
      .filter(b => b.locationId === toLoc.id)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);
    return (destOnHand + (Number(formData.quantity) || 0)) > toLoc.capacityUnits;
  }, [toLoc, stockBalances, formData.quantity]);

  const handleBatchSelect = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      setFormData(prev => ({ ...prev, batchNumber: batch.batchNumber }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ppeItemId || !formData.fromLocationId || !formData.toLocationId || !formData.quantity || !formData.batchNumber) {
      addToast('Please fill all required fields.', 'error');
      return;
    }
    
    if (formData.fromLocationId === formData.toLocationId) {
      addToast('Source and destination locations must be different.', 'error');
      return;
    }

    if (conditionViolation) {
      addToast(conditionViolation, 'error');
      return;
    }

    if (!isItemLinkedToDestination) {
      addToast(`Item ${selectedItem?.itemCode} is not linked to destination warehouse ${toLoc?.nameEn}. Add it to the item's locations first (PPE-027).`, 'error');
      return;
    }

    if (!selectedBatch || selectedBatch.availableQty < formData.quantity) {
      addToast(`Not enough quantity available in the selected batch (Available: ${selectedBatch?.availableQty || 0}).`, 'error');
      return;
    }

    const res = transferStock(
      formData.ppeItemId, 
      formData.fromLocationId, 
      formData.toLocationId, 
      formData.batchNumber,
      formData.quantity, 
      currentUser.id
    );
    
    if (!res.success) {
      addToast(res.message || 'Transfer failed.', 'error');
      return;
    }
    
    addToast('Stock transferred successfully between warehouses (PPE-027).', 'success');
    navigate('/stock/transfers');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title="Transfer Stock Between Locations (PPE-027)" 
        subtitle="Atomic stock movement between warehouses enforcing Rule G6 stock condition transitions"
        onBack={() => navigate('/stock/transfers')}
      />

      {/* Stock Condition Rule Warning */}
      {conditionViolation && (
        <div className="p-3 bg-red-50 border border-red-200 text-safety-red rounded flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{conditionViolation}</span>
        </div>
      )}

      {/* Destination Not Linked Blocking Warning */}
      {!isItemLinkedToDestination && (
        <div className="p-3 bg-red-50 border border-red-200 text-safety-red rounded flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Item is not linked to destination warehouse {toLoc?.nameEn} (PPE-027).</span>
          </div>
          <button 
            type="button" 
            onClick={() => navigate(`/catalog/${selectedItem?.id}`)} 
            className="underline font-bold text-accent cursor-pointer"
          >
            Edit Item Locations
          </button>
        </div>
      )}

      {/* Capacity Warning */}
      {isDestinationOverCapacity && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded flex items-center gap-2 text-xs font-semibold">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Non-blocking capacity warning: Transfer will exceed storage capacity at {toLoc?.nameEn}.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-6 shadow-sm">
        <FormSection title="Source & Destination Warehouses">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="From Location (Source) *">
              <Select 
                value={formData.fromLocationId} 
                onChange={e => setFormData({...formData, fromLocationId: e.target.value, ppeItemId: '', batchNumber: ''})} 
                required
              >
                <option value="">Select Source Location...</option>
                {sourceLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.nameEn} ({l.stockCondition})
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup label="To Location (Destination) *">
              <Select 
                value={formData.toLocationId} 
                onChange={e => setFormData({...formData, toLocationId: e.target.value})} 
                required
              >
                <option value="">Select Destination Location...</option>
                {validDestinationLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.nameEn} ({l.stockCondition})
                  </option>
                ))}
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Equipment & Batch Selection">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="PPE Item *">
              <Select 
                value={formData.ppeItemId} 
                onChange={e => setFormData({...formData, ppeItemId: e.target.value, batchNumber: ''})} 
                required
              >
                <option value="">Select Item...</option>
                {ppeItems.filter(p => p.active && !p.deletedAt && p.locationIds.includes(formData.fromLocationId)).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.itemCode} - {p.nameEn}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Available Batch *">
              <Select 
                value={availableBatches.find(b => b.batchNumber === formData.batchNumber)?.id || ''} 
                onChange={e => handleBatchSelect(e.target.value)} 
                required
              >
                <option value="">Select Batch...</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} (Available: {b.availableQty})
                  </option>
                ))}
              </Select>
              {formData.ppeItemId && formData.fromLocationId && availableBatches.length === 0 && (
                <p className="text-xs text-safety-red mt-1">No stock available for this item at source warehouse.</p>
              )}
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="Transfer Quantity *">
              <Input 
                type="number" 
                min="1" 
                max={selectedBatch?.availableQty || 9999}
                value={formData.quantity} 
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10) || 1})} 
                required 
              />
            </FormGroup>
          </div>
        </FormSection>
        
        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock/transfers')}>Cancel</Button>
          <Button 
            type="submit" 
            disabled={Boolean(conditionViolation) || !isItemLinkedToDestination || !formData.batchNumber}
          >
            Complete Transfer <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
