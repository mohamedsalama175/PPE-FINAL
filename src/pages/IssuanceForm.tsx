import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { addDays, addMonths, addYears, format } from 'date-fns';

export default function IssuanceForm() {
  const navigate = useNavigate();
  const { ppeItems, locations, employees, currentUser, issueItem, batches, stockBalances } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);
  const addToast = useToastStore(s => s.addToast);

  const [formData, setFormData] = React.useState({
    employeeId: employees[0]?.id || '',
    ppeItemId: ppeItems[0]?.id || '',
    locationId: myLocations[0]?.id || '',
    quantity: 1,
    batchNumber: '',
    variantKey: '',
    storeKeeperSignature: '',
    receiverSignature: ''
  });

  const [issuanceError, setIssuanceError] = React.useState('');

  const selectedItem = React.useMemo(() => ppeItems.find(p => p.id === formData.ppeItemId), [ppeItems, formData.ppeItemId]);
  const selectedEmployee = React.useMemo(() => employees.find(e => e.id === formData.employeeId), [employees, formData.employeeId]);

  const availableBatches = React.useMemo(() => {
    if (!formData.ppeItemId || !formData.locationId) return [];
    return batches
      .filter(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId && b.availableQty > 0 && b.status === 'Active')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [formData.ppeItemId, formData.locationId, batches]);

  React.useEffect(() => {
    if (availableBatches.length > 0 && !formData.batchNumber) {
      setFormData(prev => ({ ...prev, batchNumber: availableBatches[0].batchNumber }));
    }
  }, [availableBatches]);

  const expectedReplacementDate = React.useMemo(() => {
    if (!selectedItem || !selectedItem.lifespanValue) return undefined;
    const now = new Date();
    if (selectedItem.lifespanType === 'Days') return format(addDays(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    if (selectedItem.lifespanType === 'Months') return format(addMonths(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    if (selectedItem.lifespanType === 'Years') return format(addYears(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    return undefined;
  }, [selectedItem]);

  React.useEffect(() => {
    if (!selectedItem || !selectedItem.locationIds.includes(formData.locationId)) {
      setIssuanceError('Item is not available at the selected location.');
      return;
    }

    const bal = stockBalances.find(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
    if (!bal || bal.quantityOnHand < formData.quantity) {
      setIssuanceError('No stock available for this item at this location. Please submit a Request instead.');
      return;
    }

    // Since our Employee mock doesn't have gender, let's assume they might have gender, but since it's missing in types, we skip strict gender block, or add a warning.
    // In our types Employee doesn't have gender. Let's just simulate the check conceptually if it existed.
    
    setIssuanceError('');
  }, [formData.locationId, formData.ppeItemId, formData.quantity, selectedItem, stockBalances]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issuanceError) {
      addToast(issuanceError, 'error');
      return;
    }
    if (!formData.employeeId || !formData.ppeItemId || !formData.locationId || formData.quantity <= 0) {
      addToast('Please fill all required fields correctly.', 'error');
      return;
    }
    if (!formData.batchNumber) {
      addToast('A valid active batch must be selected.', 'error');
      return;
    }
    if (!formData.storeKeeperSignature || !formData.receiverSignature) {
      addToast('Both Store Keeper and Employee signatures are required.', 'error');
      return;
    }
    
    issueItem({
      employeeId: formData.employeeId,
      ppeItemId: formData.ppeItemId,
      locationId: formData.locationId,
      quantity: formData.quantity,
      batchNumber: formData.batchNumber,
      variantKey: formData.variantKey,
      issueDate: new Date().toISOString(),
      expectedReplacementDate: expectedReplacementDate,
      storeKeeperSignature: formData.storeKeeperSignature,
      receiverSignature: formData.receiverSignature,
      issuedBy: currentUser.id
    });
    
    addToast('PPE Issued successfully.', 'success');
    navigate('/issuances');
  };

  const handleSign = (type: 'storekeeper' | 'receiver') => {
    const dummySignature = `data:image/png;base64,dummy_signature_${Date.now()}`;
    if (type === 'storekeeper') setFormData({ ...formData, storeKeeperSignature: dummySignature });
    else setFormData({ ...formData, receiverSignature: dummySignature });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Issue PPE (Single Item)" />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Issuance Details">
          {issuanceError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {issuanceError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Location">
              <Select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value, batchNumber: ''})}>
                {myLocations.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
              </Select>
            </FormGroup>
            
            <FormGroup label="Employee">
              <Select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="PPE Item">
              <Select value={formData.ppeItemId} onChange={e => setFormData({...formData, ppeItemId: e.target.value, batchNumber: ''})}>
                {ppeItems.map(p => <option key={p.id} value={p.id}>{p.nameEn} ({p.itemCode})</option>)}
              </Select>
              {selectedItem && (
                <div className="text-xs text-body mt-1">
                  Lifespan: {selectedItem.lifespanValue} {selectedItem.lifespanType}
                  {expectedReplacementDate && ` (Next Replacement: ${expectedReplacementDate})`}
                </div>
              )}
            </FormGroup>

            {selectedItem?.hasSize && (
              <FormGroup label="Variant / Size">
                <Select value={formData.variantKey} onChange={e => setFormData({...formData, variantKey: e.target.value})} required>
                  <option value="">Select Size...</option>
                  {selectedItem.variantAttributeValueIds.map(val => (
                    <option key={val} value={val}>{val}</option> 
                  ))}
                </Select>
              </FormGroup>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Batch (Oldest first)">
              <Select value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})}>
                <option value="">Select Batch...</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.batchNumber}>{b.batchNumber} (Avail: {b.availableQty})</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Quantity">
              <Input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10) || 1})} />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Signatures">
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-border rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] bg-canvas">
              <div className="text-sm font-medium mb-4">Employee Signature</div>
              {formData.receiverSignature ? (
                <div className="text-safety-green flex items-center gap-2 font-bold text-lg italic">
                  ✓ Signed
                </div>
              ) : (
                <Button type="button" variant="secondary" onClick={() => handleSign('receiver')}>Tap to Sign</Button>
              )}
            </div>
            <div className="border border-border rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] bg-canvas">
              <div className="text-sm font-medium mb-4">Store Keeper Signature</div>
              {formData.storeKeeperSignature ? (
                <div className="text-safety-green flex items-center gap-2 font-bold text-lg italic">
                  ✓ Signed
                </div>
              ) : (
                <Button type="button" variant="secondary" onClick={() => handleSign('storekeeper')}>Tap to Sign</Button>
              )}
            </div>
          </div>
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/issuances')}>Cancel</Button>
          <Button type="submit" disabled={!!issuanceError}>Complete Issuance</Button>
        </div>
      </form>
    </div>
  )
}
