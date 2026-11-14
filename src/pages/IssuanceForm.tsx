import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { SignatureModal } from '../components/ui/SignatureModal';
import { useToastStore } from '../store/toastStore';
import { addDays, addMonths, addYears, format } from 'date-fns';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function IssuanceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryEmployeeId = searchParams.get('employeeId');
  const queryItemId = searchParams.get('itemId');
  const queryReplacesIssuanceId = searchParams.get('replacesIssuanceId');

  const { ppeItems, locations, employees, issuances, currentUser, issueItem, batches, stockBalances, validateGenderMatch } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);
  const addToast = useToastStore(s => s.addToast);

  const priorIssuance = React.useMemo(() => {
    return queryReplacesIssuanceId ? issuances.find(i => i.id === queryReplacesIssuanceId) : undefined;
  }, [queryReplacesIssuanceId, issuances]);

  const [formData, setFormData] = React.useState({
    employeeId: queryEmployeeId || employees[0]?.id || '',
    ppeItemId: queryItemId || ppeItems[0]?.id || '',
    locationId: myLocations[0]?.id || '',
    quantity: 1,
    batchNumber: '',
    variantKey: '',
    replacesIssuanceId: queryReplacesIssuanceId || '',
    storeKeeperSignature: '',
    receiverSignature: ''
  });

  const [issuanceError, setIssuanceError] = React.useState('');
  const [activeSigner, setActiveSigner] = React.useState<'receiver' | 'storeKeeper' | null>(null);

  const selectedItem = React.useMemo(() => ppeItems.find(p => p.id === formData.ppeItemId), [ppeItems, formData.ppeItemId]);
  const selectedEmployee = React.useMemo(() => employees.find(e => e.id === formData.employeeId), [employees, formData.employeeId]);

  // FIFO Batches recommendation (Rule G14)
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
      setIssuanceError('Item is not configured as valid for the selected location.');
      return;
    }

    const bal = stockBalances.find(b => b.ppeItemId === formData.ppeItemId && b.locationId === formData.locationId);
    const availableOnHand = bal ? Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0)) : 0;
    if (availableOnHand < formData.quantity) {
      setIssuanceError(`Insufficient available stock (Available: ${availableOnHand}, Requested: ${formData.quantity}).`);
      return;
    }

    // Rule G4: Gender Matching Validation
    if (formData.employeeId && formData.ppeItemId) {
      const genderCheck = validateGenderMatch(formData.employeeId, formData.ppeItemId, formData.variantKey);
      if (!genderCheck.valid) {
        setIssuanceError(genderCheck.reason || 'Gender mismatch violation (Rule G4).');
        return;
      }
    }
    
    setIssuanceError('');
  }, [formData.locationId, formData.ppeItemId, formData.quantity, formData.employeeId, formData.variantKey, selectedItem, stockBalances, validateGenderMatch]);

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
      addToast('A valid active batch must be selected (Rule G14 FIFO).', 'error');
      return;
    }
    if (!formData.storeKeeperSignature || !formData.receiverSignature) {
      addToast('Both digital signatures (Store Keeper & Receiver) are mandatory.', 'error');
      return;
    }
    
    const res = issueItem({
      employeeId: formData.employeeId,
      ppeItemId: formData.ppeItemId,
      locationId: formData.locationId,
      quantity: formData.quantity,
      batchNumber: formData.batchNumber,
      variantKey: formData.variantKey,
      replacesIssuanceId: formData.replacesIssuanceId || undefined,
      issueDate: new Date().toISOString(),
      storeKeeperSignature: formData.storeKeeperSignature,
      receiverSignature: formData.receiverSignature,
      issuedBy: currentUser.id
    });
    
    if (res.success) {
      addToast(formData.replacesIssuanceId ? 'Replacement PPE successfully issued. Prior issuance marked Replaced (PPE-034).' : 'PPE successfully issued with digital audit signatures.', 'success');
      navigate('/issuances');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title="Issue PPE (Single Item)" 
        subtitle="Direct equipment assignment with FIFO batch selection, lifespan calculation, and dual signatures"
        onBack={() => navigate('/issuances')}
      />

      {priorIssuance && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs font-semibold flex items-center justify-between">
          <span>Replacing Active Issuance: <strong>{priorIssuance.reference || priorIssuance.id}</strong> (Prior issuance will be marked 'Replaced' and ceases to be active per PPE-034).</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Recipient & Location">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Employee">
              <Select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                {employees.filter(e => e.active).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode}) {emp.gender ? `· ${emp.gender}` : ''}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Issuing Location">
              <Select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value, batchNumber: ''})}>
                {myLocations.map(l => (
                  <option key={l.id} value={l.id}>{l.nameEn} ({l.site})</option>
                ))}
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Equipment Specifications">
          {issuanceError && (
            <div className="p-3 bg-red-50 border border-red-200 text-safety-red rounded text-xs font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{issuanceError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="PPE Item">
              <Select value={formData.ppeItemId} onChange={e => setFormData({...formData, ppeItemId: e.target.value, batchNumber: ''})}>
                {ppeItems.filter(p => p.active && !p.deletedAt).map(p => (
                  <option key={p.id} value={p.id}>{p.nameEn} ({p.itemCode})</option>
                ))}
              </Select>
            </FormGroup>

            {selectedItem?.hasSize && (
              <FormGroup label="Size / Variant Selection">
                <Select value={formData.variantKey} onChange={e => setFormData({...formData, variantKey: e.target.value})} required>
                  <option value="">Select Size / Variant...</option>
                  {selectedItem.variantAttributeValueIds.map(val => (
                    <option key={val} value={val}>{val}</option> 
                  ))}
                </Select>
              </FormGroup>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="FIFO Recommended Batch (G14)">
              <Select value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})}>
                <option value="">Select Batch...</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.batchNumber}>
                    {b.batchNumber} (Avail: {b.availableQty}) &middot; Exp: {format(new Date(b.expiryDate), 'yyyy-MM')}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Quantity">
              <Input 
                type="number" 
                min="1" 
                value={formData.quantity} 
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10) || 1})} 
              />
            </FormGroup>
          </div>

          {expectedReplacementDate && (
            <div className="mt-4 p-3 bg-canvas border border-border rounded flex items-center justify-between text-xs">
              <span className="font-semibold text-body">Auto-Calculated Lifespan Replacement Due Date (Rule G5):</span>
              <span className="font-bold text-accent font-mono text-sm">{expectedReplacementDate}</span>
            </div>
          )}
        </FormSection>

        {/* Digital Signatures Pad */}
        <FormSection title="Dual Digital Signatures" description="Capture digital signatures for the Store Keeper and the recipient Employee.">
          <div className="grid grid-cols-2 gap-6">
            {/* Receiver Signature */}
            <div className="border border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] bg-canvas">
              <div className="text-xs font-bold uppercase tracking-wider text-body mb-3">Receiver Signature</div>
              {formData.receiverSignature ? (
                <div className="flex flex-col items-center">
                  <img src={formData.receiverSignature} alt="Receiver" className="h-14 max-w-[180px] border border-border rounded bg-white shadow-sm mb-2" />
                  <button 
                    type="button" 
                    onClick={() => setActiveSigner('receiver')}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    Redraw Signature
                  </button>
                </div>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={() => setActiveSigner('receiver')}>
                  Tap to Sign (Receiver)
                </Button>
              )}
            </div>

            {/* Store Keeper Signature */}
            <div className="border border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] bg-canvas">
              <div className="text-xs font-bold uppercase tracking-wider text-body mb-3">Store Keeper Signature</div>
              {formData.storeKeeperSignature ? (
                <div className="flex flex-col items-center">
                  <img src={formData.storeKeeperSignature} alt="Store Keeper" className="h-14 max-w-[180px] border border-border rounded bg-white shadow-sm mb-2" />
                  <button 
                    type="button" 
                    onClick={() => setActiveSigner('storeKeeper')}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    Redraw Signature
                  </button>
                </div>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={() => setActiveSigner('storeKeeper')}>
                  Tap to Sign (Store Keeper)
                </Button>
              )}
            </div>
          </div>
        </FormSection>
        
        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => navigate('/issuances')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!!issuanceError || !formData.receiverSignature || !formData.storeKeeperSignature}>
            Complete Issuance
          </Button>
        </div>
      </form>

      {/* Signature Capture Modal */}
      <SignatureModal 
        isOpen={!!activeSigner}
        title={activeSigner === 'receiver' ? 'Receiver Digital Signature' : 'Store Keeper Digital Signature'}
        onClose={() => setActiveSigner(null)}
        onSave={(dataUrl) => {
          if (activeSigner === 'receiver') setFormData(prev => ({ ...prev, receiverSignature: dataUrl }));
          else setFormData(prev => ({ ...prev, storeKeeperSignature: dataUrl }));
          setActiveSigner(null);
        }}
      />
    </div>
  );
}
