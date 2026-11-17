import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { SignatureModal } from '../components/ui/SignatureModal';
import { useToastStore } from '../store/toastStore';
import { ShieldAlert, Plus, CornerDownLeft, X, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Issuance } from '../types';
import { SerialPicker } from '../components/serials/SerialPicker';

export default function Issuances({ openLoansOnly = false }: { openLoansOnly?: boolean }) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { issuances, ppeItems, employees, currentUser, returnItem, serialUnits, units } = usePPEStore();
  const [returnSerialIds, setReturnSerialIds] = React.useState<string[]>([]);
  const symOf = (ppeItemId?: string) => units.find(u => u.id === ppeItems.find(p => p.id === ppeItemId)?.unitId)?.symbol || '';
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(openLoansOnly ? 'issued' : 'all');

  const [returnModal, setReturnModal] = React.useState<{ isOpen: boolean; issuanceId: string | null; maxQty: number }>({ isOpen: false, issuanceId: null, maxQty: 1 });
  const [returnQty, setReturnQty] = React.useState(1);
  const [returnCondition, setReturnCondition] = React.useState<'good' | 'damaged' | 'worn_out' | 'lost'>('good');
  const [physicalReceipt, setPhysicalReceipt] = React.useState(true);
  const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
  const [employeeSignature, setEmployeeSignature] = React.useState('');
  const [activeSigner, setActiveSigner] = React.useState<'storeKeeper' | 'employee' | null>(null);

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? usePPEStore.getState().locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper]);

  const filteredIssuances = React.useMemo(() => {
    return issuances.filter(i => {
      if (openLoansOnly) {
        if (!i.expectedReturnDate && !i.isLoan) return false;
        if (i.status !== 'issued') return false;
      }
      if (isStoreKeeper && !myLocations.includes(i.locationId)) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const targetName = i.employeeId
          ? employees.find(e => e.id === i.employeeId)?.name?.toLowerCase()
          : i.holderName?.toLowerCase();
        const refMatch = (i.reference || i.id).toLowerCase().includes(q);
        const compMatch = (i.companyName || '').toLowerCase().includes(q);

        return targetName?.includes(q) || refMatch || compMatch;
      }
      return true;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issuances, openLoansOnly, isStoreKeeper, myLocations, statusFilter, search, employees]);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal.issuanceId) return;

    if ((returnCondition === 'damaged' || returnCondition === 'worn_out') && !physicalReceipt) {
      addToast('Physical receipt must be confirmed for damaged or worn out items (PPE-038).', 'error');
      return;
    }

    const target = issuances.find(i => i.id === returnModal.issuanceId);
    const tracked = !!target?.serialIds?.length;
    if (tracked && returnSerialIds.length === 0) {
      addToast('Pick or scan the returned serial numbers.', 'error');
      return;
    }

    const res = returnItem(
      returnModal.issuanceId,
      returnCondition,
      returnCondition === 'lost' ? false : physicalReceipt,
      currentUser.id,
      {
        quantity: tracked ? returnSerialIds.length : returnQty,
        storeKeeperSignature,
        employeeSignature,
        serialIds: tracked ? returnSerialIds : undefined
      }
    );
    if (!res.success) {
      addToast(res.message || 'Return failed.', 'error');
      return;
    }
    addToast('Return processed successfully (stock condition routed per Rule G6).', 'success');
    setReturnModal({ isOpen: false, issuanceId: null, maxQty: 1 });
  };

  return (
    <div>
      <PageHeader
        title={openLoansOnly ? "Open Loans & Temporary Custody (PPE-041)" : t('issuance')}
        subtitle={openLoansOnly ? "Track active equipment loaned to visitors, contractors, and temporary personnel with overdue monitoring" : "Full record of issued, returned, and scrapped safety equipment"}
        actions={
          openLoansOnly ? (
            <Button onClick={() => navigate('/issuances/new-loan')}>
              <Plus className="w-4 h-4 mr-2" /> Issue New Loan
            </Button>
          ) : (
            <div className="relative group">
              <Button><Plus className="w-4 h-4 mr-2" /> {t('issuePpe')}</Button>
              <div className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded-md shadow-lg hidden group-hover:block z-10">
                <div className="py-1">
                  <button onClick={() => navigate('/issuances/new')} className="block w-full text-left px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas">Issue Single Item</button>
                  <button onClick={() => navigate('/issuances/new-kit')} className="block w-full text-left px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas">Issue Standard Kit</button>
                  <button onClick={() => navigate('/issuances/new-loan')} className="block w-full text-left px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas">Issue Temporary Loan</button>
                </div>
              </div>
            </div>
          )
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search by name, reference, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!openLoansOnly && (
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-48">
            <option value="all">All Statuses</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="scrapped">Scrapped</option>
          </Select>
        )}
      </FilterBar>

      <DataTable
        data={filteredIssuances}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<ShieldAlert />} title={openLoansOnly ? "No open loans currently active" : "No issuances found"} />}
        columns={[
          { key: 'ref', header: 'Reference', render: (i) => (
            <div>
              <span className="font-mono text-xs font-bold text-ink">{i.reference || i.id}</span>
              {i.isHistorical && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Imported
                </span>
              )}
            </div>
          )},
          { key: 'target', header: 'Holder / Recipient', render: (i) => {
            if (i.employeeId) {
              const emp = employees.find(e => e.id === i.employeeId);
              return (
                <div>
                  <div className="font-semibold text-ink">{emp?.name}</div>
                  <div className="text-[11px] font-mono text-body">{emp?.employeeCode}</div>
                </div>
              );
            }
            return (
              <div>
                <div className="font-semibold text-ink">
                  {i.holderName} <span className="text-[10px] text-accent font-bold">({i.holderType || 'Visitor'})</span>
                </div>
                {i.companyName && <div className="text-[11px] text-body">{i.companyName}</div>}
              </div>
            );
          }},
          { key: 'item', header: 'Equipment / Kit', render: (i) => {
            if (i.ppeItemId) {
              const ppe = ppeItems.find(p => p.id === i.ppeItemId);
              return (
                <div>
                  <div className="font-medium text-ink">{ppe ? ppe.name : i.ppeItemId}</div>
                  <div className="text-[11px] text-body font-mono">{ppe?.itemCode} &middot; Qty: {i.quantity} {symOf(i.ppeItemId)}</div>
                  {!!i.serialIds?.length && (
                    <div className="text-[10px] font-mono text-accent">{i.serialIds.map(id => serialUnits.find(u => u.id === id)?.serial).filter(Boolean).join(', ')}</div>
                  )}
                </div>
              );
            }
            if (i.kitId) {
              const kit = usePPEStore.getState().kits?.find(k => k.id === i.kitId);
              return (
                <div>
                  <div className="font-medium text-ink">{kit ? kit.name : 'Job Kit'}</div>
                  <div className="text-[11px] text-accent font-semibold">Standardized Kit (Qty: {i.quantity})</div>
                </div>
              );
            }
            return 'Equipment';
          }},
          { key: 'issueDate', header: 'Issued Date', render: (i) => format(new Date(i.issueDate), 'yyyy-MM-dd') },
          { key: 'dueDate', header: openLoansOnly ? 'Expected Return (PPE-041)' : 'Due / Return Date', render: (i) => {
            const d = i.expectedReturnDate || i.expectedReplacementDate;
            if (!d) return '-';
            const isOverdue = new Date(d) < new Date() && i.status === 'issued';
            const daysDiff = differenceInDays(new Date(d), new Date());

            return (
              <div>
                <span className={`font-mono text-xs font-semibold ${isOverdue ? 'text-safety-red font-bold' : ''}`}>
                  {format(new Date(d), 'yyyy-MM-dd')}
                </span>
                {isOverdue && (
                  <span className="block text-[10px] font-bold text-safety-red uppercase">
                    {Math.abs(daysDiff)} days overdue!
                  </span>
                )}
              </div>
            );
          }},
          { key: 'status', header: 'Status', render: (i) => {
            const d = i.expectedReturnDate || i.expectedReplacementDate;
            const isOverdue = d && new Date(d) < new Date() && i.status === 'issued';
            return (
              <StatusBadge
                status={isOverdue ? 'error' : i.status === 'issued' ? 'info' : 'success'}
                label={isOverdue ? 'Overdue' : i.status}
              />
            );
          }},
          { key: 'actions', header: '', className: 'text-right w-28', render: (i) => {
            if ((i.status === 'issued' || i.status === 'partially_returned') && !i.isLoan && ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'].includes(currentUser.role)) {
              return (
                <Button variant="secondary" size="sm" onClick={() => {
                  setReturnModal({ isOpen: true, issuanceId: i.id, maxQty: i.quantity });
                  setReturnQty(i.quantity);
                  setReturnCondition('good');
                  setPhysicalReceipt(true);
                  setStoreKeeperSignature('');
                  setEmployeeSignature('');
                  setReturnSerialIds([]);
                }}>
                  <CornerDownLeft className="w-3 h-3 mr-1" /> Return
                </Button>
              );
            }
            return null;
          }}
        ]}
      />

      {/* Return Modal with Condition Routing & Dual Signatures (PPE-038) */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-canvas">
              <h3 className="font-bold text-ink text-sm">Return PPE Equipment (PPE-038 & Rule G6)</h3>
              <button onClick={() => setReturnModal({ isOpen: false, issuanceId: null, maxQty: 1 })} className="text-body hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-5 flex-1 overflow-auto space-y-4">
              {(() => {
                const iss = issuances.find(x => x.id === returnModal.issuanceId);
                if (!iss?.serialIds?.length) return null;
                // PPE-058: pick or scan from the serials this person holds on this issuance
                const held = serialUnits.filter(u => iss.serialIds!.includes(u.id) && !iss.returnedSerialIds?.includes(u.id) && u.status === 'Issued' && u.holderIssuanceId === iss.id);
                return (
                  <SerialPicker ppeItemId={iss.ppeItemId!} candidates={held} value={returnSerialIds} onChange={setReturnSerialIds} label="Returned serial numbers *" />
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!issuances.find(x => x.id === returnModal.issuanceId)?.serialIds?.length && (
                <div>
                  <label className="block text-xs font-bold text-body uppercase tracking-wider mb-1">
                    Quantity Returned *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={returnModal.maxQty}
                    value={returnQty}
                    onChange={(e) => setReturnQty(Math.max(1, Math.min(returnModal.maxQty, parseInt(e.target.value, 10) || 1)))}
                    required
                  />
                  <span className="text-[10px] text-body">Max: {returnModal.maxQty} issued</span>
                </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-body uppercase tracking-wider mb-1">
                    Condition Upon Return *
                  </label>
                  <Select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as any)}>
                    <option value="good">Good (Routes to Used Store)</option>
                    <option value="damaged">Damaged (Routes to Scrap)</option>
                    <option value="worn_out">Worn Out (Routes to Scrap)</option>
                    <option value="lost">Lost (No stock returned)</option>
                  </Select>
                </div>
              </div>

              {returnCondition === 'good' && (
                <p className="text-[11px] text-safety-green font-medium bg-green-50 p-2 rounded border border-green-200">
                  Good Condition: Returned stock will be routed to the Used Equipment location (Rule G6).
                </p>
              )}
              {(returnCondition === 'damaged' || returnCondition === 'worn_out') && (
                <p className="text-[11px] text-safety-red font-medium bg-red-50 p-2 rounded border border-red-200">
                  Damaged/Worn Out: Item will be auto-scrapped and routed to the Scrap location (Rule G6 & PPE-038).
                </p>
              )}
              {returnCondition === 'lost' && (
                <p className="text-[11px] text-safety-amber-signal font-medium bg-amber-50 p-2 rounded border border-amber-200">
                  Lost Item: Marked as lost; voucher closed with no inventory restored.
                </p>
              )}

              {returnCondition !== 'lost' && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={physicalReceipt}
                      onChange={(e) => setPhysicalReceipt(e.target.checked)}
                      className="rounded border-border w-4 h-4 text-accent"
                    />
                    <span className="text-xs text-ink font-semibold">I have physically verified and received the item back *</span>
                  </label>
                </div>
              )}

              {/* Dual Signatures Pad (PPE-038) */}
              <div className="pt-2 border-t border-border">
                <div className="text-xs font-bold text-body uppercase tracking-wider mb-2">Dual Return Signatures (PPE-038)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border rounded p-2.5 bg-canvas flex flex-col items-center justify-center min-h-[90px]">
                    <span className="text-[10px] font-bold uppercase text-body mb-1.5">Employee Signature</span>
                    {employeeSignature ? (
                      <img src={employeeSignature} alt="Employee" className="h-8 max-w-[120px] bg-white border border-border rounded" />
                    ) : (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setActiveSigner('employee')}>
                        Sign (Employee)
                      </Button>
                    )}
                  </div>

                  <div className="border border-border rounded p-2.5 bg-canvas flex flex-col items-center justify-center min-h-[90px]">
                    <span className="text-[10px] font-bold uppercase text-body mb-1.5">Store Keeper Signature</span>
                    {storeKeeperSignature ? (
                      <img src={storeKeeperSignature} alt="Store Keeper" className="h-8 max-w-[120px] bg-white border border-border rounded" />
                    ) : (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setActiveSigner('storeKeeper')}>
                        Sign (Store Keeper)
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setReturnModal({ isOpen: false, issuanceId: null, maxQty: 1 })}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={(returnCondition === 'damaged' || returnCondition === 'worn_out') && !physicalReceipt}>
                  Complete Return
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Capture Modal */}
      <SignatureModal
        isOpen={!!activeSigner}
        title={activeSigner === 'employee' ? 'Employee Return Signature' : 'Store Keeper Return Signature'}
        onClose={() => setActiveSigner(null)}
        onSave={(dataUrl) => {
          if (activeSigner === 'employee') setEmployeeSignature(dataUrl);
          else setStoreKeeperSignature(dataUrl);
          setActiveSigner(null);
        }}
      />
    </div>
  );
}
