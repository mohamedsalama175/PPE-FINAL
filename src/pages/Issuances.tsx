import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { ShieldAlert, Plus, CornerDownLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Issuance } from '../types';

export default function Issuances({ openLoansOnly = false }: { openLoansOnly?: boolean }) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { issuances, ppeItems, employees, currentUser, returnItem } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(openLoansOnly ? 'issued' : 'all');

  const [returnModal, setReturnModal] = React.useState<{ isOpen: boolean; issuanceId: string | null }>({ isOpen: false, issuanceId: null });
  const [returnCondition, setReturnCondition] = React.useState<'good' | 'damaged' | 'worn_out' | 'lost'>('good');
  const [physicalReceipt, setPhysicalReceipt] = React.useState(true);

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? usePPEStore.getState().locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper]);

  const filteredIssuances = React.useMemo(() => {
    return issuances.filter(i => {
      if (openLoansOnly && (!i.expectedReturnDate || i.status !== 'issued')) return false;
      if (isStoreKeeper && !myLocations.includes(i.locationId)) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      
      if (search) {
        const q = search.toLowerCase();
        const targetName = i.employeeId 
          ? employees.find(e => e.id === i.employeeId)?.name?.toLowerCase() 
          : i.holderName?.toLowerCase();
          
        return targetName?.includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issuances, openLoansOnly, isStoreKeeper, myLocations, statusFilter, search, employees]);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal.issuanceId) return;

    if ((returnCondition === 'damaged' || returnCondition === 'worn_out') && !physicalReceipt) {
      addToast('Physical receipt must be confirmed for damaged or worn out items.', 'error');
      return;
    }

    returnItem(returnModal.issuanceId, returnCondition, returnCondition === 'lost' ? false : physicalReceipt, currentUser.id);
    addToast('Return processed successfully.', 'success');
    setReturnModal({ isOpen: false, issuanceId: null });
  };

  return (
    <div>
      <PageHeader 
        title={openLoansOnly ? t('openLoans') : t('issuance')} 
        action={
          <div className="relative group">
            <Button><Plus className="w-4 h-4 mr-2" /> {t('issuePpe')}</Button>
            <div className="absolute right-0 mt-1 w-48 bg-surface border border-border rounded-md shadow-lg hidden group-hover:block z-10">
              <div className="py-1">
                <button onClick={() => navigate('/issuances/new')} className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas">Issue Single Item</button>
                <button onClick={() => navigate('/issuances/new-kit')} className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas">Issue Kit</button>
                <button onClick={() => navigate('/issuances/new-loan')} className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas">Issue Loan</button>
              </div>
            </div>
          </div>
        } 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder="Search by name..." 
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
        emptyState={<EmptyState icon={<ShieldAlert />} title="No issuances found" />}
        columns={[
          { key: 'target', header: 'Issued To', render: (i) => {
            if (i.employeeId) {
              const emp = employees.find(e => e.id === i.employeeId);
              return <div className="font-medium text-ink">{emp?.name}</div>;
            }
            return <div className="font-medium text-ink">{i.holderName} <span className="text-xs text-body font-normal">({i.holderType})</span></div>;
          }},
          { key: 'item', header: 'Item/Kit', render: (i) => {
            if (i.ppeItemId) {
              const ppe = ppeItems.find(p => p.id === i.ppeItemId);
              return ppe ? (language === 'en' ? ppe.nameEn : ppe.nameAr) : i.ppeItemId;
            }
            if (i.kitId) {
              const kit = usePPEStore.getState().kits?.find(k => k.id === i.kitId);
              return kit ? (language === 'en' ? kit.nameEn : kit.nameAr) + ' (Kit)' : 'Kit Issuance';
            }
            return 'Unknown Issuance';
          }},
          { key: 'issueDate', header: 'Issue Date', render: (i) => format(new Date(i.issueDate), 'MMM d, yyyy') },
          { key: 'dueDate', header: 'Due Date / Replacement', render: (i) => {
             const d = i.expectedReturnDate || i.expectedReplacementDate;
             return d ? format(new Date(d), 'MMM d, yyyy') : '-';
          }},
          { key: 'status', header: 'Status', render: (i) => (
            <StatusBadge 
              status={i.status === 'issued' ? ((i.expectedReturnDate || i.expectedReplacementDate) && new Date(i.expectedReturnDate || i.expectedReplacementDate!) < new Date() ? 'error' : 'info') : i.status === 'returned' ? 'success' : 'neutral'} 
              label={(i.expectedReturnDate || i.expectedReplacementDate) && new Date(i.expectedReturnDate || i.expectedReplacementDate!) < new Date() && i.status === 'issued' ? 'Overdue/Expired' : i.status} 
            />
          )},
          { key: 'actions', header: '', className: 'text-right w-32', render: (i) => {
            if (i.status === 'issued' && ['Admin', 'HSE Supervisor', 'Direct Supervisor', 'Store Keeper'].includes(currentUser.role)) {
              return (
                <Button variant="secondary" size="sm" onClick={() => {
                  setReturnModal({ isOpen: true, issuanceId: i.id });
                  setReturnCondition('good');
                  setPhysicalReceipt(true);
                }}>
                  <CornerDownLeft className="w-3 h-3 mr-1" /> Return
                </Button>
              )
            }
            return null;
          }}
        ]}
      />

      {/* Return Modal */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-bold text-ink">Return PPE Item</h3>
              <button onClick={() => setReturnModal({ isOpen: false, issuanceId: null })} className="text-body hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-4 flex-1 overflow-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-body uppercase tracking-wider mb-2">Condition upon return</label>
                  <Select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as any)}>
                    <option value="good">Good (Reusable)</option>
                    <option value="damaged">Damaged</option>
                    <option value="worn_out">Worn Out</option>
                    <option value="lost">Lost</option>
                  </Select>
                  {returnCondition === 'good' && <p className="text-[11px] text-body mt-1">Item will be returned to Used Stock pool.</p>}
                  {(returnCondition === 'damaged' || returnCondition === 'worn_out') && <p className="text-[11px] text-safety-amber-signal mt-1">Item will be automatically scrapped.</p>}
                  {returnCondition === 'lost' && <p className="text-[11px] text-safety-amber-signal mt-1">Item will be marked as lost (no scrap recorded).</p>}
                </div>

                {returnCondition !== 'lost' && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input 
                        type="checkbox" 
                        checked={physicalReceipt} 
                        onChange={(e) => setPhysicalReceipt(e.target.checked)} 
                        className="rounded border-border"
                      />
                      <span className="text-sm text-ink font-medium">I have physically received the item back</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setReturnModal({ isOpen: false, issuanceId: null })}>Cancel</Button>
                <Button type="submit">Complete Return</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
