import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { downloadCsv } from '../lib/excelService';
import { useToastStore } from '../store/toastStore';
import { format } from 'date-fns';
import { ShieldAlert, Download, Eye, X, History, FileText } from 'lucide-react';
import { AuditLog } from '../types';

export default function AuditLogs() {
  const { auditLogs, employees } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  const filteredLogs = React.useMemo(() => {
    return auditLogs.filter(log => {
      const matchType = typeFilter === 'all' || log.entityType === typeFilter || log.objectType === typeFilter;
      if (!matchType) return false;

      if (search) {
        const q = search.toLowerCase();
        const actionMatch = log.action.toLowerCase().includes(q);
        const refMatch = (log.entityId || log.objectReference || '').toLowerCase().includes(q);
        const userMatch = (log.user || log.performedBy || '').toLowerCase().includes(q);
        const detailsMatch = (log.details || log.reason || '').toLowerCase().includes(q);
        return actionMatch || refMatch || userMatch || detailsMatch;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, typeFilter, search]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      addToast('No audit logs to export.', 'error');
      return;
    }
    const headers = ['Timestamp', 'Action', 'Object Type', 'Object Reference', 'Performed By', 'Details / Reason'];
    const rows = filteredLogs.map(l => [
      format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      l.action,
      l.objectType || l.entityType || '',
      l.objectReference || l.entityId || '',
      l.user || l.performedBy,
      l.details || l.reason || ''
    ]);
    downloadCsv('ppe_audit_trail_export', headers, rows);
    addToast('Audit logs exported to CSV successfully.', 'success');
  };

  const uniqueTypes = Array.from(new Set(auditLogs.map(l => l.objectType || l.entityType).filter(Boolean)));

  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader 
        title="Audit Logs & Compliance Trail (PPE-049)" 
        subtitle="Immutable 7-year audit history of all entity creations, state transitions, adjustments, and overrides (Rule G1)" 
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export Audit Log
          </Button>
        }
      />

      <FilterBar>
        <SearchInput 
          placeholder="Search by action, reference, user, or reason..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-48">
          <option value="all">All Object Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </FilterBar>
      
      <div className="flex-1 bg-surface border border-border rounded-sm overflow-hidden flex flex-col">
        <DataTable
          data={filteredLogs}
          keyExtractor={(log) => log.id}
          emptyState={<EmptyState icon={<ShieldAlert />} title="No audit logs available" />}
          columns={[
            { key: 'timestamp', header: 'Timestamp', render: (l) => (
              <span className="font-mono text-xs">{format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
            )},
            { key: 'action', header: 'Action', render: (l) => (
              <span className={`inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                l.action.includes('DELETE') || l.action.includes('REJECT') || l.action.includes('SCRAP') 
                  ? 'bg-red-50 text-safety-red border border-red-200' 
                  : l.action.includes('APPROVE') || l.action.includes('CREATE') || l.action.includes('RESTORE') 
                    ? 'bg-green-50 text-safety-green border border-green-200' 
                    : 'bg-canvas text-ink border border-border'
              }`}>
                {l.action}
              </span>
            )},
            { key: 'entityType', header: 'Object Type', render: (l) => (
              <span className="font-semibold text-xs text-body">{l.objectType || l.entityType}</span>
            )},
            { key: 'entityId', header: 'Reference ID', render: (l) => (
              <span className="font-mono text-xs font-semibold text-ink">{l.objectReference || l.entityId}</span>
            )},
            { key: 'performedBy', header: 'User', render: (l) => (
              <span className="text-xs font-medium text-ink">{l.user || l.performedBy}</span>
            )},
            { key: 'details', header: 'Details / Reason', render: (l) => (
              <span className="text-xs text-body line-clamp-1">{l.details || l.reason || '-'}</span>
            )},
            { key: 'diff', header: '', className: 'text-right', render: (l) => (
              (l.before || l.after) ? (
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(l)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Snapshot
                </Button>
              ) : null
            )}
          ]}
        />
      </div>

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-border flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-canvas">
              <div>
                <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Audit Snapshot Diff: {selectedLog.action}
                </h3>
                <p className="text-xs text-body mt-0.5 font-mono">
                  Target: {selectedLog.objectType} &middot; Ref: {selectedLog.objectReference}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-body hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="bg-canvas p-3 rounded border border-border">
                <div className="text-body">
                  Logged on <strong className="text-ink">{format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss')}</strong> by <strong className="text-ink">{selectedLog.user || selectedLog.performedBy}</strong>
                </div>
                {selectedLog.reason && (
                  <div className="mt-1 text-safety-amber-signal font-semibold">
                    Reason: {selectedLog.reason}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-body uppercase tracking-wider text-[11px] mb-2">Before State</h4>
                  <pre className="p-3 bg-canvas rounded border border-border text-[11px] font-mono overflow-auto max-h-64 text-body">
                    {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : '(None - newly created)'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold text-body uppercase tracking-wider text-[11px] mb-2">After State</h4>
                  <pre className="p-3 bg-canvas rounded border border-border text-[11px] font-mono overflow-auto max-h-64 text-ink font-semibold">
                    {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : '(None - deleted)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-canvas flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
