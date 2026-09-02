import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { X, Briefcase, Check, AlertCircle, PackageCheck, Zap } from 'lucide-react';
import { usePPEStore } from '../../store/useStore';
import { useToastStore } from '../../store/toastStore';
import { DualSignatureSection } from '../ui/SignaturePad';
import { Kit } from '../../types';

export function IssueKitModal({
  isOpen,
  onClose,
  initialKit,
  preselectedKit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialKit?: Kit | null;
  preselectedKit?: Kit | null;
}) {
  const targetInitial = preselectedKit || initialKit;
  const { kits, employees, locations, ppeItems, batches, currentUser, issueKitPPE } = usePPEStore();
  const addToast = useToastStore((s) => s.addToast);

  const [kitId, setKitId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [storeKeeperSig, setStoreKeeperSig] = useState<string>('');
  const [receiverSig, setReceiverSig] = useState<string>('');

  useEffect(() => {
    if (targetInitial) {
      setKitId(targetInitial.id);
    } else if (kits[0]) {
      setKitId(kits[0].id);
    }
    if (employees[0]) {
      setEmployeeId(employees[0].id);
    }
    if (locations[0]) {
      setLocationId(locations[0].id);
    }
  }, [targetInitial, kits, employees, locations, isOpen]);

  const selectedKit = useMemo(() => {
    return kits.find((k) => k.id === kitId) || kits[0];
  }, [kits, kitId]);

  const targetEmp = useMemo(() => {
    return employees.find((e) => e.id === employeeId);
  }, [employees, employeeId]);

  // Check item availability in selected location
  const kitItemsAvailability = useMemo(() => {
    if (!selectedKit) return [];
    return selectedKit.items.map((ki) => {
      const ppe = ppeItems.find((p) => p.id === ki.ppeItemId);
      const available = batches
        .filter((b) => b.ppeItemId === ki.ppeItemId && b.locationId === locationId)
        .reduce((acc, b) => acc + b.availableQty, 0);

      const hasEnough = available >= ki.quantity;

      return {
        ...ki,
        item: ppe,
        required: ki.quantity,
        available,
        hasEnough,
      };
    });
  }, [selectedKit, locationId, ppeItems, batches]);

  const inStockCount = kitItemsAvailability.filter(i => i.hasEnough).length;

  if (!isOpen || !selectedKit) return null;

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (inStockCount === 0) {
      addToast('Cannot issue kit: All items are currently out of stock.', 'error');
      return;
    }

    if (!storeKeeperSig || !receiverSig) {
      addToast('Both Store Keeper and Recipient signatures are mandatory (Rule 2).', 'error');
      return;
    }

    const linesToIssue = kitItemsAvailability
      .filter(k => k.hasEnough)
      .map(k => ({
        ppeItemId: k.ppeItemId,
        variantKey: 'Default',
        quantity: k.quantity
      }));

    const result = issueKitPPE({
      employeeId,
      kitId: selectedKit.id,
      locationId,
      lines: linesToIssue,
      storeKeeperSignature: storeKeeperSig,
      receiverSignature: receiverSig
    });

    addToast(
      `Issued ${result.issuedCount} items from "${selectedKit.nameEn}" to ${targetEmp?.name}. ${result.skippedCount > 0 ? `(${result.skippedCount} skipped out of stock)` : ''}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden transition-all text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Issue Job Kit (BD-I468)
                </h3>
                <span className="text-[10px] bg-teal-600 text-white font-bold uppercase px-1.5 py-0.5 rounded">
                  Bundle Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Out-of-stock items are automatically skipped without creating sub-requests
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirmIssue} className="p-5 space-y-4 text-xs">
          {/* Kit Picked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Selected Job Kit *
              </label>
              <select
                value={kitId}
                onChange={(e) => setKitId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {kits.filter(k => k.active && !k.deletedAt).map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Dispense Warehouse *
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {locations.filter(l => l.active && l.stockCondition !== 'Scrap').map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nameEn} ({loc.stockCondition})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Recipient Personnel *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
            >
              {employees.filter(e => e.status === 'Active').map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) • {emp.gender}
                </option>
              ))}
            </select>
          </div>

          {/* Component Inventory Check Preview */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Kit Components & Stock Status at Location:
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {kitItemsAvailability.map((ki) => (
                <div
                  key={ki.id}
                  className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span className="font-semibold text-slate-800">
                      {ki.item?.nameEn}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Req: {ki.required} {ki.item?.uom})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`text-[10px] font-bold ${
                        ki.hasEnough ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {ki.available} available
                    </span>
                    {ki.hasEnough ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 bg-red-100 text-red-700 font-bold rounded">
                        Will be skipped
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Dual Digital Signatures */}
          <DualSignatureSection
            storeKeeperSig={storeKeeperSig}
            receiverSig={receiverSig}
            onStoreKeeperSigChange={setStoreKeeperSig}
            onReceiverSigChange={setReceiverSig}
            receiverLabel="Recipient Personnel Signature"
            receiverRole="Employee"
          />

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inStockCount === 0 || !storeKeeperSig || !receiverSig}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer ${
                inStockCount > 0 && storeKeeperSig && receiverSig
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Issue Kit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
