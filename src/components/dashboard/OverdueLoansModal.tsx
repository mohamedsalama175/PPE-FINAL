import * as React from 'react';
import { useState } from 'react';
import {
  X,
  Calendar,
  AlertCircle,
  UserCheck,
  CornerDownLeft,
  Bell,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { OverdueLoanRecord } from './OverdueLoansHeatmap';
import { useToastStore } from '../../store/toastStore';

export function OverdueLoansModal({
  isOpen,
  onClose,
  selectedDate,
  initialRecords,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  initialRecords: OverdueLoanRecord[];
}) {
  const [records, setRecords] = useState<OverdueLoanRecord[]>(initialRecords);
  const addToast = useToastStore((s) => s.addToast);

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  if (!isOpen || !selectedDate) return null;

  const handleMarkReturned = (rec: OverdueLoanRecord) => {
    setRecords((prev) => prev.filter((r) => r.id !== rec.id));
    addToast(
      `Loan for ${rec.visitorName} (${rec.ppeItemName}) received and marked returned.`,
      'success'
    );
  };

  const handleSendReminder = (rec: OverdueLoanRecord) => {
    addToast(
      `Overdue notice sent to Host Employee ${rec.hostEmployeeName} for visitor ${rec.visitorName}.`,
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-950/60 backdrop-blur-2xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-4 bg-rose-500/10 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
                  Overdue Loan Records ({selectedDate})
                </h3>
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.2 rounded uppercase font-mono">
                  {records.length} Unreturned
                </span>
              </div>
              <p className="text-[11px] text-slate-500 ">
                Visitor &amp; contractor items requiring immediate custody recovery or host employee escalation
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

        {/* Content Table / Cards */}
        <div className="p-5 max-h-96 overflow-y-auto space-y-3 text-xs">
          {records.length > 0 ? (
            records.map((rec) => (
              <div
                key={rec.id}
                className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {rec.visitorName}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Loaned Gear: <strong className="text-slate-800 ">{rec.ppeItemName}</strong>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-300 font-mono">
                    <AlertCircle className="w-3 h-3" /> {rec.daysOverdue} Days Overdue
                  </span>
                </div>

                {/* Host Details */}
                <div className="bg-white p-2.5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 ">
                        Host: {rec.hostEmployeeName}
                      </span>
                      <span className="text-slate-400 ms-1.5 font-mono">({rec.hostDepartment})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                    <Phone className="w-3 h-3" />
                    <span>{rec.contactPhone || '+966 50 123 4567'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendReminder(rec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-slate-700 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Send Host Alert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkReturned(rec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm Received Back</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="font-bold text-slate-700 ">All loans cleared!</p>
              <p className="text-xs mt-0.5">No unreturned visitor or contractor PPE records pending for this date.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
