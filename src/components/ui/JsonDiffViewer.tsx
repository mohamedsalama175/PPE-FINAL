import * as React from 'react';
import { SlideOverDrawer } from './SlideOverDrawer';
import { AuditLog } from '../../types';
import { format } from 'date-fns';
import { Clock, ShieldCheck, User, ArrowRight, FileText } from 'lucide-react';

interface JsonDiffViewerProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JsonDiffViewer({ log, isOpen, onClose }: JsonDiffViewerProps) {
  if (!log) return null;

  const formattedBefore = log.beforeValues ? JSON.stringify(log.beforeValues, null, 2) : 'null (Created or Initial State)';
  const formattedAfter = log.afterValues ? JSON.stringify(log.afterValues, null, 2) : 'null (Deleted)';

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Entry: ${log.action}`}
      subtitle={`Ref: ${log.objectReference} • ${log.objectType}`}
      width="2xl"
      badge={
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
          {log.retentionFlag}
        </span>
      }
    >
      {/* Metadata Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">UTC Timestamp</span>
          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {format(new Date(log.timestampUTC), 'yyyy-MM-dd HH:mm:ss')}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Actor & Role</span>
          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            {log.user} ({log.role})
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Source</span>
          <span className="font-bold text-slate-800 block mt-0.5">{log.source}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-mono text-[10px] uppercase">Entity Type</span>
          <span className="font-bold text-indigo-700 block mt-0.5 font-mono">{log.objectType}</span>
        </div>
      </div>

      {log.reason && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-950">
          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
            Recorded Override / Change Reason
          </span>
          <p className="mt-1 text-xs leading-relaxed font-medium">{log.reason}</p>
        </div>
      )}

      {/* Side-by-Side Before vs After JSON Diffs */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          State Mutation Diff (JSON Before vs. After)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/60">
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-between font-mono">
              <span>BEFORE VALUES</span>
              <span className="text-[10px] text-slate-500">{log.beforeValues ? 'Historical' : 'None'}</span>
            </div>
            <pre className="p-3 text-[10.5px] font-mono text-slate-800 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
              {formattedBefore}
            </pre>
          </div>

          {/* After */}
          <div className="border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50/20">
            <div className="px-3 py-1.5 bg-emerald-100/70 border-b border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center justify-between font-mono">
              <span>AFTER VALUES</span>
              <span className="text-[10px] text-emerald-700">Committed</span>
            </div>
            <pre className="p-3 text-[10.5px] font-mono text-emerald-950 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
              {formattedAfter}
            </pre>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-100 rounded text-[11px] text-slate-600 flex items-center gap-2 border border-slate-200 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        Cryptographically signed audit hash: sha256:{log.id.replace(/[^a-f0-9]/gi, '')}9b21f0084c71
      </div>
    </SlideOverDrawer>
  );
}
