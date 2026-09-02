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
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useToastStore } from '../store/toastStore';
import { 
  ShieldAlert, Plus, Download, CornerDownLeft, Eye, Clock, 
  AlertTriangle, CheckCircle2, User, Building, AlertOctagon 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { VisitorLoan, VisitorLoanItem } from '../types';

export default function OpenLoans() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    visitorLoans, 
    ppeItems, 
    employees, 
    locations, 
    currentUser, 
    returnLoanLine 
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt);
    }
    return locations.filter(l => l.active && !l.deletedAt && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Filters (NEW-08): Defaults to Open & Overdue
  const [statusFilter, setStatusFilter] = React.useState<'active_only' | 'all' | 'Open' | 'Overdue' | 'Partially Returned' | 'Closed'>('active_only');
  const [search, setSearch] = React.useState('');
  const [locationFilter, setLocationFilter] = React.useState('all');

  // Selected Loan for Detail View / Returns Drawer
  const [selectedLoan, setSelectedLoan] = React.useState<VisitorLoan | null>(null);

  // Return Line Modal State (BD-I471)
  const [returnModal, setReturnModal] = React.useState<{
    isOpen: boolean;
    loan: VisitorLoan | null;
    line: VisitorLoanItem | null;
    returnQty: number;
    condition: 'good' | 'damaged' | 'lost';
    storeKeeperSig: string;
    receiverSig: string;
    submitting: boolean;
  }>({
    isOpen: false,
    loan: null,
    line: null,
    returnQty: 1,
    condition: 'good',
    storeKeeperSig: '',
    receiverSig: '',
    submitting: false
  });

  const filteredLoans = React.useMemo(() => {
    return visitorLoans
      .map(loan => {
        // Calculate dynamic Overdue status if Expected Return Date < Today and not fully closed
        const isPastDue = new Date(loan.expectedReturnDate) < new Date();
        const unreturnedLines = loan.items.some(i => i.quantity - (i.returnedQuantity || 0) > 0);
        const dynamicStatus = (isPastDue && unreturnedLines && loan.status !== 'Closed') ? 'Overdue' : loan.status;
        const daysLate = isPastDue ? Math.max(0, differenceInDays(new Date(), new Date(loan.expectedReturnDate))) : 0;

        return {
          ...loan,
          computedStatus: dynamicStatus,
          daysLate
        };
      })
      .filter(loan => {
        // Scoped to Store Keeper's assigned locations
 const matchesLocation = loan.items.some(item => 
 assignedLocations.some(al => al.id === item.fromLocationId)
 );
 if (isStoreKeeper && !matchesLocation) return false;

 // Status Filter
 if (statusFilter === 'active_only') {
 if (loan.computedStatus === 'Closed') return false;
 } else if (statusFilter !== 'all' && loan.computedStatus !== statusFilter) {
 return false;
 }

 // Location Filter
 if (locationFilter !== 'all') {
 const inLoc = loan.items.some(i => i.fromLocationId === locationFilter);
 if (!inLoc) return false;
 }

 // Search Filter
 if (search.trim()) {
 const q = search.toLowerCase();
 const hostEmp = employees.find(e => e.id === loan.hostEmployeeId);
 const matchHost = hostEmp?.name.toLowerCase().includes(q);
 const matchRecipient = loan.recipientName.toLowerCase().includes(q);
 const matchCompany = loan.recipientCompany.toLowerCase().includes(q);
 const matchNumber = loan.loanNumber.toLowerCase().includes(q);
 if (!matchHost && !matchRecipient && !matchCompany && !matchNumber) return false;
 }

 return true;
 })
 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 }, [visitorLoans, assignedLocations, isStoreKeeper, statusFilter, locationFilter, search, employees]);

 const handleOpenReturnLine = (loan: VisitorLoan, line: VisitorLoanItem) => {
 const remainingQty = line.quantity - (line.returnedQuantity || 0);
 setReturnModal({
 isOpen: true,
 loan,
 line,
 returnQty: remainingQty,
 condition: 'good',
 storeKeeperSig: '',
 receiverSig: '',
 submitting: false
 });
 };

 const handleConfirmReturnLine = () => {
 if (!returnModal.loan || !returnModal.line) return;

 if (!returnModal.storeKeeperSig || !returnModal.receiverSig) {
 addToast('Dual digital signatures (Store Keeper & Recipient) are mandatory for returns.', 'error');
 return;
 }

 setReturnModal(prev => ({ ...prev, submitting: true }));

 const res = returnLoanLine({
 loanId: returnModal.loan.id,
 lineId: returnModal.line.id,
 returnedQuantity: returnModal.returnQty,
 condition: returnModal.condition,
 storeKeeperSignature: returnModal.storeKeeperSig,
 recipientSignature: returnModal.receiverSig
 });

 setReturnModal(prev => ({ ...prev, submitting: false }));

 if (!res.success) {
 addToast(res.error || 'Return processing failed.', 'error');
    } else {
      addToast(`Loan item return recorded successfully.`, 'success');
      setReturnModal({
        isOpen: false,
        loan: null,
        line: null,
        returnQty: 1,
        condition: 'good',
        storeKeeperSig: '',
        receiverSig: '',
        submitting: false
      });
      // Refresh selected loan drawer if open
      const updated = usePPEStore.getState().visitorLoans.find(l => l.id === returnModal.loan!.id);
      setSelectedLoan(updated || null);
    }
  };

  const handleExportExcel = () => {
    addToast('Exported Open_Visitor_Loans.xlsx', 'info');
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from viewing loan records.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Open Visitor / Contractor Loans (NEW-08)"
        subtitle="Track temporary visitor issuances, overdue countdowns, partial returns, and dual signatures (BD-I470 & BD-I471)"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportExcel}>
              <Download className="w-4 h-4 me-1.5" /> Export Excel
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/issuances/new-loan')}>
              <Plus className="w-4 h-4 me-1.5" /> Issue New Loan
            </Button>
          </div>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search LN-number, recipient, company, or host..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 text-xs"
          />

          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-48 text-xs"
          >
            <option value="active_only">Open & Overdue (Active Only)</option>
            <option value="all">All Loans (Including Closed)</option>
            <option value="Open">Open</option>
            <option value="Overdue">Overdue</option>
            <option value="Partially Returned">Partially Returned</option>
            <option value="Closed">Closed</option>
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
          data={filteredLoans}
        keyExtractor={item => item.id}
        emptyState={<EmptyState icon={<ShieldAlert />} title="No visitor loans found" />}
        columns={[
          {
            key: 'loanNumber',
            header: 'Loan #',
            render: l => <span className="font-mono text-xs font-bold text-slate-900">{l.loanNumber}</span>
          },
          {
            key: 'recipient',
            header: 'Recipient & Company',
            render: l => (
              <div>
                <div className="font-semibold text-slate-800 text-xs">{l.recipientName}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" /> {l.recipientCompany}
                </div>
              </div>
            )
          },
          {
            key: 'host',
            header: 'Host Employee',
            render: l => {
              const host = employees.find(e => e.id === l.hostEmployeeId);
              return (
                <div className="text-xs">
                  <span className="font-medium text-slate-800">{host?.name || 'Unknown'}</span>
                  <div className="text-[10px] text-slate-400">{host?.jobPosition || host?.jobPositionId}</div>
                </div>
              );
            }
          },
          {
            key: 'itemsCount',
            header: 'Items',
            render: l => {
              const total = l.items.reduce((s, i) => s + i.quantity, 0);
              const returned = l.items.reduce((s, i) => s + (i.returnedQuantity || 0), 0);
              return (
                <span className="text-xs font-mono font-medium">
                  {returned} / {total} returned
                </span>
              );
            }
          },
          {
            key: 'issueDate',
            header: 'Issue Date',
            render: l => format(new Date(l.issueDate), 'MMM d, yyyy')
          },
          {
            key: 'expectedReturn',
            header: 'Expected Return',
            render: l => {
              const isOverdue = l.computedStatus === 'Overdue';
              return (
                <div>
                  <div className={`text-xs font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                    {format(new Date(l.expectedReturnDate), 'MMM d, yyyy')}
                  </div>
                  {isOverdue && l.daysLate > 0 && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {l.daysLate} day{l.daysLate > 1 ? 's' : ''} late
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            key: 'status',
            header: 'Status',
            render: l => (
              <StatusBadge
                status={
                  l.computedStatus === 'Closed'
                    ? 'success'
                    : l.computedStatus === 'Overdue'
                    ? 'error'
                    : l.computedStatus === 'Partially Returned'
                    ? 'warning'
                    : 'info'
                }
                label={l.computedStatus}
              />
            )
          },
          {
            key: 'actions',
            header: '',
            className: 'text-end',
            render: l => (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLoan(l)}
              >
                <Eye className="w-3.5 h-3.5 me-1" /> View / Return
              </Button>
            )
          }
        ]}
      />
      </ContainerCard>

      {/* SlideOut Details & Return Drawer */}
      <SlideOverDrawer
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title={selectedLoan ? `Loan ${selectedLoan.loanNumber}` : 'Loan Details'}
      >
        {selectedLoan && (
          <div className="space-y-6 text-xs">
            {/* Header Snapshot */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLoan.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-semibold text-slate-800">{selectedLoan.recipientName} ({selectedLoan.recipientCompany})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host Employee:</span>
                <span className="text-slate-800">{employees.find(e => e.id === selectedLoan.hostEmployeeId)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issue Date:</span>
                <span className="text-slate-800">{format(new Date(selectedLoan.issueDate), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Return:</span>
                <span className="font-bold text-slate-900">{format(new Date(selectedLoan.expectedReturnDate), 'PP')}</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Loaned Items ({selectedLoan.items.length})
              </h4>

              <div className="space-y-2">
                {selectedLoan.items.map(item => {
                  const ppe = ppeItems.find(p => p.id === item.ppeItemId);
                  const loc = locations.find(l => l.id === item.fromLocationId);
                  const remaining = item.quantity - (item.returnedQuantity || 0);

                  return (
                    <div
                      key={item.id}
                      className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {ppe?.nameEn} <span className="font-normal text-slate-500">({item.variantKey})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          From: {loc?.nameEn} | Batch: <span className="font-mono">{item.batchNumber}</span>
                        </div>
                        <div className="text-[11px] mt-1">
                          <span className="font-mono font-bold text-slate-800">{item.returnedQuantity || 0}</span> / {item.quantity} returned{' '}
                          {remaining > 0 ? (
                            <span className="text-amber-700 font-semibold">({remaining} still out)</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">(Fully Returned)</span>
                          )}
                        </div>
                      </div>

                      {remaining > 0 && selectedLoan.status !== 'Closed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenReturnLine(selectedLoan, item)}
                        >
                          <CornerDownLeft className="w-3.5 h-3.5 me-1" /> Return Item
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Embedded Signatures from Issuance */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 text-xs">Captured Issuance Signatures</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 border border-slate-200 rounded text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">Store Keeper</span>
                  {selectedLoan.storeKeeperSignature ? (
                    <img
                      src={selectedLoan.storeKeeperSignature}
                      alt="Store Keeper Signature"
                      className="h-10 mx-auto object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No signature</span>
                  )}
                </div>
                <div className="p-2 border border-slate-200 rounded text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">Recipient</span>
                  {selectedLoan.receiverSignature ? (
                    <img
                      src={selectedLoan.receiverSignature}
                      alt="Recipient Signature"
                      className="h-10 mx-auto object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No signature</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Return Line Modal (BD-I471) */}
      <Modal
        opened={returnModal.isOpen && !!returnModal.line}
        onClose={() => setReturnModal({
          isOpen: false,
          loan: null,
          line: null,
          returnQty: 1,
          condition: 'good',
          storeKeeperSig: '',
          receiverSig: '',
          submitting: false
        })}
        title="Return Loaned Item (BD-I471)"
        subtitle={returnModal.loan?.loanNumber}
        icon={<CornerDownLeft className="w-5 h-5 text-blue-600" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setReturnModal({
                isOpen: false,
                loan: null,
                line: null,
                returnQty: 1,
                condition: 'good',
                storeKeeperSig: '',
                receiverSig: '',
                submitting: false
              })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReturnLine}
              disabled={returnModal.submitting}
            >
              Complete Loan Return
            </Button>
          </div>
        }
      >
        {returnModal.line && (
          <div className="text-xs space-y-4">
            <div>
              <span className="text-slate-500 ">Item:</span>{' '}
              <span className="font-bold text-slate-800 ">
                {ppeItems.find(p => p.id === returnModal.line?.ppeItemId)?.nameEn} ({returnModal.line?.variantKey})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Return</label>
                <Input
                  type="number"
                  min={1}
                  max={returnModal.line.quantity - (returnModal.line.returnedQuantity || 0)}
                  value={returnModal.returnQty}
                  onChange={e => setReturnModal(prev => ({ ...prev, returnQty: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition on Return</label>
                <Select
                  value={returnModal.condition}
                  onChange={e => setReturnModal(prev => ({ ...prev, condition: e.target.value as any }))}
                >
                  <option value="good">Good (Returns to Used Pool)</option>
                  <option value="damaged">Damaged (Auto-Scraps to Site Scrap)</option>
                  <option value="lost">Lost (Closes line, no stock movement)</option>
                </Select>
              </div>
            </div>

            {returnModal.condition === 'damaged' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 ">
                <span className="font-bold">Auto-Scrap Notice:</span> Damaged items route strictly to the Scrap location of the issuing site. If the site has no Scrap location, this return will be blocked.
              </div>
            )}

            {/* Dual Digital Signatures for Return Event */}
            <div className="space-y-3 pt-2 border-t border-slate-100 ">
              <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Dual Digital Signatures for Return Event (Mandatory)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignaturePad
                  label={`Store Keeper: ${currentUser.name}`}
                  onSave={sig => setReturnModal(prev => ({ ...prev, storeKeeperSig: sig }))}
                  required
                />
                <SignaturePad
                  label={`Returning Recipient: ${returnModal.loan?.recipientName}`}
                  onSave={sig => setReturnModal(prev => ({ ...prev, receiverSig: sig }))}
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
