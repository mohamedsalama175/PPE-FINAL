import * as React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ContainerCard } from '../components/ui/ContainerCard';
import { Modal } from '../components/ui/Modal';
import { SignaturePad } from '../components/ui/SignaturePad';
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { useToastStore } from '../store/toastStore';
import { 
  ShieldAlert, Plus, CornerDownLeft, Eye, RotateCcw, 
  CheckCircle2, Clock, AlertTriangle, User, AlertOctagon,
  FileText, ArrowRight, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { Issuance } from '../types';

export default function Issuances({ openLoansOnly = false }: { openLoansOnly?: boolean }) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    issuances, 
    ppeItems, 
    employees, 
    locations, 
    currentUser, 
    returnPPE, 
    kits 
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt);
    }
    return locations.filter(l => l.active && !l.deletedAt && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [locationFilter, setLocationFilter] = React.useState('all');

  // Detail Drawer state
  const [selectedIssuance, setSelectedIssuance] = React.useState<Issuance | null>(null);

  // Return Modal State (BD-I472)
  const [returnModal, setReturnModal] = React.useState<{
    isOpen: boolean;
    issuance: Issuance | null;
    quantity: number;
    condition: 'good' | 'damaged' | 'worn_out' | 'lost';
    physicalReceiptConfirmed: boolean;
    storeKeeperSignature: string;
    receiverSignature: string;
    submitting: boolean;
    error?: string;
  }>({
    isOpen: false,
    issuance: null,
    quantity: 1,
    condition: 'good',
    physicalReceiptConfirmed: true,
    storeKeeperSignature: '',
    receiverSignature: '',
    submitting: false
  });

  const filteredIssuances = React.useMemo(() => {
    return issuances
      .filter(i => {
        if (isStoreKeeper && !assignedLocations.some(l => l.id === i.locationId)) return false;
        if (statusFilter !== 'all' && i.status !== statusFilter) return false;
        if (locationFilter !== 'all' && i.locationId !== locationFilter) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const emp = employees.find(e => e.id === i.employeeId);
          const ppe = ppeItems.find(p => p.id === i.ppeItemId);
          const matchEmp = emp?.name.toLowerCase().includes(q) || emp?.employeeCode.toLowerCase().includes(q);
          const matchItem = ppe?.nameEn.toLowerCase().includes(q) || ppe?.itemCode.toLowerCase().includes(q);
          const matchRef = i.reference.toLowerCase().includes(q);
          if (!matchEmp && !matchItem && !matchRef) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issuances, isStoreKeeper, assignedLocations, statusFilter, locationFilter, search, employees, ppeItems]);

  const handleOpenReturnModal = (i: Issuance) => {
    setReturnModal({
      isOpen: true,
      issuance: i,
      quantity: i.quantity,
      condition: 'good',
      physicalReceiptConfirmed: true,
      storeKeeperSignature: '',
      receiverSignature: '',
      submitting: false,
      error: undefined
    });
  };

  const handleConfirmReturn = () => {
    if (!returnModal.issuance) return;

    if ((returnModal.condition === 'damaged' || returnModal.condition === 'worn_out') && !returnModal.physicalReceiptConfirmed) {
      setReturnModal(prev => ({
        ...prev,
        error: 'Physical receipt must be confirmed when returning damaged or worn out equipment.'
      }));
      return;
    }

    if (!returnModal.storeKeeperSignature || !returnModal.receiverSignature) {
      setReturnModal(prev => ({
        ...prev,
        error: 'Dual digital signatures (Store Keeper & Employee) are mandatory for returns.'
      }));
      return;
    }

    setReturnModal(prev => ({ ...prev, submitting: true, error: undefined }));

    const res = returnPPE({
      issuanceId: returnModal.issuance.id,
      quantity: returnModal.quantity,
      condition: returnModal.condition,
      physicalReceiptConfirmed: returnModal.physicalReceiptConfirmed,
      storeKeeperSignature: returnModal.storeKeeperSignature,
      receiverSignature: returnModal.receiverSignature
    });

    setReturnModal(prev => ({ ...prev, submitting: false }));

    if (!res.success) {
      setReturnModal(prev => ({ ...prev, error: res.error }));
      addToast(res.error || 'Return failed', 'error');
    } else {
      addToast('Return and routing processed successfully.', 'success');
      setReturnModal({
        isOpen: false,
        issuance: null,
        quantity: 1,
        condition: 'good',
        physicalReceiptConfirmed: true,
        storeKeeperSignature: '',
        receiverSignature: '',
        submitting: false
      });
      setSelectedIssuance(null);
    }
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from issuing or returning PPE.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('issuance')}
        subtitle="Manage individual and kit employee issuances, returns, auto-scrapping, and dual signatures (BD-I467, BD-I468, BD-I472)"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/issuances/replacements-due')}>
              <Clock className="w-4 h-4 me-1.5 text-amber-600" /> Replacements Due
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/issuances/open-loans')}>
              <CornerDownLeft className="w-4 h-4 me-1.5 text-blue-600" /> Open Visitor Loans
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/issuances/new-kit')}>
              <Plus className="w-4 h-4 me-1.5" /> Issue Kit
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/issuances/new')}>
              <Plus className="w-4 h-4 me-1.5" /> Issue Single Item
            </Button>
          </div>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search employee, item name, code, or ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 text-xs"
          />

          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-40 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="issued">Currently Issued</option>
            <option value="returned">Returned</option>
            <option value="lost">Lost</option>
          </Select>

          <Select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-48 text-xs"
          >
            <option value="all">All Locations</option>
            {assignedLocations.map(l => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.nameEn}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredIssuances}
          keyExtractor={i => i.id}
          emptyState={<EmptyState icon={<ShieldAlert />} title="No issuances found" />}
          columns={[
          {
            key: 'reference',
            header: 'Reference',
            render: i => (
              <div>
                <span className="font-mono text-xs font-bold text-slate-900">{i.reference}</span>
                {i.imported && (
                  <span className="ms-1.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Imported
                  </span>
                )}
              </div>
            )
          },
          {
            key: 'employee',
            header: 'Employee',
            render: i => {
              const emp = employees.find(e => e.id === i.employeeId);
              return (
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{emp?.name || 'Unknown'}</div>
                  <div className="text-[11px] text-slate-500">
                    {emp?.employeeCode} — {emp?.jobPosition || emp?.jobPositionId}
                  </div>
                </div>
              );
            }
          },
          {
            key: 'item',
            header: 'PPE Item & Variant',
            render: i => {
              const ppe = ppeItems.find(p => p.id === i.ppeItemId);
              return (
                <div>
                  <div className="font-medium text-slate-800 text-xs">
                    {ppe ? (language === 'en' ? ppe.nameEn : ppe.nameAr) : i.ppeItemId}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Variant: {i.variantKey || 'Standard'} | Batch: {i.batchNumber}
                  </div>
                </div>
              );
            }
          },
          {
            key: 'quantity',
            header: 'Qty',
            render: i => <span className="font-mono font-bold text-slate-800">{i.quantity}</span>
          },
          {
            key: 'conditionAtIssue',
            header: 'Condition',
            render: i => (
              <span
                className={`text-[11px] font-semibold ${
                  i.conditionAtIssue === 'Reused' ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {i.conditionAtIssue || 'New'}
              </span>
            )
          },
          {
            key: 'dates',
            header: 'Issue / Replacement',
            render: i => (
              <div className="text-xs">
                <div>{format(new Date(i.issueDate), 'MMM d, yyyy')}</div>
                <div className="text-[10px] text-slate-500">
                  Repl: {i.expectedReplacementDate ? format(new Date(i.expectedReplacementDate), 'MMM d, yyyy') : '-'}
                </div>
              </div>
            )
          },
          {
            key: 'status',
            header: 'Status',
            render: i => (
              <StatusBadge
                status={i.status === 'issued' ? 'info' : i.status === 'returned' ? 'success' : 'neutral'}
                label={i.status === 'issued' ? 'Currently Held' : i.status}
              />
            )
          },
          {
            key: 'actions',
            header: '',
            className: 'text-end',
            render: i => (
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIssuance(i)}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>

                {i.status === 'issued' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenReturnModal(i)}
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 me-1" /> Return
                  </Button>
                )}
              </div>
            )
          }
        ]}
      />
      </ContainerCard>

      {/* Issuance Detail Drawer */}
      <SlideOverDrawer
        isOpen={!!selectedIssuance}
        onClose={() => setSelectedIssuance(null)}
        title={selectedIssuance ? `Issuance ${selectedIssuance.reference}` : 'Issuance Details'}
      >
        {selectedIssuance && (
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedIssuance.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold capitalize text-slate-800">{selectedIssuance.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-medium text-slate-800">
                  {employees.find(e => e.id === selectedIssuance.employeeId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issuing Location:</span>
                <span className="text-slate-800">
                  {locations.find(l => l.id === selectedIssuance.locationId)?.nameEn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issue Date:</span>
                <span className="text-slate-800">{format(new Date(selectedIssuance.issueDate), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Replacement:</span>
                <span className="font-bold text-slate-900">
                  {selectedIssuance.expectedReplacementDate ? format(new Date(selectedIssuance.expectedReplacementDate), 'PP') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Embedded Signatures */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 text-xs">Digital Signatures</h4>
              {selectedIssuance.imported || selectedIssuance.isImported ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-500 text-center">
                  Imported Historical Record (No signatures captured)
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 border border-slate-200 rounded text-center">
                    <span className="text-[10px] text-slate-500 block mb-1">Store Keeper</span>
                    {selectedIssuance.storeKeeperSignature ? (
                      <img
                        src={selectedIssuance.storeKeeperSignature}
                        alt="Store Keeper Signature"
                        className="h-10 mx-auto object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">No signature</span>
                    )}
                  </div>
                  <div className="p-2 border border-slate-200 rounded text-center">
                    <span className="text-[10px] text-slate-500 block mb-1">Employee</span>
                    {selectedIssuance.receiverSignature ? (
                      <img
                        src={selectedIssuance.receiverSignature}
                        alt="Employee Signature"
                        className="h-10 mx-auto object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">No signature</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Return Item & Auto-Scrap Modal (BD-I472) */}
      <Modal
        opened={returnModal.isOpen && !!returnModal.issuance}
        onClose={() => setReturnModal({
          isOpen: false,
          issuance: null,
          quantity: 1,
          condition: 'good',
          physicalReceiptConfirmed: true,
          storeKeeperSignature: '',
          receiverSignature: '',
          submitting: false
        })}
        title="Return PPE Item (BD-I472)"
        subtitle={returnModal.issuance?.reference}
        icon={<CornerDownLeft className="w-5 h-5 text-blue-600" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setReturnModal({
                isOpen: false,
                issuance: null,
                quantity: 1,
                condition: 'good',
                physicalReceiptConfirmed: true,
                storeKeeperSignature: '',
                receiverSignature: '',
                submitting: false
              })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReturn}
              disabled={returnModal.submitting}
            >
              Complete Return
            </Button>
          </div>
        }
      >
        {returnModal.issuance && (
          <div className="text-xs space-y-4">
            {returnModal.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{returnModal.error}</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 ">Item:</span>{' '}
              <span className="font-bold text-slate-800 ">
                {ppeItems.find(p => p.id === returnModal.issuance?.ppeItemId)?.nameEn} ({returnModal.issuance.variantKey})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Returned</label>
                <Input
                  type="number"
                  min={1}
                  max={returnModal.issuance.quantity}
                  value={returnModal.quantity}
                  onChange={e => setReturnModal(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
                <span className="text-[10px] text-slate-400 ">Max held: {returnModal.issuance.quantity}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition on Return</label>
                <Select
                  value={returnModal.condition}
                  onChange={e => setReturnModal(prev => ({ ...prev, condition: e.target.value as any }))}
                >
                  <option value="good">Good (Reusable to Used Pool)</option>
                  <option value="damaged">Damaged (Auto-Scrap to Scrap Yard)</option>
                  <option value="worn_out">Worn Out (Auto-Scrap to Scrap Yard)</option>
                  <option value="lost">Lost (Write-Off, No Stock Move)</option>
                </Select>
              </div>
            </div>

            {(returnModal.condition === 'damaged' || returnModal.condition === 'worn_out') && (
              <div className="p-3 bg-red-50 border border-red-200 rounded space-y-2">
                <div className="text-red-800 font-semibold">
                  Automatic Scrap Routing:
                </div>
                <p className="text-[11px] text-red-700 ">
                  Damaged items route strictly to the Scrap location of the issuing site. If the site has no Scrap location, this return will be blocked.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-red-900 ">
                  <input
                    type="checkbox"
                    checked={returnModal.physicalReceiptConfirmed}
                    onChange={e => setReturnModal(prev => ({ ...prev, physicalReceiptConfirmed: e.target.checked }))}
                    className="rounded text-red-600"
                  />
                  I confirm physical receipt of the damaged equipment
                </label>
              </div>
            )}

            {/* Dual Canvas Signatures (Rule 2) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 ">
              <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Dual Digital Signatures for Return (Mandatory)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignaturePad
                  label={`Store Keeper: ${currentUser.name}`}
                  onSave={sig => setReturnModal(prev => ({ ...prev, storeKeeperSignature: sig }))}
                  required
                />
                <SignaturePad
                  label={`Returning Employee: ${employees.find(e => e.id === returnModal.issuance?.employeeId)?.name}`}
                  onSave={sig => setReturnModal(prev => ({ ...prev, receiverSignature: sig }))}
                  required
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
