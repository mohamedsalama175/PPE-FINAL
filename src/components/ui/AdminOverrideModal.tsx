import * as React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface AdminOverrideModalProps {
  isOpen: boolean;
  title: string;
  warningMessage: string;
  actionLabel?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function AdminOverrideModal({
  isOpen,
  title,
  warningMessage,
  actionLabel = 'Proceed with Admin Override',
  onConfirm,
  onCancel
}: AdminOverrideModalProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A valid override justification of at least 5 characters is required.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
              <span className="text-[11px] font-mono font-medium text-amber-800 uppercase tracking-wider">
                Admin Override Required (Rule 3)
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              In-Use Protection Active
            </div>
            <p className="leading-relaxed text-[11px]">{warningMessage}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mandatory Override Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="State the operational justification for overriding this in-use restriction (will be recorded in the Immutable Audit Log)..."
              className="w-full rounded border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
            {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            This action and your override reason will be permanently recorded in the 
            <strong> Immutable Compliance Audit Log (NEW-05)</strong> under 7-year retention.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4"
            >
              {actionLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
