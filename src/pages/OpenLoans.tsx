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
import { SignatureModal } from '../components/ui/SignatureModal';
import { downloadCsv } from '../lib/excelService';
import { useToastStore } from '../store/toastStore';
import { 
  Clock, Plus, CornerDownLeft, X, Eye, 
  Download, AlertTriangle, CheckCircle2, ShieldAlert,
  FileSpreadsheet, User, Building, MapPin, Check
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Issuance, LoanLineItem } from '../types';

interface ReturnLineFormState {
  lineId: string;
  selected: boolean;
  returnQty: number;
  condition: 'good' | 'damaged' | 'worn_out' | 'lost';
}

export default function OpenLoans() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { issuances, ppeItems, employees, locations, currentUser, returnLoan } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'active_overdue' | 'all' | 'open' | 'overdue' | 'partially_returned' | 'closed'>('active_overdue');
  const [locationFilter, setLocationFilter] = React.useState('all');

  // Modals state
  const [selectedLoan, setSelectedLoan] = React.useState<Issuance | null>(null);
  const [returnModalLoan, setReturnModalLoan] = React.useState<Issuance | null>(null);
  const [returnLinesState, setReturnLinesState] = React.useState<ReturnLineFormState[]>([]);

  // Signatures for return (PPE-037)
  const [receiverSignature, setReceiverSignature] = React.useState('');
  const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
  const [activeSigner, setActiveSigner] = React.useState<'receiver' | 'storeKeeper' | null>(null);

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper 
      ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) 
      : locations.map(l => l.id);
  }, [currentUser.id, isStoreKeeper, locations]);

  // All loan records
  const allLoans = React.useMemo(() => {
    return issuances.filter(i => i.isLoan || !!i.expectedReturnDate);
  }, [issuances]);

  // Compute status for a loan
  const getLoanStatus = React.useCallback((loan: Issuance) => {
    const isClosed = loan.status === 'returned';
    if (isClosed) return 'closed';

    const hasOverdue = loan.expectedReturnDate && new Date(loan.expectedReturnDate) < new Date();
    
    // Check lines
    const lines = loan.lines || [];
    const hasAnyReturned = lines.some(l => (l.returnedQty || 0) > 0 || l.status === 'returned');
    const allReturned = lines.length > 0 && lines.every(l => (l.returnedQty || 0) >= l.quantity || l.status === 'returned');

    if (allReturned) return 'closed';
    if (hasOverdue) return 'overdue';
    if (hasAnyReturned) return 'partially_returned';
    return 'open';
  }, []);

  // Summary counts
  const counts = React.useMemo(() => {
    let openCount = 0;
    let overdueCount = 0;
    let partialCount = 0;
    let closedCount = 0;

    allLoans.forEach(l => {
      const st = getLoanStatus(l);
      if (st === 'open') openCount++;
      else if (st === 'overdue') overdueCount++;
      else if (st === 'partially_returned') partialCount++;
      else if (st === 'closed') closedCount++;
    });

    return {
      total: allLoans.length,
      active: openCount + overdueCount + partialCount,
      open: openCount,
      overdue: overdueCount,
      partial: partialCount,
      closed: closedCount
    };
  }, [allLoans, getLoanStatus]);

  // Filtered loans list
  const filteredLoans = React.useMemo(() => {
    return allLoans.filter(loan => {
      // Scoping: Store Keeper sees assigned locations only
      if (isStoreKeeper && !myLocations.includes(loan.locationId)) return false;

      // Location filter
      if (locationFilter !== 'all' && loan.locationId !== locationFilter) return false;

      const st = getLoanStatus(loan);

      // Status filter
      if (statusFilter === 'active_overdue') {
        if (st === 'closed') return false;
      } else if (statusFilter === 'open' && st !== 'open') {
        return false;
      } else if (statusFilter === 'overdue' && st !== 'overdue') {
        return false;
      } else if (statusFilter === 'partially_returned' && st !== 'partially_returned') {
        return false;
      } else if (statusFilter === 'closed' && st !== 'closed') {
        return false;
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const refMatch = (loan.reference || loan.id).toLowerCase().includes(q);
        const nameMatch = (loan.holderName || '').toLowerCase().includes(q);
        const compMatch = (loan.companyName || '').toLowerCase().includes(q);
        const hostEmp = employees.find(e => e.id === loan.hostEmployeeId);
        const hostMatch = (hostEmp?.name || '').toLowerCase().includes(q) || (hostEmp?.employeeCode || '').toLowerCase().includes(q);

        return refMatch || nameMatch || compMatch || hostMatch;
      }

      return true;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [allLoans, isStoreKeeper, myLocations, locationFilter, statusFilter, search, getLoanStatus, employees]);

  // Excel / CSV Export (PPE-041)
  const handleExportCsv = () => {
    if (filteredLoans.length === 0) {
      addToast('No loan records to export.', 'error');
      return;
    }

    const headers = [
      'Loan Reference', 'Recipient Name', 'Company', 'Holder Type', 
      'Host Employee', 'Issuing Location', 'Issue Date', 'Expected Return Date', 
      'Status', 'Total Quantity', 'Lines Detail'
    ];

    const rows = filteredLoans.map(l => {
      const hostEmp = employees.find(e => e.id === l.hostEmployeeId);
      const loc = locations.find(loc => loc.id === l.locationId);
      const st = getLoanStatus(l);
      const linesDesc = (l.lines || []).map(li => {
        const item = ppeItems.find(p => p.id === li.ppeItemId);
        return `${item?.nameEn || li.ppeItemId} (Qty: ${li.quantity}, Ret: ${li.returnedQty || 0})`;
      }).join('; ');

      return [
        l.reference || l.id,
        l.holderName || '',
        l.companyName || '',
        l.holderType || 'Visitor',
        hostEmp ? `${hostEmp.name} (${hostEmp.employeeCode})` : '',
        loc?.nameEn || '',
        format(new Date(l.issueDate), 'yyyy-MM-dd'),
        l.expectedReturnDate ? format(new Date(l.expectedReturnDate), 'yyyy-MM-dd') : '',
        st.toUpperCase(),
        l.quantity,
        linesDesc
      ];
    });

    downloadCsv('ppe_open_loans_export', headers, rows);
    addToast('Loan list exported to CSV successfully.', 'success');
  };

  // Open Return Modal
  const openReturnModal = (loan: Issuance) => {
    const lines = loan.lines || [];
    const initialLinesState: ReturnLineFormState[] = lines.map(l => {
      const remaining = Math.max(0, l.quantity - (l.returnedQty || 0));
      return {
        lineId: l.id,
        selected: remaining > 0,
        returnQty: remaining,
        condition: 'good'
      };
    });

    setReturnLinesState(initialLinesState);
    setReceiverSignature('');
    setStoreKeeperSignature('');
    setReturnModalLoan(loan);
  };

  // Handle Return Submission
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalLoan) return;

    const toReturn = returnLinesState.filter(r => r.selected && r.returnQty > 0);
    if (toReturn.length === 0) {
      addToast('Please select at least one line with quantity to return.', 'error');
      return;
    }

    if (!receiverSignature || !storeKeeperSignature) {
      addToast('Both Store Keeper and recipient signatures are required for return custody (PPE-037).', 'error');
      return;
    }

    const res = returnLoan({
      loanId: returnModalLoan.id,
      returnedLines: toReturn.map(r => ({
        lineId: r.lineId,
        quantity: r.returnQty,
        condition: r.condition
      })),
      storeKeeperSignature,
      receiverSignature,
      returnedBy: currentUser.id
    });

    if (res.success) {
      addToast('Loan return processed successfully (inventory routed per Rule G6).', 'success');
      setReturnModalLoan(null);
      if (selectedLoan?.id === returnModalLoan.id) {
        setSelectedLoan(null);
      }
    } else {
      addToast(res.message || 'Error processing return.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Open Loans & Temporary Custody (PPE-041)" 
        subtitle="Track temporary equipment loaned to visitors, contractors, and temporary personnel with overdue monitoring and line returns"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
            <Button onClick={() => navigate('/issuances/new-loan')}>
              <Plus className="w-4 h-4 mr-2" /> Issue New Loan
            </Button>
          </div>
        } 
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${statusFilter === 'all' ? 'bg-accent/10 border-accent shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-body uppercase tracking-wider">Total Loans</div>
          <div className="text-xl font-bold text-ink mt-0.5">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('active_overdue')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${statusFilter === 'active_overdue' ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Active Custody</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{counts.active}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('overdue')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${statusFilter === 'overdue' ? 'bg-red-50 border-safety-red shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-safety-red uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </div>
          <div className="text-xl font-bold text-safety-red mt-0.5">{counts.overdue}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('partially_returned')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${statusFilter === 'partially_returned' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-safety-amber-signal uppercase tracking-wider">Partially Returned</div>
          <div className="text-xl font-bold text-safety-amber-signal mt-0.5">{counts.partial}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('closed')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${statusFilter === 'closed' ? 'bg-green-50 border-safety-green shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-safety-green uppercase tracking-wider">Closed / Returned</div>
          <div className="text-xl font-bold text-safety-green mt-0.5">{counts.closed}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar>
        <SearchInput 
          placeholder="Search by loan ref, recipient, company, or host..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        
        <Select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value as any)} 
          className="w-52"
        >
          <option value="active_overdue">Active & Overdue (Default)</option>
          <option value="all">All Statuses</option>
          <option value="open">Open (Within Return Window)</option>
          <option value="overdue">Overdue (&lt; 0 Days)</option>
          <option value="partially_returned">Partially Returned</option>
          <option value="closed">Closed / Fully Returned</option>
        </Select>

        <Select 
          value={locationFilter} 
          onChange={e => setLocationFilter(e.target.value)} 
          className="w-48"
        >
          <option value="all">All Issuing Locations</option>
          {locations
            .filter(l => myLocations.includes(l.id))
            .map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} ({l.code})</option>
            ))}
        </Select>
      </FilterBar>

      {/* Data Table */}
      <DataTable 
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        emptyState={
          <EmptyState 
            icon={<ShieldAlert />} 
            title="No loan records found" 
            description="No loans match the currently selected filters or status." 
          />
        }
        columns={[
          { key: 'ref', header: 'Loan Number', render: (loan) => (
            <div>
              <span 
                className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
                onClick={() => setSelectedLoan(loan)}
              >
                {loan.reference || loan.id}
              </span>
              <div className="text-[10px] text-body">{format(new Date(loan.issueDate), 'yyyy-MM-dd')}</div>
            </div>
          )},
          { key: 'recipient', header: 'Recipient & Company', render: (loan) => (
            <div>
              <div 
                className="font-semibold text-ink cursor-pointer hover:underline"
                onClick={() => setSelectedLoan(loan)}
              >
                {loan.holderName}
              </div>
              <div className="text-[11px] text-body">
                {loan.companyName || 'Individual'} &middot; <span className="text-accent font-medium">{loan.holderType || 'Visitor'}</span>
              </div>
            </div>
          )},
          { key: 'host', header: 'Host Employee', render: (loan) => {
            const host = employees.find(e => e.id === loan.hostEmployeeId);
            return (
              <div>
                <div className="font-medium text-ink">{host?.name || 'Unassigned'}</div>
                <div className="text-[10px] font-mono text-body">{host?.employeeCode}</div>
              </div>
            );
          }},
          { key: 'location', header: 'Issuing Store', render: (loan) => {
            const loc = locations.find(l => l.id === loan.locationId);
            return (
              <div>
                <div className="text-xs font-medium text-ink">{loc?.nameEn || 'Store'}</div>
                <div className="text-[10px] text-body font-mono">{loc?.code} ({loc?.stockCondition || 'Used'})</div>
              </div>
            );
          }},
          { key: 'returnDate', header: 'Expected Return', render: (loan) => {
            if (!loan.expectedReturnDate) return '-';
            const returnDate = new Date(loan.expectedReturnDate);
            const isOverdue = returnDate < new Date() && loan.status !== 'returned';
            const daysDiff = differenceInDays(returnDate, new Date());

            return (
              <div>
                <span className={`font-mono text-xs font-semibold ${isOverdue ? 'text-safety-red font-bold' : 'text-ink'}`}>
                  {format(returnDate, 'yyyy-MM-dd')}
                </span>
                {isOverdue && (
                  <span className="block text-[10px] font-bold text-safety-red uppercase">
                    {Math.abs(daysDiff)} days overdue!
                  </span>
                )}
              </div>
            );
          }},
          { key: 'lines', header: 'Items & Lines', render: (loan) => {
            const lines = loan.lines || [];
            if (lines.length === 0) {
              const item = ppeItems.find(p => p.id === loan.ppeItemId);
              return <span className="text-xs">{item?.nameEn || 'Equipment'} (Qty: {loan.quantity})</span>;
            }

            const openLines = lines.filter(l => (l.returnedQty || 0) < l.quantity && l.status !== 'returned');
            return (
              <div className="text-xs">
                <span className="font-semibold text-ink">{lines.length} line item(s)</span>
                <div className="text-[11px] text-body font-mono">
                  {openLines.length === 0 ? (
                    <span className="text-safety-green font-bold">All items returned</span>
                  ) : (
                    <span>{openLines.length} item(s) outstanding</span>
                  )}
                </div>
              </div>
            );
          }},
          { key: 'status', header: 'Status', render: (loan) => {
            const st = getLoanStatus(loan);
            if (st === 'overdue') {
              return <StatusBadge status="error" label="Overdue" />;
            }
            if (st === 'partially_returned') {
              return <StatusBadge status="warning" label="Partially Returned" />;
            }
            if (st === 'closed') {
              return <StatusBadge status="success" label="Closed" />;
            }
            return <StatusBadge status="info" label="Open" />;
          }},
          { key: 'actions', header: '', className: 'text-right w-36', render: (loan) => {
            const st = getLoanStatus(loan);
            const canReturn = st !== 'closed' && ['Admin', 'HSE Supervisor', 'Store Keeper'].includes(currentUser.role);

            return (
              <div className="flex justify-end gap-1.5">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setSelectedLoan(loan)}
                  title="View Loan Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                {canReturn && (
                  <Button 
                    size="sm"
                    onClick={() => openReturnModal(loan)}
                  >
                    <CornerDownLeft className="w-3 h-3 mr-1" /> Return
                  </Button>
                )}
              </div>
            );
          }}
        ]}
      />

      {/* LOAN DETAIL MODAL (PPE-041) */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border bg-canvas">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base">Loan Details: {selectedLoan.reference || selectedLoan.id}</h3>
                {getLoanStatus(selectedLoan) === 'overdue' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-safety-red border border-red-200">
                    Overdue
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-body hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Recipient & Host Info */}
              <div className="grid grid-cols-2 gap-4 bg-canvas/60 p-4 rounded-lg border border-border text-xs">
                <div>
                  <span className="text-body font-bold uppercase tracking-wider text-[10px] block">Recipient Details</span>
                  <div className="font-bold text-ink text-sm mt-0.5">{selectedLoan.holderName}</div>
                  <div className="text-body">{selectedLoan.companyName || 'No Company'} &middot; {selectedLoan.holderType || 'Visitor'}</div>
                  {selectedLoan.contactNumber && <div className="text-body font-mono mt-0.5">{selectedLoan.contactNumber}</div>}
                </div>

                <div>
                  <span className="text-body font-bold uppercase tracking-wider text-[10px] block">Host Employee (Directive)</span>
                  {(() => {
                    const host = employees.find(e => e.id === selectedLoan.hostEmployeeId);
                    return host ? (
                      <div>
                        <div className="font-semibold text-ink text-sm mt-0.5">{host.name}</div>
                        <div className="text-body font-mono">{host.employeeCode} &middot; {host.department}</div>
                      </div>
                    ) : <span className="text-body italic">Unassigned</span>;
                  })()}
                </div>

                <div>
                  <span className="text-body font-bold uppercase tracking-wider text-[10px] block">Issue & Return Dates</span>
                  <div className="mt-0.5">
                    <span className="text-body">Issued:</span> <strong className="text-ink">{format(new Date(selectedLoan.issueDate), 'yyyy-MM-dd')}</strong>
                  </div>
                  <div>
                    <span className="text-body">Expected Return:</span> <strong className="text-ink">{selectedLoan.expectedReturnDate ? format(new Date(selectedLoan.expectedReturnDate), 'yyyy-MM-dd') : '-'}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-body font-bold uppercase tracking-wider text-[10px] block">Location</span>
                  {(() => {
                    const loc = locations.find(l => l.id === selectedLoan.locationId);
                    return <div className="mt-0.5 font-semibold text-ink">{loc?.nameEn} ({loc?.code})</div>;
                  })()}
                </div>
              </div>

              {/* Loan Lines Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2">Loaned Equipment Lines</h4>
                <table className="w-full text-left text-xs border border-border rounded overflow-hidden">
                  <thead className="bg-canvas border-b border-border text-body font-bold">
                    <tr>
                      <th className="p-2.5">PPE Equipment</th>
                      <th className="p-2.5 text-center">Issued Qty</th>
                      <th className="p-2.5 text-center">Returned Qty</th>
                      <th className="p-2.5 text-center">Outstanding</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Return Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(selectedLoan.lines && selectedLoan.lines.length > 0) ? (
                      selectedLoan.lines.map(line => {
                        const item = ppeItems.find(p => p.id === line.ppeItemId);
                        const returned = line.returnedQty || 0;
                        const remaining = Math.max(0, line.quantity - returned);

                        return (
                          <tr key={line.id} className="hover:bg-canvas/40">
                            <td className="p-2.5">
                              <div className="font-semibold text-ink">{item?.nameEn || line.ppeItemId}</div>
                              <div className="text-[10px] text-body font-mono">{item?.itemCode}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold">{line.quantity}</td>
                            <td className="p-2.5 text-center text-safety-green font-bold">{returned}</td>
                            <td className="p-2.5 text-center font-bold">
                              {remaining > 0 ? (
                                <span className="text-safety-red">{remaining}</span>
                              ) : (
                                <span className="text-safety-green">0</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              {line.status === 'returned' || remaining === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-safety-green border border-green-200">
                                  Returned
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-accent border border-blue-200">
                                  Open
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              {line.condition ? (
                                <span className="capitalize font-medium text-body">{line.condition}</span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-body italic">
                          Single-item equipment loan (Total Qty: {selectedLoan.quantity})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Digital Signatures Display (G7) */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="p-3 bg-canvas/40 rounded border border-border">
                  <span className="text-[10px] font-bold text-body uppercase tracking-wider block mb-1.5">
                    Store Keeper Signature (PPE-036)
                  </span>
                  {selectedLoan.storeKeeperSignature ? (
                    <img src={selectedLoan.storeKeeperSignature} alt="Store Keeper" className="h-12 border border-border bg-white rounded p-1" />
                  ) : (
                    <span className="text-xs text-body italic">Signed on paper / Not captured</span>
                  )}
                </div>

                <div className="p-3 bg-canvas/40 rounded border border-border">
                  <span className="text-[10px] font-bold text-body uppercase tracking-wider block mb-1.5">
                    Receiver Signature (Recipient)
                  </span>
                  {selectedLoan.receiverSignature ? (
                    <img src={selectedLoan.receiverSignature} alt="Receiver" className="h-12 border border-border bg-white rounded p-1" />
                  ) : (
                    <span className="text-xs text-body italic">Signed on paper / Not captured</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-canvas flex justify-between items-center">
              <Button variant="secondary" onClick={() => setSelectedLoan(null)}>Close</Button>
              {getLoanStatus(selectedLoan) !== 'closed' && (
                <Button onClick={() => {
                  const loan = selectedLoan;
                  setSelectedLoan(null);
                  openReturnModal(loan);
                }}>
                  <CornerDownLeft className="w-4 h-4 mr-1.5" /> Return Outstanding Items (PPE-037)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RETURN LOAN MODAL (PPE-037) */}
      {returnModalLoan && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border bg-canvas">
              <div>
                <h3 className="font-bold text-ink text-base">Return Loaned PPE (PPE-037)</h3>
                <p className="text-xs text-body">Loan Ref: {returnModalLoan.reference || returnModalLoan.id} &middot; Recipient: {returnModalLoan.holderName}</p>
              </div>
              <button onClick={() => setReturnModalLoan(null)} className="text-body hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2">
                  Select Lines & Specify Return Condition (Rule G6)
                </h4>
                
                <div className="space-y-3">
                  {returnLinesState.map((lineState, idx) => {
                    const originalLine = returnModalLoan.lines?.find(l => l.id === lineState.lineId);
                    const item = originalLine ? ppeItems.find(p => p.id === originalLine.ppeItemId) : null;
                    const maxQty = originalLine ? Math.max(1, originalLine.quantity - (originalLine.returnedQty || 0)) : 1;

                    return (
                      <div key={lineState.lineId} className="p-3 bg-canvas/60 border border-border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-ink">
                            <input 
                              type="checkbox" 
                              checked={lineState.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setReturnLinesState(prev => prev.map(s => s.lineId === lineState.lineId ? { ...s, selected: checked } : s));
                              }}
                              className="rounded border-border text-accent focus:ring-accent"
                            />
                            <span>{item?.nameEn || 'Item'} ({item?.itemCode})</span>
                          </label>
                          <span className="text-[11px] text-body font-mono">Max Outstanding: {maxQty}</span>
                        </div>

                        {lineState.selected && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                            <div>
                              <label className="block text-[10px] font-bold text-body uppercase tracking-wider mb-1">Return Quantity</label>
                              <input 
                                type="number" 
                                min={1} 
                                max={maxQty} 
                                value={lineState.returnQty}
                                onChange={(e) => {
                                  const val = Math.min(maxQty, Math.max(1, parseInt(e.target.value, 10) || 1));
                                  setReturnLinesState(prev => prev.map(s => s.lineId === lineState.lineId ? { ...s, returnQty: val } : s));
                                }}
                                className="w-full text-xs bg-surface border border-border rounded px-2.5 py-1.5 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-body uppercase tracking-wider mb-1">Physical Condition (Rule G6)</label>
                              <select 
                                value={lineState.condition}
                                onChange={(e) => {
                                  const cond = e.target.value as any;
                                  setReturnLinesState(prev => prev.map(s => s.lineId === lineState.lineId ? { ...s, condition: cond } : s));
                                }}
                                className="w-full text-xs bg-surface border border-border rounded px-2.5 py-1.5 focus:outline-none"
                              >
                                <option value="good">Good (Reusable - Routes to Used Store)</option>
                                <option value="damaged">Damaged (Routes to Scrap Yard)</option>
                                <option value="worn_out">Worn Out (Routes to Scrap Yard)</option>
                                <option value="lost">Lost (Voucher Closed - No Stock Restored)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Signatures Pair (PPE-037 & Rule G7) */}
              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2">
                  Mandatory Return Custody Signatures (Rule G7)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Store Keeper */}
                  <div className="p-3 border border-border rounded-lg bg-canvas/30 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-ink block">Store Keeper Signature</span>
                      <p className="text-[10px] text-body mt-0.5">Confirm receipt and condition inspection</p>
                    </div>

                    <div className="mt-3">
                      {storeKeeperSignature ? (
                        <div className="space-y-1.5">
                          <img src={storeKeeperSignature} alt="SK Signature" className="h-10 border border-border rounded bg-white p-1" />
                          <button 
                            type="button" 
                            onClick={() => setActiveSigner('storeKeeper')} 
                            className="text-[10px] text-accent underline cursor-pointer"
                          >
                            Redraw Signature
                          </button>
                        </div>
                      ) : (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => setActiveSigner('storeKeeper')}
                        >
                          Capture Signature
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="p-3 border border-border rounded-lg bg-canvas/30 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-ink block">Recipient / Returnee Signature</span>
                      <p className="text-[10px] text-body mt-0.5">Recipient confirms return of custody</p>
                    </div>

                    <div className="mt-3">
                      {receiverSignature ? (
                        <div className="space-y-1.5">
                          <img src={receiverSignature} alt="Receiver Signature" className="h-10 border border-border rounded bg-white p-1" />
                          <button 
                            type="button" 
                            onClick={() => setActiveSigner('receiver')} 
                            className="text-[10px] text-accent underline cursor-pointer"
                          >
                            Redraw Signature
                          </button>
                        </div>
                      ) : (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => setActiveSigner('receiver')}
                        >
                          Capture Signature
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <Button type="button" variant="secondary" onClick={() => setReturnModalLoan(null)}>Cancel</Button>
                <Button type="submit">Complete Return & Route Stock (Rule G6)</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML5 Canvas Signature Pad Modal */}
      {activeSigner && (
        <SignatureModal 
          isOpen={true}
          onClose={() => setActiveSigner(null)}
          onSave={(dataUrl) => {
            if (activeSigner === 'storeKeeper') {
              setStoreKeeperSignature(dataUrl);
            } else {
              setReceiverSignature(dataUrl);
            }
            setActiveSigner(null);
          }}
          title={activeSigner === 'storeKeeper' ? "Store Keeper Signature" : "Recipient Returnee Signature"}
        />
      )}
    </div>
  );
}

