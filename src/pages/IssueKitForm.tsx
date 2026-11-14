import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SignatureModal } from '../components/ui/SignatureModal';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from '../i18n/useTranslation';
import { Briefcase, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function IssueKitForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedKitId = searchParams.get('kitId');
  const { t, language } = useTranslation();
  const { kits, ppeItems, locations, employees, currentUser, issueKit, stockBalances, issuances, batches } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)) : locations, [isStoreKeeper, locations, currentUser.id]);

  const [employeeId, setEmployeeId] = React.useState(employees[0]?.id || '');
  const [kitId, setKitId] = React.useState(preselectedKitId || kits[0]?.id || '');
  const [locationId, setLocationId] = React.useState(myLocations[0]?.id || '');
  const [quantity, setQuantity] = React.useState(1);

  // Digital signatures state
  const [receiverSignature, setReceiverSignature] = React.useState('');
  const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
  const [activeSigner, setActiveSigner] = React.useState<'receiver' | 'storeKeeper' | null>(null);

  // Selected employee
  const selectedEmployee = React.useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);

  // PPE-035: Auto-suggest kit based on selected employee's Job Position
  React.useEffect(() => {
    if (preselectedKitId) return; // Prioritize URL param if explicitly navigated
    if (!selectedEmployee) return;

    const matchedKit = kits.find(k => k.jobPositionId === selectedEmployee.jobPositionId && k.active && !k.deletedAt);
    if (matchedKit) {
      setKitId(matchedKit.id);
    }
  }, [selectedEmployee, kits, preselectedKitId]);

  const selectedKit = React.useMemo(() => kits.find(k => k.id === kitId), [kits, kitId]);

  // Items status check for G8 partial issuance
  const kitItemsStockStatus = React.useMemo(() => {
    if (!selectedKit) return [];
    return selectedKit.items.map(ki => {
      const item = ppeItems.find(p => p.id === ki.ppeItemId);
      const reqQty = ki.qty * quantity;
      const bal = stockBalances.find(b => b.ppeItemId === ki.ppeItemId && b.locationId === locationId);
      const avail = bal ? Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0)) : 0;
      const isAvailable = avail >= reqQty;
      const isPartial = avail > 0 && avail < reqQty;
      const isOut = avail === 0;

      // Suggest size from past issuances
      const pastIssuance = issuances.find(i => i.employeeId === employeeId && i.ppeItemId === ki.ppeItemId && i.variantKey);
      const suggestedSize = pastIssuance?.variantKey || ki.variantKey || '';

      return {
        ki,
        item,
        reqQty,
        avail,
        isAvailable,
        isPartial,
        isOut,
        suggestedSize
      };
    });
  }, [selectedKit, quantity, locationId, stockBalances, issuances, employeeId, ppeItems]);

  const hasAnyStock = kitItemsStockStatus.some(k => k.avail > 0);
  const isPartiallyAvailable = kitItemsStockStatus.some(k => k.isOut || k.isPartial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyStock) {
      addToast('Cannot issue kit: all items are currently out of stock at this location.', 'error');
      return;
    }
    if (!receiverSignature || !storeKeeperSignature) {
      addToast('Both digital signatures (Store Keeper & Receiver) are required (Rule G7).', 'error');
      return;
    }

    const res = issueKit({
      employeeId,
      kitId,
      locationId,
      quantity,
      storeKeeperSignature,
      receiverSignature,
      issuedBy: currentUser.id
    });

    if (res.success) {
      addToast(`Kit successfully issued (${res.issuanceIds.length} items processed per Rule G8).`, 'success');
      navigate('/issuances');
    } else {
      addToast('Error issuing kit.', 'error');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title="Issue Standardized Job Kit (PPE-035)" 
        subtitle="Bundled issuance with auto-suggestion by position and partial stock fulfillment (Rule G8)" 
        onBack={() => navigate('/issuances')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Recipient & Kit Selection">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Employee">
              <Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                {employees.filter(e => e.active).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Location">
              <Select value={locationId} onChange={e => setLocationId(e.target.value)}>
                {myLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {language === 'en' ? l.nameEn : l.nameAr}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="Standard Kit">
              <Select value={kitId} onChange={e => setKitId(e.target.value)}>
                {kits.filter(k => k.active && !k.deletedAt).map(k => (
                  <option key={k.id} value={k.id}>
                    {language === 'en' ? k.nameEn : k.nameAr}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Kit Multiplier (Quantity)">
              <Input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)} 
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Kit Items Stock Status (Rule G8 Partial Fulfillment) */}
        <FormSection 
          title="Kit Items Stock Status & Fulfillment (Rule G8)" 
          description="If an item is out of stock, Rule G8 allows partial fulfillment without creating an open backorder."
        >
          {isPartiallyAvailable && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-safety-amber-signal font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Some items have limited stock. Partial issuance will proceed for available items only (Rule G8).</span>
            </div>
          )}

          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5 text-center">Req Qty</th>
                  <th className="p-2.5 text-center">Available</th>
                  <th className="p-2.5 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kitItemsStockStatus.map(({ ki, item, reqQty, avail, isAvailable, isPartial, isOut }) => (
                  <tr key={ki.id} className="hover:bg-canvas/40">
                    <td className="p-2.5">
                      <div className="font-semibold text-ink">{item ? (language === 'en' ? item.nameEn : item.nameAr) : ki.ppeItemId}</div>
                      <div className="text-[10px] text-body font-mono">{item?.itemCode}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold">{reqQty}</td>
                    <td className="p-2.5 text-center font-bold font-mono">
                      <span className={avail > 0 ? 'text-safety-green' : 'text-safety-red'}>{avail}</span>
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      {isAvailable ? (
                        <span className="text-safety-green font-bold">✓ Full Stock</span>
                      ) : isPartial ? (
                        <span className="text-safety-amber-signal font-bold">Partial ({avail}/{reqQty})</span>
                      ) : (
                        <span className="text-safety-red font-bold">Out of Stock (Skipped)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        {/* Digital Signatures (Rule G7: single pair covers entire kit) */}
        <FormSection 
          title="Dual Digital Signatures (Rule G7)" 
          description="A single pair of captured signatures covers the entire kit issuance."
        >
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
          <Button type="submit" disabled={!hasAnyStock || !receiverSignature || !storeKeeperSignature}>
            Complete Kit Issuance
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
