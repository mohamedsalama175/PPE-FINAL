import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SignatureModal } from '../components/ui/SignatureModal';
import { useToastStore } from '../store/toastStore';
import { format, addDays } from 'date-fns';
import { useTranslation } from '../i18n/useTranslation';
import { Plus, Trash2, Clock, ShieldAlert } from 'lucide-react';

interface LoanItemLine {
  id: string;
  ppeItemId: string;
  quantity: number;
  batchNumber?: string;
}

export default function IssueLoanForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { ppeItems, locations, employees, currentUser, issueLoan, batches, stockBalances } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);

  // PPE-036: From Location defaults to a Used-flag location
  const defaultLocation = React.useMemo(() => {
    return myLocations.find(l => l.stockCondition === 'Used' || l.locationType === 'Used') || myLocations[0];
  }, [myLocations]);

  const [holderName, setHolderName] = React.useState('');
  const [holderType, setHolderType] = React.useState<'Visitor' | 'Contractor' | 'Temporary Staff'>('Visitor');
  const [companyName, setCompanyName] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [hostEmployeeId, setHostEmployeeId] = React.useState(employees[0]?.id || '');
  const [locationId, setLocationId] = React.useState(defaultLocation?.id || myLocations[0]?.id || '');
  const [expectedReturnDate, setExpectedReturnDate] = React.useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  // Multi-line loan items (PPE-036)
  const [lines, setLines] = React.useState<LoanItemLine[]>([
    { id: '1', ppeItemId: ppeItems[0]?.id || '', quantity: 1 }
  ]);

  // Signatures
  const [receiverSignature, setReceiverSignature] = React.useState('');
  const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
  const [activeSigner, setActiveSigner] = React.useState<'receiver' | 'storeKeeper' | null>(null);

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      { id: String(Date.now()), ppeItemId: ppeItems[0]?.id || '', quantity: 1 }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleLineChange = (id: string, field: keyof LoanItemLine, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName) {
      addToast('Recipient name is required.', 'error');
      return;
    }
    if (lines.length === 0) {
      addToast('At least one item line must be added.', 'error');
      return;
    }

    // Check stock for each line
    for (const line of lines) {
      const bal = stockBalances.find(b => b.ppeItemId === line.ppeItemId && b.locationId === locationId);
      const avail = bal ? Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0)) : 0;
      if (avail < line.quantity) {
        const item = ppeItems.find(p => p.id === line.ppeItemId);
        addToast(`Insufficient stock for ${item?.nameEn || 'item'} at this location (Available: ${avail}).`, 'error');
        return;
      }
    }

    if (!receiverSignature || !storeKeeperSignature) {
      addToast('Both digital signatures are mandatory for loan custody transfer.', 'error');
      return;
    }

    // Assign FIFO batches
    const itemsWithBatches = lines.map(line => {
      const batch = batches
        .filter(b => b.ppeItemId === line.ppeItemId && b.locationId === locationId && b.availableQty >= line.quantity && b.status === 'Active')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

      return {
        ppeItemId: line.ppeItemId,
        quantity: line.quantity,
        batchNumber: batch?.batchNumber
      };
    });

    const res = issueLoan({
      holderName,
      holderType,
      companyName,
      contactNumber,
      hostEmployeeId,
      locationId,
      expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      items: itemsWithBatches,
      storeKeeperSignature,
      receiverSignature,
      issuedBy: currentUser.id
    });

    if (res.success) {
      addToast(`Temporary Loan issued successfully (${res.reference}) (PPE-036).`, 'success');
      navigate('/issuances/open-loans');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title="Issue Temporary PPE Loan (PPE-036)" 
        subtitle="Multi-line temporary custody issuance for visitors, contractors, and staff with expected return tracking"
        onBack={() => navigate('/issuances')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Recipient & Host Details">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Recipient Full Name">
              <Input 
                value={holderName} 
                onChange={e => setHolderName(e.target.value)} 
                required 
                placeholder="e.g. Michael Smith" 
              />
            </FormGroup>

            <FormGroup label="Recipient Classification">
              <Select value={holderType} onChange={e => setHolderType(e.target.value as any)}>
                <option value="Visitor">Visitor</option>
                <option value="Contractor">Contractor</option>
                <option value="Temporary Staff">Temporary Staff</option>
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="Company / Employer Name">
              <Input 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                placeholder="e.g. PetroChem Services" 
              />
            </FormGroup>

            <FormGroup label="Contact Phone Number">
              <Input 
                value={contactNumber} 
                onChange={e => setContactNumber(e.target.value)} 
                placeholder="+20 100 123 4567" 
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="Host Employee (Internal Sponsor)">
              <Select value={hostEmployeeId} onChange={e => setHostEmployeeId(e.target.value)}>
                {employees.filter(e => e.active).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Issuing Location">
              <Select value={locationId} onChange={e => setLocationId(e.target.value)}>
                {myLocations.map(l => (
                  <option key={l.id} value={l.id}>{l.nameEn} ({l.site})</option>
                ))}
              </Select>
            </FormGroup>
          </div>

          <div className="mt-4">
            <FormGroup label="Expected Return Date">
              <Input 
                type="date" 
                value={expectedReturnDate} 
                onChange={e => setExpectedReturnDate(e.target.value)} 
                required 
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-48"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Multi-Line Items (PPE-036) */}
        <FormSection 
          title="Loan Equipment Lines (Multi-Item PPE-036)" 
          description="Add multiple items to be issued together on this single loan voucher."
        >
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={line.id} className="p-3 bg-canvas border border-border rounded flex items-center gap-3">
                <span className="text-xs font-bold text-body font-mono w-6">#{index + 1}</span>
                <div className="flex-1">
                  <Select 
                    value={line.ppeItemId} 
                    onChange={e => handleLineChange(line.id, 'ppeItemId', e.target.value)}
                  >
                    {ppeItems.filter(p => p.active && !p.deletedAt).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameEn} ({p.itemCode})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <Input 
                    type="number" 
                    min="1" 
                    value={line.quantity} 
                    onChange={e => handleLineChange(line.id, 'quantity', parseInt(e.target.value, 10) || 1)} 
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-safety-red hover:bg-safety-red/10"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lines.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="secondary" size="sm" onClick={handleAddLine} className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Add Another Item Line
            </Button>
          </div>
        </FormSection>

        {/* Digital Signatures Pad */}
        <FormSection title="Dual Digital Signatures" description="Capture digital signatures for the Store Keeper and the recipient.">
          <div className="grid grid-cols-2 gap-6">
            {/* Receiver Signature */}
            <div className="border border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] bg-canvas">
              <div className="text-xs font-bold uppercase tracking-wider text-body mb-3">Receiver Signature</div>
              {receiverSignature ? (
                <div className="flex flex-col items-center">
                  <img src={receiverSignature} alt="Receiver" className="h-14 max-w-[180px] border border-border rounded bg-white shadow-sm mb-2" />
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
              {storeKeeperSignature ? (
                <div className="flex flex-col items-center">
                  <img src={storeKeeperSignature} alt="Store Keeper" className="h-14 max-w-[180px] border border-border rounded bg-white shadow-sm mb-2" />
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
          <Button type="submit" disabled={!receiverSignature || !storeKeeperSignature}>
            Complete Loan Issuance
          </Button>
        </div>
      </form>

      {/* Signature Capture Modal */}
      <SignatureModal 
        isOpen={!!activeSigner}
        title={activeSigner === 'receiver' ? 'Receiver Digital Signature' : 'Store Keeper Digital Signature'}
        onClose={() => setActiveSigner(null)}
        onSave={(dataUrl) => {
          if (activeSigner === 'receiver') setReceiverSignature(dataUrl);
          else setStoreKeeperSignature(dataUrl);
          setActiveSigner(null);
        }}
      />
    </div>
  );
}
