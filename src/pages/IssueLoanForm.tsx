import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { format, addDays } from 'date-fns';
import { useTranslation } from '../i18n/useTranslation';

export default function IssueLoanForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { ppeItems, locations, currentUser, issueItem, batches, stockBalances } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);

  const [formData, setFormData] = React.useState({
    holderName: '',
    holderType: 'Visitor',
    ppeItemId: ppeItems[0]?.id || '',
    locationId: myLocations[0]?.id || '',
    quantity: 1,
    batchNumber: '',
    variantKey: '',
    expectedReturnDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    storeKeeperSignature: '',
    receiverSignature: ''
  });

  const [issuanceError, setIssuanceError] = React.useState('');
  const addToast = useToastStore(s => s.addToast);

  const selectedItem = React.useMemo(() => ppeItems.find(p => p.id === formData.ppeItemId), [ppeItems, formData.ppeItemId]);

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

  React.useEffect(() => {
    if (!selectedItem || !selectedItem.locationIds.includes(formData.locationId)) {
      setIssuanceError('Item is not available at the selected location.');
      return;
    }

    const bal = stockBalances.find(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
    if (!bal || bal.quantityOnHand < formData.quantity) {
      setIssuanceError('No stock available for this item at this location.');
      return;
    }

    setIssuanceError('');
  }, [formData.locationId, formData.ppeItemId, formData.quantity, selectedItem, stockBalances]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issuanceError) {
      addToast('Please fix the errors before issuing.', 'error');
      return;
    }
    if (!formData.holderName) {
      addToast('Visitor/Contractor name is required.', 'error');
      return;
    }
    if (!formData.batchNumber) {
      addToast('A valid active batch must be selected.', 'error');
      return;
    }
    if (!formData.storeKeeperSignature || !formData.receiverSignature) {
      addToast('Both Signatures are required.', 'error');
      return;
    }
    
    issueItem({
      holderName: formData.holderName,
      holderType: formData.holderType,
      ppeItemId: formData.ppeItemId,
      locationId: formData.locationId,
      quantity: formData.quantity,
      batchNumber: formData.batchNumber,
      variantKey: formData.variantKey,
      issueDate: new Date().toISOString(),
      expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
      storeKeeperSignature: formData.storeKeeperSignature,
      receiverSignature: formData.receiverSignature,
      issuedBy: currentUser.id
    });
    
    addToast('Loan issued successfully!', 'success');
    navigate('/issuances');
  };

  const handleSign = (type: 'storekeeper' | 'receiver') => {
    const dummySignature = `data:image/png;base64,dummy_signature_${Date.now()}`;
    if (type === 'storekeeper') setFormData({ ...formData, storeKeeperSignature: dummySignature });
    else setFormData({ ...formData, receiverSignature: dummySignature });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Issue Loan" subtitle="Issue PPE to Visitors or Contractors temporarily" />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Visitor/Contractor Details">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Name">
              <Input value={formData.holderName} onChange={e => setFormData({...formData, holderName: e.target.value})} required placeholder="John Doe" />
            </FormGroup>
            
            <FormGroup label="Type">
              <Select value={formData.holderType} onChange={e => setFormData({...formData, holderType: e.target.value})}>
                <option value="Visitor">Visitor</option>
                <option value="Contractor">Contractor</option>
                <option value="Temporary Staff">Temporary Staff</option>
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Issuance Details">
          {issuanceError && (
            <div className="p-3 bg-safety-red/10 text-safety-red border border-safety-red/20 rounded-md text-sm mb-4">
              {issuanceError}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Location">
              <Select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value, batchNumber: ''})}>
                {myLocations.map(l => <option key={l.id} value={l.id}>{language === 'en' ? l.nameEn : l.nameAr}</option>)}
              </Select>
            </FormGroup>

            <FormGroup label="Expected Return Date">
              <Input type="date" value={formData.expectedReturnDate} onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})} required min={format(new Date(), 'yyyy-MM-dd')} />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="PPE Item">
              <Select value={formData.ppeItemId} onChange={e => setFormData({...formData, ppeItemId: e.target.value, batchNumber: ''})}>
                {ppeItems.map(p => <option key={p.id} value={p.id}>{language === 'en' ? p.nameEn : p.nameAr} ({p.itemCode})</option>)}
              </Select>
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
              <div className="text-sm font-medium mb-4">Receiver Signature</div>
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
          <Button type="submit" disabled={!!issuanceError}>Complete Loan Issuance</Button>
        </div>
      </form>
    </div>
  );
}
