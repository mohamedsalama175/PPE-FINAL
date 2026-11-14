import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { exportEmployeeTimelinePdf } from '../lib/pdfService';
import { useToastStore } from '../store/toastStore';
import { format } from 'date-fns';
import { 
  Printer, ArrowLeft, Shield, CornerDownLeft, 
  Clock, CheckCircle2, AlertTriangle, FileSpreadsheet, UserX, UserCheck
} from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { employees, jobPositions, issuances, ppeItems, locations, currentUser, setEmployeeStatus, returnItem } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const employee = employees.find(e => e.id === id);

  if (!employee) {
    return (
      <div>
        <PageHeader title="Employee Not Found" onBack={() => navigate('/employees')} />
        <div className="p-8 text-center bg-surface border border-border rounded-lg">
          <p className="text-body mb-4">The requested employee could not be found.</p>
          <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
        </div>
      </div>
    );
  }

  const jobPosition = jobPositions.find(j => j.id === employee.jobPositionId);

  // All employee issuances
  const empIssuances = React.useMemo(() => {
    return issuances
      .filter(i => i.employeeId === employee.id)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issuances, employee.id]);

  const currentlyHeld = empIssuances.filter(i => i.status === 'issued');
  const pastHistory = empIssuances.filter(i => i.status !== 'issued');

  const handleExportPdf = () => {
    exportEmployeeTimelinePdf({
      employee,
      issuances: empIssuances,
      items: ppeItems
    });
    addToast('Opening printable PDF timeline view...', 'info');
  };

  const handleStatusChange = (status: 'Active' | 'Terminated' | 'Transferred' | 'Inactive') => {
    setEmployeeStatus(employee.id, status, currentUser.id);
    addToast(`Employee status updated to ${status}. Lifecycle rules updated (Rule G12).`, 'success');
  };

  const handleQuickReturn = (issuanceId: string) => {
    returnItem(issuanceId, 'good', true, currentUser.id);
    addToast('Item returned in good condition to Used storage.', 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title={`Employee: ${employee.name}`}
        subtitle="PPE Custody, Lifecycle Management, and Signature Audit Record"
        onBack={() => navigate('/employees')}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportPdf}>
              <Printer className="w-4 h-4 mr-2" /> Export Timeline PDF (PPE-043)
            </Button>
            <Button onClick={() => navigate(`/issuances/new?employeeId=${employee.id}`)}>
              Issue New PPE
            </Button>
          </div>
        }
      />

      {/* Employee Overview Card with Lifecycle Controls (G12) */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/15 rounded-full flex items-center justify-center text-accent text-xl font-bold">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink">{employee.name}</h2>
                <StatusBadge 
                  status={employee.status === 'Active' || (!employee.status && employee.active) ? 'success' : employee.status === 'Terminated' ? 'error' : 'warning'} 
                  label={employee.status || (employee.active ? 'Active' : 'Inactive')} 
                />
              </div>
              <div className="text-xs text-body mt-0.5 font-mono">
                {employee.employeeCode} &middot; {jobPosition ? (language === 'en' ? jobPosition.nameEn : jobPosition.nameAr) : employee.role}
              </div>
            </div>
          </div>

          {/* Lifecycle Status Switcher (Rule G12) */}
          {['Admin', 'HSE Supervisor'].includes(currentUser.role) && (
            <div className="flex items-center gap-2 bg-canvas p-2 rounded-md border border-border">
              <span className="text-xs font-semibold text-body">Lifecycle (G12):</span>
              <select
                value={employee.status || 'Active'}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="text-xs font-semibold bg-surface border border-border rounded px-2.5 py-1 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
                <option value="Transferred">Transferred</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
          <div>
            <div className="font-bold text-body uppercase tracking-wider text-[10px]">Department & Site</div>
            <div className="font-semibold text-ink mt-0.5">{employee.department || 'Operations'} / {employee.site || 'Main Campus'}</div>
          </div>
          <div>
            <div className="font-bold text-body uppercase tracking-wider text-[10px]">Gender (G4 Match)</div>
            <div className="font-semibold text-ink mt-0.5">{employee.gender || 'Not specified'}</div>
          </div>
          <div>
            <div className="font-bold text-body uppercase tracking-wider text-[10px]">Active PPE Holdings</div>
            <div className="font-semibold text-accent mt-0.5">{currentlyHeld.length} items currently in custody</div>
          </div>
          <div>
            <div className="font-bold text-body uppercase tracking-wider text-[10px]">Lifecycle Reminder Rule (G12)</div>
            <div className="font-semibold text-ink mt-0.5">
              {employee.status === 'Terminated' || employee.status === 'Transferred' ? (
                <span className="text-safety-red font-medium">Reminders Stopped & Omitted from Due List</span>
              ) : (
                <span className="text-safety-green font-medium">Active (Receives Lifespan Alerts)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Currently Issued PPE Section */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-canvas flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Currently Held PPE ({currentlyHeld.length})
          </h3>
          <span className="text-xs text-body">
            Held items remain on profile until returned, even if employee is terminated (Rule G12).
          </span>
        </div>

        <DataTable 
          data={currentlyHeld}
          keyExtractor={(item) => item.id}
          emptyState={
            <EmptyState 
              icon={<Shield />} 
              title="No active PPE held" 
              description="This employee currently has zero active equipment issued." 
            />
          }
          columns={[
            { key: 'reference', header: 'Reference', render: (i) => (
              <div>
                <span className="font-mono text-xs font-bold text-ink">{i.reference || i.id}</span>
                {i.isHistorical && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Imported
                  </span>
                )}
              </div>
            )},
            { key: 'item', header: 'PPE Equipment', render: (i) => {
              const item = ppeItems.find(p => p.id === i.ppeItemId);
              return (
                <div>
                  <div className="font-medium text-ink">{item ? (language === 'en' ? item.nameEn : item.nameAr) : (i.kitId ? 'Kit Equipment' : i.ppeItemId)}</div>
                  <div className="text-[11px] text-body">{item?.itemCode} &middot; Cat {item?.riskCategory}</div>
                </div>
              );
            }},
            { key: 'quantity', header: 'Qty', render: (i) => <span className="font-bold">{i.quantity}</span> },
            { key: 'issueDate', header: 'Issue Date', render: (i) => format(new Date(i.issueDate), 'yyyy-MM-dd') },
            { key: 'dueDate', header: 'Replacement Due Date', render: (i) => {
              const d = i.expectedReplacementDate || i.expectedReturnDate;
              if (!d) return '-';
              const isPast = new Date(d) < new Date();
              return (
                <span className={isPast ? 'text-safety-red font-bold' : 'font-medium'}>
                  {format(new Date(d), 'yyyy-MM-dd')}
                  {isPast && <span className="text-[10px] block font-normal">Overdue</span>}
                </span>
              );
            }},
            { key: 'signatures', header: 'Receiver Signature', render: (i) => (
              i.receiverSignature ? (
                <img src={i.receiverSignature} alt="Sign" className="h-8 max-w-[90px] border border-border rounded bg-white" />
              ) : (
                <span className="text-[11px] text-body italic">Signed on paper</span>
              )
            )},
            { key: 'actions', header: '', className: 'text-right', render: (i) => (
              <Button size="sm" variant="secondary" onClick={() => handleQuickReturn(i.id)}>
                <CornerDownLeft className="w-3.5 h-3.5 mr-1" /> Quick Return
              </Button>
            )}
          ]}
        />
      </div>

      {/* Complete Historical Timeline with Captured Signatures (PPE-043) */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-canvas flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Complete Issuance & Return History ({empIssuances.length} records)
          </h3>
          <Button size="sm" variant="ghost" onClick={handleExportPdf}>
            <Printer className="w-3.5 h-3.5 mr-1" /> Printable View
          </Button>
        </div>

        <DataTable 
          data={empIssuances}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Clock />} title="No history found" />}
          columns={[
            { key: 'reference', header: 'Reference', render: (i) => <span className="font-mono text-xs">{i.reference || i.id}</span> },
            { key: 'item', header: 'Equipment', render: (i) => {
              const item = ppeItems.find(p => p.id === i.ppeItemId);
              return item ? (language === 'en' ? item.nameEn : item.nameAr) : (i.kitId ? 'Kit' : i.ppeItemId);
            }},
            { key: 'qty', header: 'Qty', render: (i) => i.quantity },
            { key: 'date', header: 'Date', render: (i) => format(new Date(i.issueDate), 'yyyy-MM-dd') },
            { key: 'status', header: 'Status', render: (i) => (
              <StatusBadge 
                status={i.status === 'issued' ? 'info' : i.status === 'returned' ? 'success' : 'neutral'} 
                label={i.status} 
              />
            )},
            { key: 'signatures', header: 'Captured Signatures', render: (i) => (
              <div className="flex items-center gap-2">
                {i.receiverSignature ? (
                  <div className="text-[10px] text-center">
                    <img src={i.receiverSignature} alt="Receiver" className="h-6 max-w-[70px] border border-border rounded bg-white" />
                    <span className="text-body block">Receiver</span>
                  </div>
                ) : null}
                {i.storeKeeperSignature ? (
                  <div className="text-[10px] text-center">
                    <img src={i.storeKeeperSignature} alt="StoreKeeper" className="h-6 max-w-[70px] border border-border rounded bg-white" />
                    <span className="text-body block">Store Keeper</span>
                  </div>
                ) : null}
                {!i.receiverSignature && !i.storeKeeperSignature && (
                  <span className="text-[11px] text-body italic">Legacy record</span>
                )}
              </div>
            )}
          ]}
        />
      </div>
    </div>
  );
}

