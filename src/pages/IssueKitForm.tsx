import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from '../i18n/useTranslation';

export default function IssueKitForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { kits, ppeItems, locations, employees, currentUser, issueItem, stockBalances } = usePPEStore();
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);

  const [formData, setFormData] = React.useState({
    employeeId: employees[0]?.id || '',
    kitId: kits[0]?.id || '',
    locationId: myLocations[0]?.id || '',
    quantity: 1,
    storeKeeperSignature: '',
    receiverSignature: ''
  });

  const [issuanceError, setIssuanceError] = React.useState('');

  const selectedKit = React.useMemo(() => kits.find(k => k.id === formData.kitId), [kits, formData.kitId]);

  React.useEffect(() => {
    if (!selectedKit) return;

    let hasError = false;
    for (const item of selectedKit.items) {
      const bal = stockBalances.find(b => b.ppeItemId === item.ppeItemId && b.locationId === formData.locationId);
      if (!bal || bal.quantityOnHand < (item.qty * formData.quantity)) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      setIssuanceError('Insufficient stock for one or more items in the kit at this location.');
    } else {
      setIssuanceError('');
    }
  }, [formData.locationId, formData.kitId, formData.quantity, selectedKit, stockBalances]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issuanceError) {
      addToast('Cannot issue: ' + issuanceError, 'error');
      return;
    }
    if (!formData.storeKeeperSignature || !formData.receiverSignature) {
      addToast('Both signatures are required.', 'error');
      return;
    }
    
    issueItem({
      employeeId: formData.employeeId,
      kitId: formData.kitId,
      locationId: formData.locationId,
      quantity: formData.quantity,
      issueDate: new Date().toISOString(),
      storeKeeperSignature: formData.storeKeeperSignature,
      receiverSignature: formData.receiverSignature,
      issuedBy: currentUser.id
    });
    
    addToast('Kit issued successfully!', 'success');
    navigate('/issuances');
  };

  const handleSign = (type: 'storekeeper' | 'receiver') => {
    const dummySignature = `data:image/png;base64,dummy_signature_${Date.now()}`;
    if (type === 'storekeeper') setFormData({ ...formData, storeKeeperSignature: dummySignature });
    else setFormData({ ...formData, receiverSignature: dummySignature });
  };

  const addToast = useToastStore(s => s.addToast);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Issue Kit" />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Issuance Details">
          {issuanceError && (
            <div className="p-3 bg-safety-red/10 text-safety-red border border-safety-red/20 rounded-md text-sm mb-4">
              {issuanceError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Location">
              <Select value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>
                {myLocations.map(l => <option key={l.id} value={l.id}>{language === 'en' ? l.nameEn : l.nameAr}</option>)}
              </Select>
            </FormGroup>
            
            <FormGroup label="Employee">
              <Select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Kit">
              <Select value={formData.kitId} onChange={e => setFormData({...formData, kitId: e.target.value})}>
                {kits.map(k => <option key={k.id} value={k.id}>{language === 'en' ? k.nameEn : k.nameAr}</option>)}
              </Select>
            </FormGroup>

            <FormGroup label="Quantity">
              <Select value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10)})}>
                <option value={1}>1 Kit</option>
                <option value={2}>2 Kits</option>
                <option value={3}>3 Kits</option>
              </Select>
            </FormGroup>
          </div>

          {selectedKit && (
            <div className="mt-4 border border-border rounded-md p-4 bg-canvas">
              <h4 className="text-sm font-bold text-ink mb-2">Kit Contents:</h4>
              <ul className="space-y-2">
                {selectedKit.items.map(item => {
                  const ppe = ppeItems.find(p => p.id === item.ppeItemId);
                  const reqQty = item.qty * formData.quantity;
                  const bal = stockBalances.find(b => b.ppeItemId === item.ppeItemId && b.locationId === formData.locationId)?.quantityOnHand || 0;
                  return (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-body">{ppe ? (language === 'en' ? ppe.nameEn : ppe.nameAr) : item.ppeItemId}</span>
                      <span className={`font-medium ${bal < reqQty ? 'text-safety-red' : 'text-safety-green'}`}>
                        {reqQty} req / {bal} avail
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
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
  );
}
