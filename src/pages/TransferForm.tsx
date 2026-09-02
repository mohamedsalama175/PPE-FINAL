import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';

export default function TransferForm() {
  const navigate = useNavigate();
  const { ppeItems, locations, batches, currentUser, transferStock } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const sourceLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);
  
  const addToast = useToastStore(s => s.addToast);

  const [formData, setFormData] = React.useState({
    ppeItemId: '',
    fromLocationId: sourceLocations[0]?.id || '',
    toLocationId: '',
    batchNumber: '',
    quantity: 1,
  });

  const availableBatches = React.useMemo(() => {
    if (!formData.ppeItemId || !formData.fromLocationId) return [];
    return batches.filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.fromLocationId && b.availableQty > 0);
  }, [formData.ppeItemId, formData.fromLocationId, batches]);

  // When picking a batch, make sure we only allow selecting batches that belong to fromLocation
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

    const fromLoc = locations.find(l => l.id === formData.fromLocationId);
    const toLoc = locations.find(l => l.id === formData.toLocationId);
    
    // Cannot transfer from Scrap/Used to General/Central/Site
    const restrictedFromTypes = ['Scrap', 'Used'];
    const validToTypes = ['General', 'Central Warehouse', 'Site Store'];
    if (fromLoc && restrictedFromTypes.includes(fromLoc.locationType) && toLoc && validToTypes.includes(toLoc.locationType)) {
       addToast(`Cannot transfer items from a '${fromLoc.locationType}' location to a '${toLoc.locationType}' location.`, 'error');
       return;
    }

    const selectedBatch = batches.find(b => b.batchNumber === formData.batchNumber && b.ppeItemId === formData.ppeItemId && b.locationId === formData.fromLocationId);
    if (!selectedBatch || selectedBatch.availableQty < formData.quantity) {
      addToast('Not enough quantity available in the selected batch.', 'error');
      return;
    }

    transferStock(
      formData.ppeItemId, 
      formData.fromLocationId, 
      formData.toLocationId, 
      formData.batchNumber,
      formData.quantity, 
      currentUser.id
    );
    
    addToast('Stock transferred successfully.', 'success');
    navigate('/stock/transfers');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Stock Transfer" />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Transfer Details">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Item">
              <Select value={formData.ppeItemId} onChange={e => setFormData({...formData, ppeItemId: e.target.value})} required>
                <option value="">Select Item...</option>
                {ppeItems.map(p => <option key={p.id} value={p.id}>{p.nameEn} ({p.itemCode})</option>)}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="From Location">
              <Select value={formData.fromLocationId} onChange={e => setFormData({...formData, fromLocationId: e.target.value})} required>
                <option value="">Select Source Location...</option>
                {sourceLocations.map(l => <option key={l.id} value={l.id}>{l.nameEn} ({l.locationType})</option>)}
              </Select>
            </FormGroup>
            
            <FormGroup label="To Location">
              <Select value={formData.toLocationId} onChange={e => setFormData({...formData, toLocationId: e.target.value})} required>
                <option value="">Select Destination Location...</option>
                {locations.filter(l => l.id !== formData.fromLocationId).map(l => (
                  <option key={l.id} value={l.id}>{l.nameEn} ({l.locationType})</option>
                ))}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Batch">
              <Select value={availableBatches.find(b => b.batchNumber === formData.batchNumber)?.id || ''} onChange={e => handleBatchSelect(e.target.value)} required>
                <option value="">Select Batch...</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.availableQty})</option>
                ))}
              </Select>
              {formData.ppeItemId && formData.fromLocationId && availableBatches.length === 0 && (
                <p className="text-xs text-safety-red mt-1">No available batches for this item at this location.</p>
              )}
            </FormGroup>

            <FormGroup label="Quantity">
              <Input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10) || 0})} required />
            </FormGroup>
          </div>
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock/transfers')}>Cancel</Button>
          <Button type="submit">Complete Transfer</Button>
        </div>
      </form>
    </div>
  )
}
