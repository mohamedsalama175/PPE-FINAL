import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { ContainerCard } from '../components/ui/ContainerCard';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useToastStore } from '../store/toastStore';
import { 
  Package, User, CheckCircle2, AlertTriangle, AlertCircle, 
  RotateCcw, Info, Check, X, ShieldAlert, Sparkles, AlertOctagon 
} from 'lucide-react';
import { Kit, Employee, PPEItem } from '../types';

export default function IssueKitForm() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    kits, 
    ppeItems, 
    locations, 
    employees, 
    currentUser, 
    batches, 
    issuances, 
    issueKitPPE,
    itemGroups,
    attributes
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap');
    }
    return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap' && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  const [locationId, setLocationId] = React.useState(assignedLocations[0]?.id || '');
  const [employeeId, setEmployeeId] = React.useState(employees[0]?.id || '');
  const [kitId, setKitId] = React.useState('');

  const selectedEmployee = React.useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
  const selectedLoc = React.useMemo(() => locations.find(l => l.id === locationId), [locations, locationId]);

  // Auto-suggest Kits matching Employee Job Position (BD-I468)
  const suggestedKits = React.useMemo(() => {
    if (!selectedEmployee) return [];
    const activeKits = kits.filter(k => k.active && !k.deletedAt);
    const empPos = (selectedEmployee.jobPosition || selectedEmployee.jobPositionId || '').toLowerCase();
    return activeKits.filter(k => (k.jobPosition || k.jobPositionId || '').toLowerCase() === empPos);
  }, [kits, selectedEmployee]);

  const otherKits = React.useMemo(() => {
    return kits.filter(k => k.active && !k.deletedAt && !suggestedKits.some(sk => sk.id === k.id));
  }, [kits, suggestedKits]);

  // Auto-select first suggested kit when employee changes
  React.useEffect(() => {
    if (suggestedKits.length > 0) {
      setKitId(suggestedKits[0].id);
    } else if (kits.length > 0 && !kitId) {
      setKitId(kits[0].id);
    }
  }, [suggestedKits]);

  const selectedKit = React.useMemo(() => kits.find(k => k.id === kitId), [kits, kitId]);

  // Customizable line items for this specific kit issuance
  const [lines, setLines] = React.useState<Array<{
    ppeItemId: string;
    variantKey: string;
    quantity: number;
    skip: boolean;
  }>>([]);

  // Populate lines when kit or employee changes
  React.useEffect(() => {
    if (!selectedKit) {
      setLines([]);
      return;
    }

    const kitLines = (selectedKit.lineItems || selectedKit.items || []) as any[];
    const initLines = kitLines.map(item => {
      const ppe = ppeItems.find(p => p.id === item.ppeItemId);
      // Look up employee's last received size for this item
 const lastReceived = selectedEmployee?.lastReceivedSizes?.[item.ppeItemId]?.rawKey;
 const defaultVariant = typeof item.defaultVariant === 'string' ? item.defaultVariant : 'Standard';

 return {
 ppeItemId: item.ppeItemId,
 variantKey: lastReceived || defaultVariant,
 quantity: item.quantity || item.qty || 1,
 skip: false
 };
 });

 setLines(initLines);
 }, [selectedKit, selectedEmployee, ppeItems]);

 // Dual signatures
 const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
 const [receiverSignature, setReceiverSignature] = React.useState('');
 const [submitting, setSubmitting] = React.useState(false);
 const [completedSummary, setCompletedSummary] = React.useState<{ issued: number; skipped: number } | null>(null);

 // Stock availability check per line
 const lineStockStatuses = React.useMemo(() => {
 if (!locationId) return {};

 const statuses: Record<string, { available: number; isOutOfStock: boolean; heldIssuance: any }> = {};

 lines.forEach(l => {
 const totalAvail = batches
 .filter(b => b.ppeItemId === l.ppeItemId && b.locationId === locationId && b.status === 'Active')
 .reduce((sum, b) => sum + b.availableQty, 0);

 const held = issuances.find(i => i.employeeId === employeeId && i.ppeItemId === l.ppeItemId && i.status === 'issued');

 statuses[l.ppeItemId] = {
 available: totalAvail,
 isOutOfStock: totalAvail < l.quantity,
 heldIssuance: held
 };
 });

 return statuses;
 }, [lines, batches, locationId, employeeId, issuances]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedKit) return;

 if (!storeKeeperSignature || !receiverSignature) {
 addToast('Dual digital signatures (Store Keeper & Employee) are strictly mandatory.', 'error');
 return;
 }

 const activeLinesToIssue = lines.filter(l => !l.skip);
 if (activeLinesToIssue.length === 0) {
 addToast('All lines are marked as skipped. Nothing to issue.', 'error');
      return;
    }

    setSubmitting(true);
    const result = issueKitPPE({
      employeeId,
      kitId: selectedKit.id,
      locationId,
      lines: activeLinesToIssue,
      storeKeeperSignature,
      receiverSignature
    });
    setSubmitting(false);

    setCompletedSummary({ issued: result.issuedCount, skipped: result.skippedCount });
    addToast(`Kit issuance completed: ${result.issuedCount} items issued, ${result.skippedCount} skipped due to stock.`, 'success');
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from kit issuances.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Issue Job-Specific Kit"
        subtitle="Auto-suggest kits by Job Position, prefill saved sizes, skip out-of-stock items, and capture dual canvas signatures (BD-I468)"
      />

      {completedSummary ? (
        <ContainerCard className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 ">Kit Issuance Completed</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Successfully created individual issuance tracking records for <span className="font-bold text-emerald-700 ">{completedSummary.issued} items</span>.
            {completedSummary.skipped > 0 && (
              <span className="block mt-1 text-slate-500 ">
                {completedSummary.skipped} item(s) were out of stock and skipped without creating an open sub-request.
              </span>
            )}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCompletedSummary(null)}>
              Issue Another Kit
            </Button>
            <Button variant="primary" onClick={() => navigate('/issuances')}>
              View Issuances List
            </Button>
          </div>
        </ContainerCard>
      ) : (
        <ContainerCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issuing Location <span className="text-red-500">*</span>
              </label>
              <Select value={locationId} onChange={e => setLocationId(e.target.value)} required>
                {assignedLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.nameEn} ({l.stockCondition})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Employee <span className="text-red-500">*</span>
              </label>
              <Select value={employeeId} onChange={e => setEmployeeId(e.target.value)} required>
                {employees
                  .filter(e => e.status === 'Active')
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.jobPosition || e.jobPositionId} ({e.site})
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {/* Kit Selector with Auto-Suggestion */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Select Job Kit (Position: {selectedEmployee?.jobPosition || selectedEmployee?.jobPositionId})
              </label>
              {suggestedKits.length > 0 && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {suggestedKits.length} suggested kit(s) for this position
                </span>
              )}
            </div>

            <Select value={kitId} onChange={e => setKitId(e.target.value)} required>
              {suggestedKits.length > 0 && (
                <optgroup label="⭐ Suggested for this Employee Position">
                  {suggestedKits.map(k => (
                    <option key={k.id} value={k.id}>
                      {language === 'en' ? k.nameEn : k.nameAr} ({(k.lineItems || k.items || []).length} items)
                    </option>
                  ))}
                </optgroup>
              )}
              {otherKits.length > 0 && (
                <optgroup label="Other Active Kits">
                  {otherKits.map(k => (
                    <option key={k.id} value={k.id}>
                      {language === 'en' ? k.nameEn : k.nameAr} — Position: {k.jobPosition || k.jobPositionId}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>

          {/* Line Items Grid with Out-of-Stock and Already-Held Flags */}
          {selectedKit && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kit Line Items ({lines.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Sizes prefilled from employee profile; out-of-stock items will be skipped automatically.
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Variant / Size</th>
                      <th className="p-3 w-20 text-center">Qty</th>
                      <th className="p-3">Stock & Held Status</th>
                      <th className="p-3 w-24 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const ppe = ppeItems.find(p => p.id === line.ppeItemId);
                      const status = lineStockStatuses[line.ppeItemId];
                      const isOos = status?.isOutOfStock;
                      const held = status?.heldIssuance;

                      return (
                        <tr
                          key={line.ppeItemId}
                          className={`hover:bg-slate-50 ${line.skip ? 'opacity-50 bg-slate-50' : ''}`}
                        >
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">
                              {ppe ? (language === 'en' ? ppe.nameEn : ppe.nameAr) : line.ppeItemId}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{ppe?.itemCode}</div>
                          </td>

                          <td className="p-3">
                            <Input
                              value={line.variantKey}
                              onChange={e => {
                                const val = e.target.value;
                                setLines(prev => prev.map((l, i) => i === idx ? { ...l, variantKey: val } : l));
                              }}
                              disabled={line.skip}
                              className="text-xs"
                              placeholder="e.g. Size L"
                            />
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {line.quantity}
                          </td>

                          <td className="p-3">
                            {isOos ? (
                              <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Out of stock (Avail: {status?.available || 0}) — Will be skipped</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                <span>In stock ({status?.available} avail)</span>
                              </div>
                            )}

                            {held && (
                              <div className="text-[10px] text-amber-700 mt-0.5">
                                Held, replacement due on {held.expectedReplacementDate || 'N/A'}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-end">
                            <button
                              type="button"
                              onClick={() => {
                                setLines(prev => prev.map((l, i) => i === idx ? { ...l, skip: !l.skip } : l));
                              }}
                              className={`text-[11px] font-semibold px-2 py-1 rounded border ${
                                line.skip
                                  ? 'bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-700 hover:text-red-600 border-slate-200'
                              }`}
                            >
                              {line.skip ? 'Include' : 'Skip Line'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dual Canvas Signatures (Rule 2) */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dual Digital Signatures (One pair for complete Kit)
              </h4>
              <p className="text-[11px] text-slate-500">
                A single pair of signatures validates the Kit issuance while generating itemized historical records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SignaturePad
                label={`Store Keeper: ${currentUser.name}`}
                onSave={setStoreKeeperSignature}
                required
              />
              <SignaturePad
                label={`Recipient Employee: ${selectedEmployee?.name || 'Employee'}`}
                onSave={setReceiverSignature}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 ">
            <Button type="button" variant="secondary" onClick={() => navigate('/issuances')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              Issue Kit Now
            </Button>
          </div>
        </form>
        </ContainerCard>
      )}
    </div>
  );
}
