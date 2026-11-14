import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection } from '../components/ui/FormSection';
import { Button } from '../components/ui/Button';
import { downloadCsv, parseCsv } from '../lib/excelService';
import { useToastStore } from '../store/toastStore';
import { Upload, Download, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ParsedHistoricalRow {
  employeeCode: string;
  itemCode: string;
  locationCode: string;
  quantity: number;
  issueDate: string;
  expectedReplacementDate?: string;
  isValid: boolean;
  errors: string[];
  employeeId?: string;
  ppeItemId?: string;
  locationId?: string;
}

// Flexible date parser supporting YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, and ISO formats
function parseFlexibleDate(dateStr: string): { valid: boolean; isoDate?: string; error?: string } {
  if (!dateStr || !dateStr.trim()) return { valid: false, error: 'Date is missing' };
  const clean = dateStr.trim();

  // Try direct date parsing
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return { valid: true, isoDate: d.toISOString() };
  }

  // Try manual parts split
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const parsed = new Date(Date.UTC(y, m, day));
      if (!isNaN(parsed.getTime())) return { valid: true, isoDate: parsed.toISOString() };
    } else if (parts[2].length === 4) {
      const y = parseInt(parts[2], 10);
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      // Try MM/DD/YYYY
      if (p0 <= 12) {
        const parsed = new Date(Date.UTC(y, p0 - 1, p1));
        if (!isNaN(parsed.getTime())) return { valid: true, isoDate: parsed.toISOString() };
      }
      // Try DD/MM/YYYY
      if (p1 <= 12) {
        const parsed = new Date(Date.UTC(y, p1 - 1, p0));
        if (!isNaN(parsed.getTime())) return { valid: true, isoDate: parsed.toISOString() };
      }
    }
  }

  return { valid: false, error: `Invalid date format: "${clean}"` };
}

export default function HistoricalImport() {
  const navigate = useNavigate();
  const { employees, ppeItems, locations, currentUser, importHistoricalIssuances } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [csvText, setCsvText] = React.useState('');
  const [parsedRows, setParsedRows] = React.useState<ParsedHistoricalRow[]>([]);
  const [hasImported, setHasImported] = React.useState(false);

  // Template download
  const handleDownloadTemplate = () => {
    const headers = ['Employee Code', 'Item Code', 'Location Code', 'Quantity', 'Issue Date (YYYY-MM-DD)', 'Replacement Due Date (YYYY-MM-DD)'];
    const sampleRows = [
      ['EMP-004', 'HELM-YEL', 'HQ-WH-01', 1, '2023-05-15', '2026-05-15'],
      ['EMP-005', 'BOOT-S3-41', 'HQ-WH-01', 1, '2024-01-10', '2025-01-10'],
      ['EMP-006', 'VEST-YEL', 'HQ-WH-01', 2, '2025-02-01', '2025-08-01']
    ];
    downloadCsv('ppe_historical_import_template', headers, sampleRows);
    addToast('Template CSV downloaded.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      processCsvContent(content);
    };
    reader.readAsText(file);
  };

  const processCsvContent = (content: string) => {
    const { headers, rows } = parseCsv(content);
    if (rows.length === 0) {
      addToast('No data rows found in the CSV.', 'error');
      return;
    }

    const validated: ParsedHistoricalRow[] = rows.map((r) => {
      const empCode = r['Employee Code'] || r['employeeCode'] || Object.values(r)[0] || '';
      const itCode = r['Item Code'] || r['itemCode'] || Object.values(r)[1] || '';
      const locCode = r['Location Code'] || r['locationCode'] || Object.values(r)[2] || '';
      const qtyStr = r['Quantity'] || r['quantity'] || Object.values(r)[3] || '1';
      const issDate = r['Issue Date (YYYY-MM-DD)'] || r['issueDate'] || Object.values(r)[4] || '';
      const dueDate = r['Replacement Due Date (YYYY-MM-DD)'] || r['expectedReplacementDate'] || Object.values(r)[5] || '';

      const errors: string[] = [];
      const emp = employees.find(e => e.employeeCode.toUpperCase() === empCode.trim().toUpperCase());
      if (!emp) errors.push(`Unknown Employee Code: ${empCode}`);

      const item = ppeItems.find(p => p.itemCode.toUpperCase() === itCode.trim().toUpperCase());
      if (!item) errors.push(`Unknown Item Code: ${itCode}`);

      const loc = locations.find(l => l.code.toUpperCase() === locCode.trim().toUpperCase());
      if (!loc) errors.push(`Unknown Location Code: ${locCode}`);

      const qty = parseInt(qtyStr, 10);
      if (isNaN(qty) || qty <= 0) errors.push(`Invalid quantity: ${qtyStr}`);

      // Validate dates
      const parsedIssueDate = parseFlexibleDate(issDate);
      if (!parsedIssueDate.valid) {
        errors.push(`Issue Date error: ${parsedIssueDate.error || 'Invalid date'}`);
      }

      let parsedDueDateIso: string | undefined = undefined;
      if (dueDate && dueDate.trim()) {
        const parsedDueDate = parseFlexibleDate(dueDate);
        if (!parsedDueDate.valid) {
          errors.push(`Due Date error: ${parsedDueDate.error || 'Invalid date'}`);
        } else {
          parsedDueDateIso = parsedDueDate.isoDate;
        }
      }

      return {
        employeeCode: empCode,
        itemCode: itCode,
        locationCode: locCode,
        quantity: isNaN(qty) ? 1 : qty,
        issueDate: parsedIssueDate.isoDate || issDate,
        expectedReplacementDate: parsedDueDateIso,
        isValid: errors.length === 0,
        errors,
        employeeId: emp?.id,
        ppeItemId: item?.id,
        locationId: loc?.id
      };
    });

    setParsedRows(validated);
    setHasImported(false);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      addToast('No valid rows available to import.', 'error');
      return;
    }

    const records = validRows.map(r => ({
      employeeId: r.employeeId,
      ppeItemId: r.ppeItemId,
      locationId: r.locationId,
      quantity: r.quantity,
      issueDate: r.issueDate,
      expectedReplacementDate: r.expectedReplacementDate,
      reference: `HIST-${Date.now().toString().slice(-6)}`
    }));

    const res = importHistoricalIssuances(records, currentUser.id);
    setHasImported(true);
    addToast(`Successfully imported ${res.count} historical issuance records with zero stock deduction (PPE-044).`, 'success');
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <PageHeader 
        title="Historical PPE Issuance Import (PPE-044)" 
        subtitle="Import legacy employee equipment custody records with zero inventory stock deduction"
        actions={
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" /> Download CSV Template
          </Button>
        }
      />

      {/* Instructions Card */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-body mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-accent" />
          Import Protocol Guidelines (Rule G1 & PPE-044)
        </h3>
        <ul className="text-xs text-body space-y-1.5 list-disc pl-5">
          <li>Imported equipment is tagged with an <strong className="text-ink">Imported</strong> badge across employee timelines and audit views.</li>
          <li><strong className="text-safety-red font-semibold">Zero Stock Deduction:</strong> Historical issuances will NOT alter current inventory balances or batches.</li>
          <li>Codes must match existing active records: Employee Code (e.g. EMP-004), Item Code (e.g. HELM-YEL), Location Code (e.g. HQ-WH-01).</li>
        </ul>

        {/* File upload input */}
        <div className="mt-5 flex items-center gap-4">
          <label className="inline-flex items-center justify-center px-4 py-2 border border-border rounded text-sm font-semibold bg-canvas hover:bg-surface cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 mr-2 text-accent" /> Select CSV File
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <span className="text-xs text-body">or paste CSV content below</span>
        </div>
      </div>

      {/* CSV Content Paste Area */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-body mb-2">Raw CSV Text Content</label>
        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            if (e.target.value.trim().length > 10) {
              processCsvContent(e.target.value);
            }
          }}
          placeholder="Paste CSV rows here..."
          className="w-full text-xs font-mono p-3 rounded border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Validation & Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-canvas flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-body">Parsed Records Preview ({parsedRows.length})</span>
              <span className="text-xs font-semibold text-safety-green bg-green-50 px-2 py-0.5 rounded border border-green-200">
                {validCount} Ready
              </span>
              {invalidCount > 0 && (
                <span className="text-xs font-semibold text-safety-red bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {invalidCount} Errors
                </span>
              )}
            </div>

            {!hasImported ? (
              <Button onClick={handleExecuteImport} disabled={validCount === 0}>
                Execute Import ({validCount} Records)
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/issuances')}>
                View in Issuances <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-body uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Employee</th>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5">Issue Date</th>
                  <th className="p-2.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? 'hover:bg-canvas/50' : 'bg-red-50/50'}>
                    <td className="p-2.5">
                      {row.isValid ? (
                        <span className="text-safety-green flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <div className="text-safety-red font-medium">
                          <span className="flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Invalid
                          </span>
                          <span className="text-[10px] block mt-0.5">{row.errors.join('; ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-mono font-semibold">{row.employeeCode}</td>
                    <td className="p-2.5 font-mono font-semibold">{row.itemCode}</td>
                    <td className="p-2.5 font-mono">{row.locationCode}</td>
                    <td className="p-2.5 text-center font-bold">{row.quantity}</td>
                    <td className="p-2.5">{row.issueDate}</td>
                    <td className="p-2.5">{row.expectedReplacementDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

