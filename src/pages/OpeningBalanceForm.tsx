import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateId } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Trash2, Plus, Info, Upload, Download, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { OpeningBalance, OpeningBalanceLine } from '../types';
import { downloadCsv, parseCsv } from '../lib/excelService';
import { useToastStore } from '../store/toastStore';

export default function OpeningBalanceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    currentUser, 
    locations, 
    ppeItems,
    openingBalances, 
    saveOpeningBalance, 
    approveOpeningBalance, 
    rejectOpeningBalance,
    closeOpeningBalance,
    stockBalances,
    batches
  } = useStore();

  const addToast = useToastStore(s => s.addToast);
  const isNew = !id;
  const existingDoc = openingBalances.find(ob => ob.id === id);

  const [formData, setFormData] = useState<Partial<OpeningBalance>>({
    reference: `ADJ-OB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
    locationId: '',
    referenceDate: new Date().toISOString().split('T')[0],
    notes: '',
    lines: [],
    status: 'Draft'
  });

  const [lines, setLines] = useState<Partial<OpeningBalanceLine>[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<{ row: number; error: string; line: any }[]>([]);

  useEffect(() => {
    if (existingDoc) {
      setFormData(existingDoc);
      setLines(existingDoc.lines);
    }
  }, [existingDoc]);

  // Derived state
  const isReadOnly = formData.status === 'Approved' || formData.status === 'Pending Approval';
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const isManager = currentUser.role === 'HSE Supervisor' || currentUser.role === 'Admin';

  // Filter locations: Active, non-scrap, assigned if Store Keeper
  const validLocations = useMemo(() => {
    return locations.filter(l => {
      if (!l.active || l.deletedAt) return false;
      if (l.stockCondition === 'Scrap' || l.locationType === 'Scrap') return false; // Rule G6 & PPE-024
      if (isStoreKeeper && !l.assignedStoreKeeperIds.includes(currentUser.id)) return false;
      return true;
    });
  }, [locations, isStoreKeeper, currentUser.id]);

  const selectedLocation = useMemo(() => {
    return locations.find(l => l.id === formData.locationId);
  }, [locations, formData.locationId]);

  // PPE-024 Business Rule: Location already closed
  const isLocationClosed = Boolean(selectedLocation?.openingBalanceClosed);

  // Validate location constraint: already approved OB
  const locationHasApprovedBalance = useMemo(() => {
    if (!formData.locationId || existingDoc) return false;
    return openingBalances.some(ob => ob.locationId === formData.locationId && ob.status === 'Approved');
  }, [formData.locationId, existingDoc, openingBalances]);

  // Capacity calculation
  const totalQuantity = useMemo(() => {
    return lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  }, [lines]);

  const currentOnHand = useMemo(() => {
    if (!formData.locationId) return 0;
    return stockBalances
      .filter(b => b.locationId === formData.locationId)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);
  }, [stockBalances, formData.locationId]);

  const projectedOnHand = currentOnHand + totalQuantity;
  const locationCapacity = selectedLocation?.capacityUnits || 0;
  const isOverCapacity = locationCapacity > 0 && projectedOnHand > locationCapacity;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.referenceDate) newErrors.referenceDate = 'Reference date is required';
    if (isLocationClosed) newErrors.locationId = 'Opening balance is closed for this location. Use a stock adjustment.';
    if (locationHasApprovedBalance) newErrors.locationId = 'An approved opening balance already exists for this location.';
    if (lines.length === 0) newErrors.lines = 'At least one line item is required';

    const seenBatches = new Set<string>();
    lines.forEach((line, idx) => {
      if (!line.ppeItemId) newErrors[`line-${idx}-ppe`] = 'Item required';
      if (!line.batchNumber) newErrors[`line-${idx}-batch`] = 'Batch required';
      if (!line.quantity || line.quantity <= 0) newErrors[`line-${idx}-qty`] = 'Quantity must be > 0';

      const key = `${line.ppeItemId}-${line.variantKey || ''}-${line.batchNumber}`;
      if (seenBatches.has(key)) {
        newErrors[`line-${idx}-batch`] = 'Duplicate batch for same item and variant on this document';
      }
      if (line.ppeItemId && line.batchNumber) {
        seenBatches.add(key);
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    if (!formData.locationId || !formData.referenceDate) {
      addToast('Location and Reference Date are required to save draft.', 'error');
      return;
    }
    if (isLocationClosed) {
      addToast('Opening balance is closed for this location. Use a stock adjustment.', 'error');
      return;
    }

    const doc: OpeningBalance = {
      id: isNew ? generateId() : formData.id!,
      reference: formData.reference || `ADJ-OB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      locationId: formData.locationId,
      referenceDate: formData.referenceDate,
      notes: formData.notes,
      status: 'Draft',
      preparedBy: formData.preparedBy || currentUser.id,
      lines: lines as OpeningBalanceLine[],
      createdAt: formData.createdAt || new Date().toISOString()
    };
    saveOpeningBalance(doc);
    addToast('Opening balance saved as Draft.', 'success');
    navigate('/stock/opening-balances');
  };

  const handleSubmitApproval = () => {
    if (!validateForm()) return;

    const doc: OpeningBalance = {
      id: isNew ? generateId() : formData.id!,
      reference: formData.reference || `ADJ-OB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      locationId: formData.locationId!,
      referenceDate: formData.referenceDate!,
      notes: formData.notes,
      status: 'Pending Approval',
      preparedBy: formData.preparedBy || currentUser.id,
      lines: lines as OpeningBalanceLine[],
      createdAt: formData.createdAt || new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };
    saveOpeningBalance(doc);
    addToast('Opening balance submitted for manager approval.', 'success');
    navigate('/stock/opening-balances');
  };

  const handleApprove = () => {
    if (formData.id) {
      const res = approveOpeningBalance(formData.id, currentUser.id);
      if (res && !res.success) {
        addToast(res.message || 'Error approving opening balance.', 'error');
        return;
      }
      addToast('Opening balance approved. Batches and stock successfully posted (PPE-024).', 'success');
      navigate('/stock/opening-balances');
    }
  };

  const handleReject = () => {
    if (rejectReason.length < 20) {
      addToast('Rejection reason must be at least 20 characters.', 'error');
      return;
    }
    if (formData.id) {
      rejectOpeningBalance(formData.id, rejectReason);
      setShowRejectModal(false);
      addToast('Opening balance rejected.', 'info');
      navigate('/stock/opening-balances');
    }
  };

  const handleCloseLocationOpeningBalance = () => {
    if (!formData.locationId) return;
    if (window.confirm('Close opening balance for this location? Once closed, further opening balances cannot be posted (PPE-024).')) {
      closeOpeningBalance(formData.locationId, currentUser.id);
      addToast('Opening balance closed for this location.', 'success');
    }
  };

  const addLine = () => {
    setLines([...lines, { 
      id: generateId(), 
      ppeItemId: '', 
      variantKey: '', 
      batchNumber: `BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, 
      quantity: 1, 
      costPerUnit: 0, 
      expiryDate: '' 
    }]);
  };

  const updateLine = (index: number, field: keyof OpeningBalanceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // PPE-024: Excel Template Download
  const handleDownloadTemplate = () => {
    const headers = ['Item Code', 'Variant', 'Batch Number', 'Expiry Date (YYYY-MM-DD)', 'Quantity', 'Cost Per Unit'];
    const rows = [
      ['HLM-001', 'Size L / Yellow', 'BATCH-2026-0001', '2028-12-31', 50, 120],
      ['GLV-001', 'Size M', 'BATCH-2026-0002', '2027-06-30', 100, 35],
      ['BOT-001', '42', 'BATCH-2026-0003', '2029-01-15', 30, 250]
    ];
    downloadCsv('ppe_opening_balance_template', headers, rows);
    addToast('Opening balance template CSV downloaded.', 'success');
  };

  // PPE-024: Excel Upload with Preview and Error Reporting
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { rows } = parseCsv(content);
      if (rows.length === 0) {
        addToast('No rows found in uploaded file.', 'error');
        return;
      }

      const validLines: Partial<OpeningBalanceLine>[] = [];
      const errs: { row: number; error: string; line: any }[] = [];

      rows.forEach((r, idx) => {
        const itemCode = r['Item Code'] || Object.values(r)[0] || '';
        const variant = r['Variant'] || Object.values(r)[1] || '';
        const batchNum = r['Batch Number'] || Object.values(r)[2] || '';
        const expDate = r['Expiry Date (YYYY-MM-DD)'] || Object.values(r)[3] || '';
        const qtyStr = r['Quantity'] || Object.values(r)[4] || '';
        const costStr = r['Cost Per Unit'] || Object.values(r)[5] || '0';

        const item = ppeItems.find(p => p.itemCode.toUpperCase() === itemCode.trim().toUpperCase());
        if (!item) {
          errs.push({ row: idx + 2, error: `Item code not found: ${itemCode}`, line: r });
          return;
        }

        // Check if item is linked to the location
        if (formData.locationId && !item.locationIds.includes(formData.locationId)) {
          errs.push({ row: idx + 2, error: `Item ${itemCode} is not linked to this location`, line: r });
          return;
        }

        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) {
          errs.push({ row: idx + 2, error: `Quantity must be > 0: ${qtyStr}`, line: r });
          return;
        }

        if (!batchNum) {
          errs.push({ row: idx + 2, error: 'Batch number is required', line: r });
          return;
        }

        validLines.push({
          id: generateId(),
          ppeItemId: item.id,
          variantKey: variant.trim() || undefined,
          batchNumber: batchNum.trim(),
          expiryDate: expDate.trim() || undefined,
          quantity: qty,
          costPerUnit: parseFloat(costStr) || 0
        });
      });

      setLines(prev => [...prev, ...validLines]);
      setImportErrors(errs);

      if (errs.length > 0) {
        addToast(`Imported ${validLines.length} valid line(s). ${errs.length} row(s) had errors.`, 'info');
      } else {
        addToast(`Successfully imported ${validLines.length} lines from file.`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadErrorReport = () => {
    if (importErrors.length === 0) return;
    const headers = ['Row', 'Error', 'Row Data'];
    const rows = importErrors.map(e => [e.row, e.error, JSON.stringify(e.line)]);
    downloadCsv('ppe_opening_balance_errors', headers, rows);
  };

  let statusVariant: any = 'neutral';
  if (formData.status === 'Approved') statusVariant = 'success';
  if (formData.status === 'Pending Approval') statusVariant = 'warning';
  if (formData.status === 'Rejected') statusVariant = 'error';

  return (
    <div className="space-y-6 pb-20 max-w-5xl">
      <PageHeader 
        title={isNew ? 'Post Opening Balance for Location (PPE-024)' : `Opening Balance: ${formData.reference || formData.id}`}
        subtitle="Initialize physical inventory count per warehouse before transactions commence"
        onBack={() => navigate('/stock/opening-balances')}
        actions={
          <div className="flex space-x-3 items-center">
            {formData.locationId && !isLocationClosed && (
              <Button variant="secondary" size="sm" onClick={handleCloseLocationOpeningBalance}>
                <Lock className="w-3.5 h-3.5 mr-1" /> Close Opening Balance
              </Button>
            )}

            {(formData.status === 'Draft' || formData.status === 'Rejected' || isNew) && (
              <>
                <Button variant="secondary" onClick={handleSaveDraft} disabled={isLocationClosed}>
                  Save Draft
                </Button>
                <Button onClick={handleSubmitApproval} disabled={isLocationClosed || locationHasApprovedBalance || lines.length === 0}>
                  Submit for Approval
                </Button>
              </>
            )}
            
            {formData.status === 'Pending Approval' && isManager && (
              <>
                <Button variant="destructive" onClick={() => setShowRejectModal(true)}>Reject</Button>
                <Button onClick={handleApprove}>Approve & Post Stock</Button>
              </>
            )}

            {formData.status === 'Approved' && (
              <Button variant="secondary" onClick={() => window.print()}>Print Document</Button>
            )}
          </div>
        }
      />

      {/* Closed Location Hard Block Banner (PPE-024) */}
      {isLocationClosed && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 flex items-start space-x-3 text-safety-red">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Opening Balance is Closed for this Location</div>
            <p className="text-xs mt-0.5">Opening balance is closed for this location. Use a stock adjustment (PPE-024).</p>
          </div>
        </div>
      )}

      {/* Reused Stock Condition Notice (PPE-024) */}
      {selectedLocation?.stockCondition === 'Used' && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-center space-x-2 text-amber-900 text-xs font-semibold">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Used Location: Stock physically present here will be initialized as <strong>Reused</strong> equipment (Rule G6 & PPE-024).</span>
        </div>
      )}

      {/* Capacity Warning Banner (PPE-024) */}
      {isOverCapacity && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-center space-x-2 text-amber-900 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>Non-blocking capacity warning: Total quantity ({projectedOnHand} units) will exceed warehouse storage capacity ({locationCapacity} units).</span>
        </div>
      )}

      {formData.status && !isNew && (
        <div className={`p-4 rounded-md border flex items-center justify-between ${
          formData.status === 'Approved' ? 'bg-green-50 border-green-200' :
          formData.status === 'Rejected' ? 'bg-red-50 border-red-200' :
          formData.status === 'Pending Approval' ? 'bg-amber-50 border-amber-200' :
          'bg-gray-50 border-gray-200'
        }`}>
           <div className="flex items-center space-x-3">
             <StatusBadge status={statusVariant} label={formData.status} />
             <span className="text-xs text-body font-mono">
               Ref: {formData.reference} &middot; 
               {formData.status === 'Approved' && formData.approvedAt && ` Approved on ${new Date(formData.approvedAt).toLocaleString()}`}
               {formData.status === 'Rejected' && formData.rejectionReason && ` Rejected: ${formData.rejectionReason}`}
               {formData.status === 'Pending Approval' && ` Submitted on ${new Date(formData.submittedAt || '').toLocaleString()}`}
             </span>
           </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-body mb-1">Location *</label>
            <Select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              disabled={isReadOnly}
              className={errors.locationId ? 'border-red-500' : ''}
            >
              <option value="">Select Location...</option>
              {validLocations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} - {loc.nameEn} ({loc.stockCondition}) {loc.openingBalanceClosed ? '[CLOSED]' : ''}
                </option>
              ))}
            </Select>
            {errors.locationId && <p className="text-xs text-red-500 mt-1">{errors.locationId}</p>}
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-body mb-1">Reference Date *</label>
            <Input
              type="date"
              value={formData.referenceDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, referenceDate: e.target.value })}
              disabled={isReadOnly}
              className={errors.referenceDate ? 'border-red-500' : ''}
            />
            {errors.referenceDate && <p className="text-xs text-red-500 mt-1">{errors.referenceDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-body mb-1">System Reference</label>
            <Input
              value={formData.reference || ''}
              disabled
              className="bg-canvas font-mono text-xs"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-body mb-1">Count Notes & Verification Details</label>
            <textarea
              className="input-base min-h-[60px] text-xs"
              maxLength={500}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isReadOnly}
              placeholder="e.g. Physical count conducted on site during go-live transition..."
            />
          </div>
        </div>
      </div>

      {/* Line Items Section with Spreadsheet Import (PPE-024) */}
      <div className="bg-surface border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-3 bg-canvas">
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Inventory Lines ({lines.length})</h3>
            <p className="text-xs text-body mt-0.5">Total Quantity: <strong>{totalQuantity} units</strong> &middot; Warehouse Space: {projectedOnHand} / {locationCapacity || '∞'}</p>
          </div>
          {!isReadOnly && !isLocationClosed && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                <Download className="w-3.5 h-3.5 mr-1" /> Template
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded bg-canvas border border-border hover:bg-surface text-ink shadow-sm">
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload CSV
                </span>
              </label>
              <Button size="sm" onClick={addLine}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
              </Button>
            </div>
          )}
        </div>
        
        {importErrors.length > 0 && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex justify-between items-center text-xs text-amber-900">
            <span>{importErrors.length} row(s) had validation errors and were skipped.</span>
            <Button size="sm" variant="secondary" onClick={handleDownloadErrorReport}>
              <Download className="w-3 h-3 mr-1" /> Download Error Report
            </Button>
          </div>
        )}

        {errors.lines && <div className="p-4 text-xs font-semibold text-safety-red bg-red-50 border-b border-red-100">{errors.lines}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
              <tr>
                <th className="px-4 py-3">PPE Catalog Item *</th>
                <th className="px-4 py-3 w-40">Variant / Size</th>
                <th className="px-4 py-3 w-44">Batch Number *</th>
                <th className="px-4 py-3 w-36">Mfg Expiry Date</th>
                <th className="px-4 py-3 w-24">Qty *</th>
                <th className="px-4 py-3 w-28">Cost/Unit</th>
                {!isReadOnly && <th className="px-4 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-body">
                    No physical inventory lines entered yet. Click "Add Line" or "Upload CSV".
                  </td>
                </tr>
              ) : lines.map((line, idx) => {
                const item = ppeItems.find(p => p.id === line.ppeItemId);
                return (
                  <tr key={idx} className="hover:bg-canvas/40">
                    <td className="px-4 py-3 align-top">
                      <Select
                        value={line.ppeItemId}
                        onChange={(e) => updateLine(idx, 'ppeItemId', e.target.value)}
                        disabled={isReadOnly}
                        className={errors[`line-${idx}-ppe`] ? 'border-red-500' : ''}
                      >
                        <option value="">Select Item...</option>
                        {ppeItems.filter(p => p.active && !p.deletedAt).map(p => (
                          <option key={p.id} value={p.id}>{p.itemCode} - {p.nameEn}</option>
                        ))}
                      </Select>
                      {errors[`line-${idx}-ppe`] && <p className="text-[10px] text-red-500 mt-1">{errors[`line-${idx}-ppe`]}</p>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {item?.variantAttributeValueIds && item.variantAttributeValueIds.length > 0 ? (
                        <Select
                          value={line.variantKey || ''}
                          onChange={(e) => updateLine(idx, 'variantKey', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">Select Variant...</option>
                          {item.variantAttributeValueIds.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-body text-[11px] italic">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Input
                        value={line.batchNumber}
                        onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                        disabled={isReadOnly}
                        className={errors[`line-${idx}-batch`] ? 'border-red-500 font-mono text-xs' : 'font-mono text-xs'}
                        placeholder="BATCH-2026-0001"
                      />
                      {errors[`line-${idx}-batch`] && <p className="text-[10px] text-red-500 mt-1">{errors[`line-${idx}-batch`]}</p>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Input
                        type="date"
                        value={line.expiryDate || ''}
                        onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                        disabled={isReadOnly}
                        className="text-xs"
                      />
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity || ''}
                        onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                        disabled={isReadOnly}
                        className={errors[`line-${idx}-qty`] ? 'border-red-500 text-xs' : 'text-xs font-bold'}
                      />
                      {errors[`line-${idx}-qty`] && <p className="text-[10px] text-red-500 mt-1">{errors[`line-${idx}-qty`]}</p>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.costPerUnit || ''}
                        onChange={(e) => updateLine(idx, 'costPerUnit', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="text-xs font-mono"
                      />
                    </td>

                    {!isReadOnly && (
                      <td className="px-4 py-3 align-top">
                        <button 
                          type="button" 
                          className="text-body hover:text-safety-red p-1 cursor-pointer" 
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full shadow-2xl border border-border">
            <h3 className="text-sm font-bold text-ink mb-2">Reject Opening Balance Document</h3>
            <p className="text-xs text-body mb-3">Provide a formal audit reason for rejecting this count (min 20 characters).</p>
            <textarea
              className="input-base min-h-[90px] mb-3 text-xs"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State discrepancies or audit review findings..."
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={rejectReason.length < 20}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
