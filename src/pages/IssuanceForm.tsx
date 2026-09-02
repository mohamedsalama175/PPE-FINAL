import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ContainerCard } from '../components/ui/ContainerCard';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useToastStore } from '../store/toastStore';
import { addDays, addMonths, addYears, format } from 'date-fns';
import { ShieldAlert, AlertTriangle, CheckCircle2, User, Package, Calendar, Clock, RotateCcw, AlertOctagon } from 'lucide-react';
import { PPEItem, Batch, Location } from '../types';

export default function IssuanceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    ppeItems, 
    locations, 
    employees, 
    currentUser, 
    batches, 
    issuances, 
    issueSinglePPE,
    itemGroups,
    attributes
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap');
    }
    return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap' && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Query parameter pre-fills (from Replacements Due NEW-07)
  const initialEmployeeId = searchParams.get('employeeId') || (employees[0]?.id || '');
  const initialItemId = searchParams.get('itemId') || '';
  const initialVariant = searchParams.get('variant') || '';
  const replacesIssuanceId = searchParams.get('replacesId') || '';

  const [employeeId, setEmployeeId] = React.useState(initialEmployeeId);
  const [locationId, setLocationId] = React.useState(assignedLocations[0]?.id || '');
  const [ppeItemId, setPpeItemId] = React.useState(initialItemId || (ppeItems[0]?.id || ''));
  const [variantKey, setVariantKey] = React.useState(initialVariant);
  const [quantity, setQuantity] = React.useState(1);
  const [batchNumber, setBatchNumber] = React.useState('');
  const [batchReason, setBatchReason] = React.useState('');
  const [replacesId, setReplacesId] = React.useState(replacesIssuanceId);
  const [processOldReturn, setProcessOldReturn] = React.useState(!!replacesIssuanceId);
  const [oldReturnCondition, setOldReturnCondition] = React.useState<'good' | 'damaged' | 'worn_out' | 'lost'>('worn_out');

  // Dual Signatures (Rule 2)
  const [storeKeeperSignature, setStoreKeeperSignature] = React.useState('');
  const [receiverSignature, setReceiverSignature] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const selectedEmployee = React.useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
  const selectedItem = React.useMemo(() => ppeItems.find(p => p.id === ppeItemId), [ppeItems, ppeItemId]);
  const selectedLoc = React.useMemo(() => locations.find(l => l.id === locationId), [locations, locationId]);

  // Available items for location (active only)
  const availableItems = React.useMemo(() => {
    if (!locationId) return [];
    return ppeItems.filter(p => p.active && !p.deletedAt && (p.locationIds || []).includes(locationId));
  }, [ppeItems, locationId]);

  // Variants from Item Group
  const availableVariants = React.useMemo(() => {
    if (!selectedItem) return ['Standard'];
    const group = itemGroups.find(g => g.id === selectedItem.itemGroupId);
    if (!group) return ['Standard'];
    const groupAttrs = attributes.filter(a => group.assignedAttributeIds.includes(a.id));
    
    // Find size or gender values
    const variants: string[] = [];
    const sizeAttr = groupAttrs.find(a => a.code.toUpperCase() === 'SIZE');
    const genderAttr = groupAttrs.find(a => a.code.toUpperCase() === 'GENDER');

    if (sizeAttr && sizeAttr.values.length > 0) {
      sizeAttr.values.forEach(sv => {
        if (genderAttr && genderAttr.values.length > 0) {
          genderAttr.values.forEach(gv => {
            variants.push(`${sv.valueEn} / ${gv.valueEn}`);
          });
        } else {
          variants.push(sv.valueEn);
        }
      });
    } else if (genderAttr && genderAttr.values.length > 0) {
      genderAttr.values.forEach(gv => variants.push(gv.valueEn));
    }

    return variants.length > 0 ? variants : ['Standard'];
  }, [selectedItem, itemGroups, attributes]);

  React.useEffect(() => {
    if (availableVariants.length > 0 && !variantKey) {
      // Auto pre-fill from employee last received size if available
      const lastSize = selectedEmployee?.lastReceivedSizes?.[ppeItemId]?.rawKey;
      if (lastSize && availableVariants.includes(lastSize)) {
        setVariantKey(lastSize);
      } else {
        setVariantKey(availableVariants[0]);
      }
    }
  }, [availableVariants, variantKey, selectedEmployee, ppeItemId]);

  // FIFO Batch recommendation: oldest available batch first
  const eligibleBatches = React.useMemo(() => {
    if (!ppeItemId || !locationId) return [];
    return batches
      .filter(b => b.ppeItemId === ppeItemId && b.locationId === locationId && b.availableQty > 0 && b.status === 'Active')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [batches, ppeItemId, locationId]);

  const recommendedFifoBatch = eligibleBatches[0];

  React.useEffect(() => {
    if (eligibleBatches.length > 0 && (!batchNumber || !eligibleBatches.some(b => b.batchNumber === batchNumber))) {
      setBatchNumber(eligibleBatches[0].batchNumber);
    }
  }, [eligibleBatches, batchNumber]);

  // Gender Match Rule (Rule 5)
  const genderMatchError = React.useMemo(() => {
    if (!selectedItem || !selectedEmployee) return null;
    const group = itemGroups.find(g => g.id === selectedItem.itemGroupId);
    if (!group || !group.requiresGenderMatch) return null;

    // Check if variant indicates gender
    const vUpper = (variantKey || '').toUpperCase();
    const empGender = (selectedEmployee.gender || 'Unisex').toUpperCase();

    if (vUpper.includes('MALE') && !vUpper.includes('FEMALE') && empGender === 'FEMALE') {
      return `Gender Match Violation: Item requires gender match. Variant "${variantKey}" does not match employee gender (${selectedEmployee.gender}).`;
    }
    if (vUpper.includes('FEMALE') && empGender === 'MALE') {
      return `Gender Match Violation: Item requires gender match. Variant "${variantKey}" does not match employee gender (${selectedEmployee.gender}).`;
    }

    return null;
  }, [selectedItem, selectedEmployee, itemGroups, variantKey]);

  // Active Issuance held by employee for same item
  const existingHeldIssuance = React.useMemo(() => {
    if (!employeeId || !ppeItemId) return null;
    return issuances.find(i => i.employeeId === employeeId && i.ppeItemId === ppeItemId && i.status === 'issued');
  }, [issuances, employeeId, ppeItemId]);

  // Expected replacement date calculation (Rule 12)
  const expectedReplacementDate = React.useMemo(() => {
    if (!selectedItem) return undefined;
    const now = new Date();
    if (selectedItem.lifespanUnit === 'Days') return format(addDays(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    if (selectedItem.lifespanUnit === 'Months') return format(addMonths(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    if (selectedItem.lifespanUnit === 'Years') return format(addYears(now, selectedItem.lifespanValue), 'yyyy-MM-dd');
    return undefined;
  }, [selectedItem]);

  const selectedBatchObj = React.useMemo(() => {
    return eligibleBatches.find(b => b.batchNumber === batchNumber);
  }, [eligibleBatches, batchNumber]);

  const isChangingFifo = recommendedFifoBatch && batchNumber !== recommendedFifoBatch.batchNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (genderMatchError) {
      addToast(genderMatchError, 'error');
      return;
    }

    if (!selectedBatchObj || selectedBatchObj.availableQty < quantity) {
      addToast(`Insufficient stock in selected batch. Available: ${selectedBatchObj?.availableQty || 0}.`, 'error');
      return;
    }

    if (isChangingFifo && !batchReason.trim()) {
      addToast('A reason is required when selecting a batch other than the oldest FIFO batch.', 'error');
      return;
    }

    if (!storeKeeperSignature || !receiverSignature) {
      addToast('Dual digital signatures (Store Keeper & Employee) are strictly mandatory.', 'error');
      return;
    }

    setSubmitting(true);
    const ref = issueSinglePPE({
      employeeId,
      ppeItemId,
      locationId,
      quantity,
      batchNumber,
      variantKey: variantKey || 'Standard',
      conditionAtIssue: selectedLoc?.stockCondition === 'Used' ? 'Reused' : 'New',
      issueDate: new Date().toISOString().split('T')[0],
      expectedReplacementDate,
      storeKeeperSignature,
      receiverSignature,
      issuedBy: currentUser.name,
      replacesIssuanceId: replacesId || (existingHeldIssuance ? existingHeldIssuance.id : undefined)
    });
    setSubmitting(false);

    addToast(`PPE Item issued successfully (${ref}).`, 'success');
    navigate('/issuances');
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from issuing PPE.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Issue PPE (Single Item)"
        subtitle="Issue standard PPE item with dynamic variants, FIFO batching, Gender Match validation, and dual canvas signatures (BD-I467)"
      />

      <ContainerCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
        {genderMatchError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <span className="font-bold">Gender Match Error:</span> {genderMatchError}
            </div>
          </div>
        )}

        {existingHeldIssuance && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-700" /> Employee currently holds an active issuance of this item
              </span>
              <span className="font-mono text-amber-800">Ref: {existingHeldIssuance.reference}</span>
            </div>
            <p className="text-xs text-amber-800">
              Issued on: {existingHeldIssuance.issueDate} | Replacement due:{' '}
              {existingHeldIssuance.expectedReplacementDate || 'N/A'}.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={processOldReturn}
                  onChange={e => setProcessOldReturn(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Mark previous issuance as replaced upon completing this issue
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <Select
              value={locationId}
              onChange={e => {
                setLocationId(e.target.value);
                setBatchNumber('');
              }}
              required
            >
              {assignedLocations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.nameEn} ({l.stockCondition})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <Select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            >
              {employees
                .filter(e => e.status === 'Active')
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.jobPosition || e.jobPositionId} — {e.site}) [{e.gender}]
                  </option>
                ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PPE Item <span className="text-red-500">*</span>
            </label>
            <Select
              value={ppeItemId}
              onChange={e => {
                setPpeItemId(e.target.value);
                setVariantKey('');
                setBatchNumber('');
              }}
              required
            >
              {availableItems.map(p => (
                <option key={p.id} value={p.id}>
                  {p.itemCode} — {language === 'en' ? p.nameEn : p.nameAr}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Variant / Size</label>
            <Select value={variantKey} onChange={e => setVariantKey(e.target.value)}>
              {availableVariants.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>
        </div>

        {/* FIFO Batch Selector */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Available Batches (FIFO Ordered)
            </label>
            {recommendedFifoBatch && (
              <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Recommended FIFO: {recommendedFifoBatch.batchNumber} (Avail: {recommendedFifoBatch.availableQty})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Batch</label>
              <Select value={batchNumber} onChange={e => setBatchNumber(e.target.value)} required>
                {eligibleBatches.map((b, idx) => (
                  <option key={b.id} value={b.batchNumber}>
                    {idx === 0 ? '⭐ [Oldest / FIFO] ' : ''}
                    {b.batchNumber} — Avail: {b.availableQty} ({b.condition}) {b.expiryDate ? `Exp: ${b.expiryDate}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Condition at Issue (Auto)
              </label>
              <Input
                readOnly
                value={selectedLoc?.stockCondition === 'Used' ? 'Reused (Fresh lifespan starts)' : 'New'}
                className="bg-slate-100 text-slate-700"
              />
            </div>
          </div>

          {isChangingFifo && (
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                FIFO Override Justification <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Explain why the oldest available batch was bypassed..."
                value={batchReason}
                onChange={e => setBatchReason(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* Expected Replacement Date Banner */}
        {expectedReplacementDate && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-700">
            <span>
              <span className="font-semibold text-slate-900">Calculated Expected Replacement Date:</span>{' '}
              {expectedReplacementDate} (Lifespan: {selectedItem?.lifespanValue} {selectedItem?.lifespanUnit})
            </span>
            <span className="text-[11px] text-slate-500 italic">Future lifespan changes will not alter this issuance</span>
          </div>
        )}

        {/* Dual HTML5 Digital Signatures (Rule 2) */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dual Digital Signatures (Mandatory)
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive HTML5 touch/stylus signature pads for Store Keeper and Employee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignaturePad
              label={`Store Keeper: ${currentUser.name}`}
              onSave={setStoreKeeperSignature}
              required
            />
            <SignaturePad
              label={`Recipient Employee: ${selectedEmployee?.name || 'Employee'}`}
              onSave={setReceiverSignature}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 ">
          <Button type="button" variant="secondary" onClick={() => navigate('/issuances')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !!genderMatchError}>
            Complete Single Issuance
          </Button>
        </div>
      </form>
      </ContainerCard>
    </div>
  );
}
