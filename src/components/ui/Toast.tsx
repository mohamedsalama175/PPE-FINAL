import * as React from 'react';
import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className="flex items-center gap-3 bg-ink text-surface px-4 py-3 rounded-lg shadow-lg text-sm min-w-[250px] animate-in slide-in-from-bottom-5">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-safety-green" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-safety-red" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-400" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-body hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
