import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateId } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Trash2, Plus, Info } from 'lucide-react';
import { OpeningBalance, OpeningBalanceLine } from '../types';

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
    batches,
    stockAdjustments
  } = useStore();

  const isNew = !id;
  const existingDoc = openingBalances.find(ob => ob.id === id);

  const [formData, setFormData] = useState<Partial<OpeningBalance>>({
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

  useEffect(() => {
    if (existingDoc) {
      setFormData(existingDoc);
      setLines(existingDoc.lines);
    }
  }, [existingDoc]);

  // Derived state
  const isReadOnly = formData.status === 'Approved' || formData.status === 'Pending Approval';
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Store Keeper';
  const isManager = currentUser.role === 'HSE Supervisor' || currentUser.role === 'Admin'; // Admin can act as manager for demo

  // Validate location constraint
  const locationHasExistingBalance = React.useMemo(() => {
    if (!formData.locationId) return false;
    if (existingDoc) return false; // Editing an existing one (which is draft/rejected)
    return openingBalances.some(ob => ob.locationId === formData.locationId && ob.status === 'Approved');
  }, [formData.locationId, existingDoc, openingBalances]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.referenceDate) newErrors.referenceDate = 'Reference date is required';
    if (locationHasExistingBalance) newErrors.locationId = 'An approved opening balance already exists for this location.';
    if (lines.length === 0) newErrors.lines = 'At least one line item is required';

    const seenBatches = new Set<string>();
    lines.forEach((line, idx) => {
      if (!line.ppeItemId) newErrors[`line-${idx}-ppe`] = 'Item required';
      if (!line.batchNumber) newErrors[`line-${idx}-batch`] = 'Batch required';
      if (!line.expiryDate) newErrors[`line-${idx}-expiry`] = 'Expiry required';
      else if (new Date(line.expiryDate) <= new Date(formData.referenceDate!)) {
        newErrors[`line-${idx}-expiry`] = `Expiry must be after reference date`;
      }
      if (!line.quantity || line.quantity <= 0) newErrors[`line-${idx}-qty`] = 'Quantity must be > 0';

      const key = `${line.ppeItemId}-${line.batchNumber}`;
      if (seenBatches.has(key)) {
        newErrors[`line-${idx}-batch`] = 'Duplicate batch for same item on this document';
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
      alert('Location and Reference Date are required to save draft.');
      return;
    }

    const doc: OpeningBalance = {
      id: isNew ? generateId() : formData.id!,
      locationId: formData.locationId,
      referenceDate: formData.referenceDate,
      notes: formData.notes,
      status: 'Draft',
      preparedBy: formData.preparedBy || currentUser.id,
      lines: lines as OpeningBalanceLine[],
      createdAt: formData.createdAt || new Date().toISOString()
    };
    saveOpeningBalance(doc);
    navigate('/stock/opening-balances');
  };

  const handleSubmitApproval = () => {
    if (!validateForm()) return;

    const doc: OpeningBalance = {
      id: isNew ? generateId() : formData.id!,
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
    navigate('/stock/opening-balances');
  };

  const handleApprove = () => {
    if (formData.id) {
      approveOpeningBalance(formData.id, currentUser.id);
      navigate('/stock/opening-balances');
    }
  };

  const handleReject = () => {
    if (rejectReason.length < 20) {
      alert('Rejection reason must be at least 20 characters.');
      return;
    }
    if (formData.id) {
      rejectOpeningBalance(formData.id, rejectReason);
      setShowRejectModal(false);
      navigate('/stock/opening-balances');
    }
  };

  const addLine = () => {
    setLines([...lines, { id: generateId(), ppeItemId: '', batchNumber: '', quantity: 0, costPerUnit: 0, expiryDate: '' }]);
  };

  const updateLine = (index: number, field: keyof OpeningBalanceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  let statusVariant: any = 'neutral';
  if (formData.status === 'Approved') statusVariant = 'success';
  if (formData.status === 'Pending Approval') statusVariant = 'warning';
  if (formData.status === 'Rejected') statusVariant = 'error';

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title={isNew ? 'Record Opening Balance' : 'Opening Balance Details'}
        onBack={() => navigate('/stock/opening-balances')}
        actions={
          <div className="flex space-x-3">
            {formData.status === 'Draft' || formData.status === 'Rejected' || isNew ? (
              <>
                <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
                <Button onClick={handleSubmitApproval} disabled={locationHasExistingBalance || lines.length === 0}>Submit for Approval</Button>
              </>
            ) : null}
            
            {formData.status === 'Pending Approval' && isManager && (
              <>
                <Button variant="destructive" onClick={() => setShowRejectModal(true)}>Reject</Button>
                <Button variant="primary" onClick={handleApprove}>Approve</Button>
              </>
            )}

            {formData.status === 'Approved' && (
               <Button variant="outline" onClick={() => window.print()}>Print Report</Button>
            )}
          </div>
        }
      />

      {formData.status && !isNew && (
        <div className={`p-4 rounded-md border flex items-center justify-between ${
          formData.status === 'Approved' ? 'bg-green-50 border-green-200' :
          formData.status === 'Rejected' ? 'bg-red-50 border-red-200' :
          formData.status === 'Pending Approval' ? 'bg-amber-50 border-amber-200' :
          'bg-gray-50 border-gray-200'
        }`}>
           <div className="flex items-center space-x-3">
             <StatusBadge status={statusVariant} label={formData.status} />
             <span className="text-sm text-body">
               {formData.status === 'Approved' && formData.approvedAt && `Approved on ${new Date(formData.approvedAt).toLocaleString()}`}
               {formData.status === 'Rejected' && formData.rejectionReason && `Rejected: ${formData.rejectionReason}`}
               {formData.status === 'Pending Approval' && `Submitted on ${new Date(formData.submittedAt || '').toLocaleString()}`}
             </span>
           </div>
        </div>
      )}

      {locationHasExistingBalance && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800">
           <Info className="w-5 h-5 shrink-0" />
           <p className="text-sm font-medium">An approved opening balance already exists for this location. Use Stock Adjustment to modify existing stock.</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Location *</label>
              <Select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                disabled={isReadOnly}
                className={errors.locationId ? 'border-red-500' : ''}
              >
                <option value="">Select Location</option>
                {locations.filter(l => l.active).map(loc => {
                  const hasApprovedOB = openingBalances.some(ob => ob.locationId === loc.id && ob.status === 'Approved');
                  return (
                    <option key={loc.id} value={loc.id} disabled={hasApprovedOB && formData.locationId !== loc.id}>
                      {loc.code} - {loc.nameEn} {hasApprovedOB ? '(Already Initialized)' : ''}
                    </option>
                  );
                })}
              </Select>
              {errors.locationId && <p className="text-xs text-red-500 mt-1">{errors.locationId}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Reference Date *</label>
              <Input
                type="date"
                value={formData.referenceDate}
                max={new Date().toISOString().split('T')[0]} // Cannot be future date
                onChange={(e) => setFormData({ ...formData, referenceDate: e.target.value })}
                disabled={isReadOnly}
                className={errors.referenceDate ? 'border-red-500' : ''}
              />
              {errors.referenceDate && <p className="text-xs text-red-500 mt-1">{errors.referenceDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Notes</label>
              <textarea
                className="input-base min-h-[80px]"
                maxLength={500}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isReadOnly}
                placeholder="Physical count details..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-medium text-ink">Line Items</h3>
          {!isReadOnly && (
             <Button variant="outline" size="sm" onClick={addLine}>
               <Plus className="w-4 h-4 mr-2" /> Add Line
             </Button>
          )}
        </div>
        
        {errors.lines && <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{errors.lines}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-canvas text-body">
              <tr>
                <th className="px-4 py-3 font-medium">PPE Item *</th>
                <th className="px-4 py-3 font-medium w-48">Batch / Lot No. *</th>
                <th className="px-4 py-3 font-medium w-40">Expiry Date *</th>
                <th className="px-4 py-3 font-medium w-24">Qty *</th>
                <th className="px-4 py-3 font-medium w-24">UoM</th>
                <th className="px-4 py-3 font-medium w-32">Cost/Unit</th>
                {!isReadOnly && <th className="px-4 py-3 font-medium w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-body">
                    No items added yet. Click "Add Line" to begin.
                  </td>
                </tr>
              ) : lines.map((line, idx) => {
                const item = ppeItems.find(p => p.id === line.ppeItemId);
                return (
                  <tr key={idx}>
                    <td className="px-4 py-3 align-top">
                      <Select
                        value={line.ppeItemId}
                        onChange={(e) => updateLine(idx, 'ppeItemId', e.target.value)}
                        disabled={isReadOnly}
                        className={errors[`line-${idx}-ppe`] ? 'border-red-500' : ''}
                      >
                        <option value="">Search Item...</option>
                        {ppeItems.filter(p => p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.itemCode} - {p.nameEn}</option>
                        ))}
                      </Select>
                      {errors[`line-${idx}-ppe`] && <p className="text-xs text-red-500 mt-1">{errors[`line-${idx}-ppe`]}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Input
                        value={line.batchNumber}
                        onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                        disabled={isReadOnly}
                        maxLength={50}
                        className={errors[`line-${idx}-batch`] ? 'border-red-500' : ''}
                        placeholder="BATCH-001"
                      />
                      {errors[`line-${idx}-batch`] && <p className="text-xs text-red-500 mt-1">{errors[`line-${idx}-batch`]}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                        disabled={isReadOnly}
                        min={formData.referenceDate ? new Date(new Date(formData.referenceDate).getTime() + 86400000).toISOString().split('T')[0] : undefined}
                        className={errors[`line-${idx}-expiry`] ? 'border-red-500' : ''}
                      />
                      {errors[`line-${idx}-expiry`] && <p className="text-xs text-red-500 mt-1">{errors[`line-${idx}-expiry`]}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.quantity || ''}
                        onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                        disabled={isReadOnly}
                        className={errors[`line-${idx}-qty`] ? 'border-red-500' : ''}
                      />
                      {errors[`line-${idx}-qty`] && <p className="text-xs text-red-500 mt-1">{errors[`line-${idx}-qty`]}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="h-9 flex items-center px-3 bg-gray-50 border border-border rounded-md text-gray-500">
                        Piece
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.costPerUnit || ''}
                        onChange={(e) => updateLine(idx, 'costPerUnit', parseFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="px-4 py-3 align-top">
                        <Button variant="ghost" className="text-red-600 h-9 px-2" onClick={() => removeLine(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-ink mb-4">Reject Opening Balance</h3>
            <p className="text-sm text-body mb-4">Please provide a reason for rejecting this document (min 20 characters).</p>
            <textarea
              className="input-base min-h-[100px] mb-4"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
            />
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectReason.length < 20}>Reject Document</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
