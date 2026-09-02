import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { JsonDiffViewer } from '../components/ui/JsonDiffViewer';
import { ContainerCard } from '../components/ui/ContainerCard';
import { useSwal } from '../lib/useSwal';
import { 
  ShieldCheck, Download, Eye, Clock, ShieldAlert, 
  Search, Calendar, Filter, FileText, Lock 
} from 'lucide-react';
import { format } from 'date-fns';
import { AuditLog } from '../types';

export default function AuditLogs() {
  const { t, language } = useTranslation();
  const { showToast } = useSwal();
  const { auditLogs, currentUser } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [objectTypeFilter, setObjectTypeFilter] = React.useState('all');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  const filteredLogs = React.useMemo(() => {
    return auditLogs
      .filter(log => {
        if (objectTypeFilter !== 'all' && log.objectType !== objectTypeFilter) return false;
        if (actionFilter !== 'all' && log.action !== actionFilter) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchRef = (log.objectReference || '').toLowerCase().includes(q);
          const matchUser = (log.user || '').toLowerCase().includes(q);
          const matchReason = (log.reason || '').toLowerCase().includes(q);
          const matchAction = (log.action || '').toLowerCase().includes(q);
          if (!matchRef && !matchUser && !matchReason && !matchAction) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestampUTC).getTime() - new Date(a.timestampUTC).getTime());
  }, [auditLogs, objectTypeFilter, actionFilter, search]);

  const uniqueObjectTypes = React.useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.objectType))).filter(Boolean);
  }, [auditLogs]);

  const uniqueActions = React.useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.action))).filter(Boolean);
  }, [auditLogs]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp (UTC)', 'User', 'Role', 'Object Type', 'Object Reference', 'Action', 'Reason', 'Source', 'Retention'];
    const csvRows = filteredLogs.map(l => [
      `"${l.id}"`,
 `"${l.timestampUTC}"`,
 `"${l.user}"`,
 `"${l.role}"`,
 `"${l.objectType}"`,
 `"${l.objectReference}"`,
 `"${l.action}"`,
 `"${(l.reason || '').replace(/"/g, '""')}"`,
 `"${l.source}"`,
 `"${l.retentionFlag}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Audit log export downloaded successfully.', 'info');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Immutable Audit Log (NEW-05)"
        subtitle="Cryptographically sealed, 7-year retention audit trail with full before/after JSON delta inspection"
        action={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-200 ">
              <Lock className="w-3.5 h-3.5 text-emerald-600 " /> 7-Year Retention Flag
            </span>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 me-1.5" /> Export Audit Log (.csv)
            </Button>
          </div>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search reference, user, or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 text-xs"
          />

          <Select
            value={objectTypeFilter}
            onChange={e => setObjectTypeFilter(e.target.value)}
            className="w-44 text-xs"
          >
            <option value="all">All Object Types</option>
            {uniqueObjectTypes.map(ot => (
              <option key={ot} value={ot}>
                {ot}
              </option>
            ))}
          </Select>

          <Select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-48 text-xs"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredLogs}
          keyExtractor={item => item.id}
          emptyState={<EmptyState icon={<ShieldAlert />} title="No audit entries found" />}
          columns={[
            {
              key: 'timestampUTC',
              header: 'Timestamp (UTC)',
              render: l => (
                <div className="text-xs">
                  <span className="font-mono font-medium text-slate-800 ">
                    {format(new Date(l.timestampUTC), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">UTC</span>
                </div>
              )
            },
            {
              key: 'user',
              header: 'Actor',
              render: l => (
                <div>
                  <span className="font-semibold text-slate-800 text-xs">{l.user}</span>
                  <span className="text-[10px] text-slate-500 block">Role: {l.role}</span>
                </div>
              )
            },
            {
              key: 'objectType',
              header: 'Object Type',
              render: l => (
                <span className="font-semibold text-slate-700 text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 ">
                  {l.objectType}
                </span>
              )
            },
            {
              key: 'objectReference',
              header: 'Reference',
              render: l => <span className="font-mono text-xs font-bold text-slate-900 ">{l.objectReference}</span>
            },
            {
              key: 'action',
              header: 'Action',
              render: l => (
                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  {l.action}
                </span>
              )
            },
            {
              key: 'source',
              header: 'Source',
              render: l => (
                <span className="text-[11px] font-medium text-slate-600 ">
                  {l.source}
                </span>
              )
            },
            {
              key: 'reason',
              header: 'Reason / Note',
              render: l => (
                <div className="max-w-[200px] text-xs text-slate-600 truncate" title={l.reason}>
                  {l.reason || '—'}
                </div>
              )
            },
            {
              key: 'actions',
              header: '',
              className: 'text-end',
              render: l => (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedLog(l)}
                >
                  <Eye className="w-3.5 h-3.5 me-1" /> Inspect Delta
                </Button>
              )
            }
          ]}
        />
      </ContainerCard>

      {/* Side-by-side JSON Diff Drawer (NEW-05) */}
      <JsonDiffViewer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
