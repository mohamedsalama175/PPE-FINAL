import * as React from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';

interface OverrideModalProps {
  isOpen: boolean;
  title?: string;
  entityName: string;
  reasons: string[];
  actionLabel?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function OverrideModal({
  isOpen,
  title = 'In-Use Protection Override',
  entityName,
  reasons,
  actionLabel = 'Override and Proceed',
  onClose,
  onConfirm
}: OverrideModalProps) {
  const [reason, setReason] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) return;
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-border flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-amber-50">
          <div className="flex items-center gap-2 text-safety-amber-signal">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-ink text-sm uppercase tracking-wider">{title}</h3>
          </div>
          <button onClick={onClose} className="text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="text-xs text-body">
            The target item <span className="font-semibold text-ink">{entityName}</span> has active dependencies and is protected by Global Rule G2:
          </div>

          <div className="bg-canvas border border-border rounded-md p-3">
            <ul className="text-xs text-safety-red space-y-1 list-disc pl-4">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Admin Override Justification <span className="text-safety-red">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a written operational explanation for overriding this protection (minimum 10 characters)..."
              className="w-full text-xs p-2.5 rounded border border-border focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
            />
            <p className="text-[11px] text-body mt-1">
              This action will be permanently recorded in the immutable audit log (G1).
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" disabled={reason.trim().length < 10}>
              {actionLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

