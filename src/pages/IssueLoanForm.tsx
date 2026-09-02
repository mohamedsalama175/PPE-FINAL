import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ContainerCard } from '../components/ui/ContainerCard';
import { DatePicker } from '../components/ui/DatePicker';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useToastStore } from '../store/toastStore';
import { format, addDays } from 'date-fns';
import { Plus, X, ShieldAlert, AlertOctagon, User, Building, Clock, Check } from 'lucide-react';
import { VisitorLoanItem } from '../types';

export default function IssueLoanForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    ppeItems, 
    locations, 
    employees, 
    currentUser, 
    batches, 
    issueVisitorLoan 
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap');
    }
    return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap' && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Header fields
  const [recipientName, setRecipientName] = React.useState('');
  const [recipientCompany, setRecipientCompany] = React.useState('');
  const [hostEmployeeId, setHostEmployeeId] = React.useState(employees[0]?.id || '');
  const [issueDate, setIssueDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [expectedReturnDate, setExpectedReturnDate] = React.useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  // Multi-line item grid (BD-I470)
  // Default to Used-condition location if exists at user's site
 const defaultUsedLoc = assignedLocations.find(l => l.stockCondition === 'Used') || assignedLocations[0];

 const [items, setItems] = React.useState<Array<{
 id: string;
 ppeItemId: string;
 variantKey: string;
 quantity: number;
 fromLocationId: string;
 batchNumber: string;
 }>>([
 {
 id: '1',
 ppeItemId: ppeItems[0]?.id || '',
 variantKey: 'Standard',
 quantity: 1,
 fromLocationId: defaultUsedLoc?.id || '',
 batchNumber: ''
 }
 ]);

 // Dual canvas signatures
 const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
 const [receiverSignature, setReceiverSignature] = React.useState('');
 const [submitting, setSubmitting] = React.useState(false);

 // Auto-find batch when item and location are selected
 React.useEffect(() => {
 setItems(prev => prev.map(line => {
 if (!line.batchNumber && line.ppeItemId && line.fromLocationId) {
 const matchingBatch = batches.find(b => 
 b.ppeItemId === line.ppeItemId && 
 b.locationId === line.fromLocationId && 
 b.availableQty >= line.quantity && 
 b.status === 'Active'
 );
 return matchingBatch ? { ...line, batchNumber: matchingBatch.batchNumber } : line;
 }
 return line;
 }));
 }, [items, batches]);

 const handleAddLine = () => {
 setItems(prev => [
 ...prev,
 {
 id: String(Date.now()),
 ppeItemId: ppeItems[0]?.id || '',
 variantKey: 'Standard',
 quantity: 1,
 fromLocationId: defaultUsedLoc?.id || '',
 batchNumber: ''
 }
 ]);
 };

 const handleRemoveLine = (id: string) => {
 if (items.length <= 1) return;
 setItems(prev => prev.filter(i => i.id !== id));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();

 if (!recipientName.trim() || !recipientCompany.trim() || !hostEmployeeId) {
 addToast('Please complete all visitor/contractor header details.', 'error');
 return;
 }

 if (new Date(expectedReturnDate) < new Date(issueDate)) {
 addToast('Expected return date cannot precede issue date.', 'error');
 return;
 }

 // Validate lines
 for (const line of items) {
 if (!line.ppeItemId || !line.fromLocationId || line.quantity <= 0) {
 addToast('Please complete all line item fields.', 'error');
 return;
 }
 const available = batches
 .filter(b => b.ppeItemId === line.ppeItemId && b.locationId === line.fromLocationId && b.status === 'Active')
        .reduce((sum, b) => sum + b.availableQty, 0);

      if (available < line.quantity) {
        const ppe = ppeItems.find(p => p.id === line.ppeItemId);
        addToast(`Insufficient stock for ${ppe?.nameEn || 'item'} at selected location.`, 'error');
        return;
      }
    }

    if (!storeKeeperSignature || !receiverSignature) {
      addToast('Dual digital signatures (Store Keeper & Recipient) are required.', 'error');
      return;
    }

    setSubmitting(true);
    const loanLines: VisitorLoanItem[] = items.map((line, idx) => {
      const matchBatch = batches.find(b => 
        b.ppeItemId === line.ppeItemId && 
        b.locationId === line.fromLocationId && 
        b.availableQty >= line.quantity && 
        b.status === 'Active'
      );

      return {
        id: `loan-item-${Date.now()}-${idx}`,
        ppeItemId: line.ppeItemId,
        variantKey: line.variantKey,
        quantity: line.quantity,
        returnedQuantity: 0,
        fromLocationId: line.fromLocationId,
        batchNumber: matchBatch ? matchBatch.batchNumber : `BATCH-LOAN-${line.id}`,
        status: 'Open' as const
      };
    });

    const loanNum = issueVisitorLoan({
      recipientName: recipientName.trim(),
      recipientCompany: recipientCompany.trim(),
      hostEmployeeId,
      issueDate,
      expectedReturnDate,
      fromLocationId: defaultUsedLoc?.id || assignedLocations[0]?.id || '',
      items: loanLines,
      storeKeeperSignature,
      recipientSignature: receiverSignature,
      issuedBy: currentUser.name
    });
    setSubmitting(false);

    addToast(`Visitor Loan issued successfully (${loanNum}).`, 'success');
    navigate('/issuances/open-loans');
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from issuing visitor loans.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Issue PPE as a Loan to Visitor / Contractor"
        subtitle="Temporary multi-line issuance with host employee tracking, default Used-pool routing, and LN-YYYY-NNNNN reference (BD-I470)"
      />

      <ContainerCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient & Host Details */}
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Recipient & Host Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. David Miller"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Company / Organization <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Apex Industrial Audit Corp"
                  value={recipientCompany}
                  onChange={e => setRecipientCompany(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Host Employee (Internal Contact) <span className="text-red-500">*</span>
                </label>
                <Select value={hostEmployeeId} onChange={e => setHostEmployeeId(e.target.value)} required>
                  {employees
                    .filter(e => e.status === 'Active')
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.jobPosition || e.jobPositionId} — {e.site})
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <DatePicker
                  label="Issue Date"
                  required
                  value={issueDate}
                  onChange={(_, dateStr) => setIssueDate(dateStr)}
                />
              </div>

              <div>
                <DatePicker
                  label="Expected Return Date"
                  required
                  value={expectedReturnDate}
                  minDate={issueDate}
                  onChange={(_, dateStr) => setExpectedReturnDate(dateStr)}
                />
              </div>
          </div>
        </div>

        {/* Multi-line Loan Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Loan Line Items
              </h4>
              <p className="text-[11px] text-slate-500">
                Defaults to Used-condition locations to preserve new stock for permanent employees.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddLine}>
              <Plus className="w-3.5 h-3.5 me-1" /> Add Loan Item
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">PPE Item</th>
                  <th className="p-2.5">Variant</th>
                  <th className="p-2.5 w-24">Quantity</th>
                  <th className="p-2.5">From Location</th>
                  <th className="p-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(line => (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <Select
                        value={line.ppeItemId}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(l => l.id === line.id ? { ...l, ppeItemId: val, batchNumber: '' } : l));
                        }}
                      >
                        {ppeItems.filter(p => p.active && !p.deletedAt).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.itemCode} — {p.nameEn}
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="p-2.5">
                      <Input
                        value={line.variantKey}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(l => l.id === line.id ? { ...l, variantKey: val } : l));
                        }}
                        placeholder="e.g. Size M"
                      />
                    </td>

                    <td className="p-2.5">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          setItems(prev => prev.map(l => l.id === line.id ? { ...l, quantity: val } : l));
                        }}
                      />
                    </td>

                    <td className="p-2.5">
                      <Select
                        value={line.fromLocationId}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map(l => l.id === line.id ? { ...l, fromLocationId: val, batchNumber: '' } : l));
                        }}
                      >
                        {assignedLocations.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.code} ({l.stockCondition})
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={items.length <= 1}
                        className={`text-slate-400 hover:text-red-600 ${items.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dual Canvas Signatures */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dual Digital Signatures (Mandatory)
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive HTML5 touch/stylus signature pads for Store Keeper and Visitor/Contractor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignaturePad
              label={`Store Keeper: ${currentUser.name}`}
              onSave={setStoreKeeperSignature}
              required
            />
            <SignaturePad
              label={`Recipient: ${recipientName || 'Visitor / Contractor'}`}
              onSave={setReceiverSignature}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 ">
          <Button type="button" variant="secondary" onClick={() => navigate('/issuances/open-loans')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            Generate Loan & Deduct Stock
          </Button>
        </div>
      </form>
      </ContainerCard>
    </div>
  );
}
