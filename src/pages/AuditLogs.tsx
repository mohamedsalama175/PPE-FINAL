import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';

export default function AuditLogs() {
  const { auditLogs, employees } = usePPEStore();

  const sortedLogs = React.useMemo(() => {
    return [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Audit Logs" subtitle="7-year compliance history of all state transitions" />
      
      <div className="flex-1 bg-surface border border-border rounded-sm overflow-hidden flex flex-col">
        <DataTable
          data={sortedLogs}
          keyExtractor={(log) => log.id}
          emptyState={<EmptyState icon={<ShieldAlert />} title="No audit logs available" />}
          columns={[
            { key: 'timestamp', header: 'Timestamp', render: (l) => format(new Date(l.timestamp), 'MMM d, yyyy HH:mm:ss') },
            { key: 'entityType', header: 'Entity Type', render: (l) => l.entityType },
            { key: 'entityId', header: 'Entity ID', render: (l) => <span className="font-mono text-xs">{l.entityId}</span> },
            { key: 'action', header: 'Action', render: (l) => l.action },
            { key: 'details', header: 'Details', render: (l) => l.details || '-' },
            { key: 'performedBy', header: 'Performed By', render: (l) => {
              const emp = employees.find(e => e.id === l.performedBy);
              return emp ? emp.name : l.performedBy;
            }}
          ]}
        />
      </div>
    </div>
  );
}
