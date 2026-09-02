import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ContainerCard } from '../components/ui/ContainerCard';
import { KpiCard } from '../components/ui/KpiCard';
import { useSwal } from '../lib/useSwal';
import { 
  FileSpreadsheet, Download, Upload, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, ShieldAlert, 
  Clock, Info, ShieldCheck, Check, RotateCcw
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ParsedImportRow {
  id: string;
  employeeCode: string;
  itemCode: string;
  variantKey: string;
  quantity: number;
  issueDate: string;
  locationCode?: string;
  isValid: boolean;
  error?: string;
  calculatedReplacementDate?: string;
  willBeStatus?: 'Overdue' | 'Upcoming' | 'Normal';
  employeeId?: string;
}

export default function HistoricalImport() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { showConfirm, showToast } = useSwal();

  const { 
    currentUser, 
    employees, 
    ppeItems, 
    locations, 
    settings, 
    importHistoricalIssuances 
  } = usePPEStore();

  const [parsedRows, setParsedRows] = React.useState<ParsedImportRow[]>([]);
  const [hasPreview, setHasPreview] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [importSummary, setImportSummary] = React.useState<{ importedCount: number; batchId: string } | null>(null);

  const isAdmin = currentUser.role === 'Admin';

  const handleDownloadTemplate = () => {
    showToast('Historical_Issuances_Import_Template.xlsx downloaded', 'info');
  };

  const handleLoadDemoData = () => {
    const today = new Date();

    const rawDemo = [
      {
        id: '1',
        employeeCode: employees[0]?.employeeCode || 'EMP-001',
        itemCode: ppeItems[0]?.itemCode || 'HLM-001',
        variantKey: 'Yellow',
        quantity: 1,
        issueDate: '2025-01-15' // ~1.5 years ago -> Overdue
      },
      {
        id: '2',
        employeeCode: employees[1]?.employeeCode || 'EMP-002',
        itemCode: ppeItems[1]?.itemCode || 'GLV-001',
        variantKey: 'Size L',
        quantity: 2,
        issueDate: '2026-08-01' // ~3 months ago -> Upcoming
      },
      {
        id: '3',
        employeeCode: employees[2]?.employeeCode || 'EMP-003',
        itemCode: ppeItems[2]?.itemCode || 'FTW-001',
        variantKey: '42 / Male',
        quantity: 1,
        issueDate: '2026-09-15'
      },
      {
        id: '4',
        employeeCode: 'EMP-999-NONEXISTENT', // Invalid employee
        itemCode: ppeItems[0]?.itemCode || 'HLM-001',
        variantKey: 'White',
        quantity: 1,
        issueDate: '2026-05-10'
      },
      {
        id: '5',
        employeeCode: employees[0]?.employeeCode || 'EMP-001',
        itemCode: 'INVALID-ITEM-CODE', // Invalid item
        variantKey: 'Standard',
        quantity: 1,
        issueDate: '2026-03-20'
      },
      {
        id: '6',
        employeeCode: employees[0]?.employeeCode || 'EMP-001',
        itemCode: ppeItems[0]?.itemCode || 'HLM-001',
        variantKey: 'Yellow',
        quantity: 1,
        issueDate: '2027-01-01' // Future date error
      }
    ];

    // Validate rows
    const processed: ParsedImportRow[] = rawDemo.map(row => {
      const emp = employees.find(e => e.employeeCode.toLowerCase() === row.employeeCode.toLowerCase());
      const ppe = ppeItems.find(p => p.itemCode.toLowerCase() === row.itemCode.toLowerCase());
      const isFuture = new Date(row.issueDate) > today;

      let isValid = true;
      let error = '';

      if (!emp) {
        isValid = false;
        error = `Employee ID "${row.employeeCode}" not found in Employee Master.`;
 } else if (!ppe) {
 isValid = false;
 error = `Item Code "${row.itemCode}" not found in PPE Catalog.`;
 } else if (isFuture) {
 isValid = false;
 error = `Issue date (${row.issueDate}) cannot be in the future.`;
      } else if (row.quantity <= 0) {
        isValid = false;
        error = 'Quantity must be greater than zero.';
      }

      let calculatedReplacementDate: string | undefined;
      let willBeStatus: 'Overdue' | 'Upcoming' | 'Normal' | undefined;

      if (isValid && ppe) {
        const issueD = new Date(row.issueDate);
        let replD = new Date(issueD);
        if (ppe.lifespanUnit === 'Days') replD.setDate(replD.getDate() + ppe.lifespanValue);
        else if (ppe.lifespanUnit === 'Months') replD.setMonth(replD.getMonth() + ppe.lifespanValue);
        else if (ppe.lifespanUnit === 'Years') replD.setFullYear(replD.getFullYear() + ppe.lifespanValue);

        calculatedReplacementDate = replD.toISOString().split('T')[0];
        const daysDiff = differenceInDays(replD, today);

        if (daysDiff < 0) {
          willBeStatus = 'Overdue';
        } else if (daysDiff <= (settings.reminderLeadTimePerSite[emp?.site || 'Cairo Site'] || 14)) {
          willBeStatus = 'Upcoming';
        } else {
          willBeStatus = 'Normal';
        }
      }

      return {
        ...row,
        isValid,
        error: error || undefined,
        employeeId: emp?.id,
        calculatedReplacementDate,
        willBeStatus
      };
    });

    setParsedRows(processed);
    setHasPreview(true);
    showToast('Simulation loaded: 6 rows parsed (3 valid, 3 flagged errors).', 'info');
  };

  const validRows = React.useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const errorRows = React.useMemo(() => parsedRows.filter(r => !r.isValid), [parsedRows]);
  const upcomingCount = React.useMemo(() => validRows.filter(r => r.willBeStatus === 'Upcoming').length, [validRows]);
  const overdueCount = React.useMemo(() => validRows.filter(r => r.willBeStatus === 'Overdue').length, [validRows]);

  const handleDownloadErrorReport = () => {
    showToast('Historical_Import_Errors.xlsx downloaded', 'info');
  };

  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      showToast('No valid rows available to import.', 'error');
      return;
    }

    const confirmed = await showConfirm(
      'Confirm Historical Import',
      `Are you sure you want to import ${validRows.length} valid historical issuances?`,
      'Import Records',
      false
    );
    if (!confirmed) return;

    setSubmitting(true);
    const rowsToImport = validRows.map(r => ({
      employeeId: r.employeeId!,
      itemCode: r.itemCode,
      variantKey: r.variantKey,
      quantity: r.quantity,
      issueDate: r.issueDate
    }));

    const result = importHistoricalIssuances(rowsToImport);
    setSubmitting(false);
    setImportSummary(result);
    showToast(`Successfully imported ${result.importedCount} historical issuances.`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Historical Issuances from Excel (NEW-09)"
        subtitle="Migrate pre-existing employee PPE holdings without stock deduction, tagged 'Imported' with automated replacement scheduling"
 />

 {!isAdmin && (
 <div className="p-4 bg-amber-50  border border-amber-200  rounded-md flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-amber-600  flex-shrink-0 mt-0.5" />
 <div className="text-xs text-amber-800 ">
 <span className="font-bold">Administrative Permission Notice:</span> You are viewing the import workspace. In production, this batch tool is restricted to system administrators.
 </div>
 </div>
 )}

 {importSummary ? (
 <ContainerCard className="p-8 text-center space-y-4">
 <CheckCircle2 className="w-12 h-12 text-emerald-600  mx-auto" />
 <h3 className="text-base font-bold text-slate-900 ">Historical Import Completed</h3>
 <p className="text-xs text-slate-600  max-w-md mx-auto">
 Successfully imported <span className="font-bold text-emerald-700 ">{importSummary.importedCount} historical records</span> under Batch ID{' '}
            <span className="font-mono text-slate-800 font-semibold">{importSummary.batchId}</span>.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => {
              setImportSummary(null);
              setHasPreview(false);
              setParsedRows([]);
            }}>
              Import Another File
            </Button>
            <Button variant="primary" onClick={() => navigate('/issuances/replacements-due')}>
              View Replacements Due
            </Button>
          </div>
        </ContainerCard>
      ) : (
        <div className="space-y-6">
          {/* Action Card: Upload & Demo Simulation */}
          <ContainerCard className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 " />
                  Excel File Upload & Verification Step
                </h3>
                <p className="text-xs text-slate-500 ">
                  Required columns: Employee ID, Item Code, Variant, Quantity, Issue Date (YYYY-MM-DD).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 me-1.5" /> Template (.xlsx)
                </Button>
                <Button variant="primary" size="sm" onClick={handleLoadDemoData}>
                  <Upload className="w-4 h-4 me-1.5" /> Load Demo Excel Simulation
                </Button>
              </div>
            </div>

            {/* Invariants Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500 " /> Strict Historical Migration Invariants (NEW-09)
              </h4>
              <ul className="list-disc ps-4 space-y-1 text-[11px]">
                <li>
                  <span className="font-semibold text-slate-800 ">Zero Stock Deduction:</span> Importing historical issuances does NOT reduce warehouse stock (stock must be entered via Opening Balance NEW-01).
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Signature Exemption:</span> Records are tagged with an <span className="font-mono text-slate-700 bg-white px-1 border border-slate-200 rounded">Imported</span> badge and require no signatures.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">Automatic Replacement Calculations:</span> Expected Replacement Date is calculated as <span className="font-mono">Issue Date + Current Lifespan</span>.
                </li>
                <li>
                  <span className="font-semibold text-slate-800 ">No Spam Reminders:</span> Historical records that are already overdue appear in Replacements Due immediately, but send NO reminder emails.
                </li>
              </ul>
            </div>
          </ContainerCard>

          {/* Validation & Preview Step */}
          {hasPreview && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard
                  title="Valid Records"
                  value={validRows.length}
                  color="success"
                  icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 " />}
                />
                <KpiCard
                  title="Error Records"
                  value={errorRows.length}
                  color="danger"
                  icon={<XCircle className="w-5 h-5 text-rose-600 " />}
                />
                <KpiCard
                  title="Will Be Upcoming"
                  value={upcomingCount}
                  color="warning"
                  icon={<Clock className="w-5 h-5 text-amber-600 " />}
                />
                <KpiCard
                  title="Will Be Overdue"
                  value={overdueCount}
                  color="danger"
                  icon={<AlertTriangle className="w-5 h-5 text-rose-600 " />}
                />
              </div>

              {/* Data Table */}
              <ContainerCard noPadding className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Parsed Import Preview ({parsedRows.length} total rows)
                  </h4>
                  {errorRows.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={handleDownloadErrorReport}>
                      <Download className="w-3.5 h-3.5 me-1 text-red-600 " /> Download Error Report ({errorRows.length} errors)
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 ">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Item Code</th>
                        <th className="p-3">Variant</th>
                        <th className="p-3 w-16 text-center">Qty</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Calculated Replacement</th>
                        <th className="p-3">Validation Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 ">
                      {parsedRows.map(row => (
                        <tr key={row.id} className={row.isValid ? 'hover:bg-slate-50 ' : 'bg-red-50/40 '}>
                          <td className="p-3">
                            {row.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 " />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 " />
                            )}
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-800 ">{row.employeeCode}</td>
                          <td className="p-3 font-mono font-bold text-slate-900 ">{row.itemCode}</td>
                          <td className="p-3 text-slate-600 ">{row.variantKey}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800 ">{row.quantity}</td>
                          <td className="p-3 text-slate-700 ">{row.issueDate}</td>
                          <td className="p-3">
                            {row.calculatedReplacementDate ? (
                              <div>
                                <span className="font-mono font-medium text-slate-800 ">{row.calculatedReplacementDate}</span>
                                {row.willBeStatus === 'Overdue' && (
                                  <span className="ms-1.5 px-1 py-0.2 text-[9px] font-bold rounded bg-red-100 text-red-700 ">
                                    Overdue
                                  </span>
                                )}
                                {row.willBeStatus === 'Upcoming' && (
                                  <span className="ms-1.5 px-1 py-0.2 text-[9px] font-bold rounded bg-amber-100 text-amber-800 ">
                                    Upcoming
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 ">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {row.isValid ? (
                              <span className="text-emerald-700 font-medium">Valid row</span>
                            ) : (
                              <span className="text-red-700 font-semibold">{row.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 ">
                    {validRows.length} valid row(s) ready to import • {errorRows.length} error row(s) will be skipped
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setHasPreview(false)}>
                      Clear Preview
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleExecuteImport}
                      disabled={submitting || validRows.length === 0}
                    >
                      <Check className="w-4 h-4 me-1.5" /> Confirm & Import {validRows.length} Valid Records
                    </Button>
                  </div>
                </div>
              </ContainerCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
