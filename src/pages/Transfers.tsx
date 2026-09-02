import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ArrowRightLeft, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Transfers() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { auditLogs, locations, ppeItems } = usePPEStore();

  // Filter transfer logs from immutable audit log
  const transferLogs = React.useMemo(() => {
    return auditLogs.filter(a => a.action === 'STOCK_TRANSFERRED');
  }, [auditLogs]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Transfers Between Warehouses (BD-I464)"
        subtitle="Inter-facility stock movement adhering strictly to condition routing rules (Used->New blocked, New->Used allowed)"
        action={
          <Button size="sm" onClick={() => navigate('/stock/transfers/new')}>
            <Plus className="w-3.5 h-3.5 me-1.5" /> Transfer Stock
          </Button>
        }
      />

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={transferLogs}
          keyExtractor={(item) => item.id}
          emptyState={
            <EmptyState 
              icon={<ArrowRightLeft className="w-8 h-8 text-slate-400" />} 
              title="No transfer transactions recorded" 
              description="Initiate a new transfer between your assigned warehouse locations."
            />
          }
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              className: 'w-36 font-mono font-bold text-xs text-slate-900 ',
              render: (log) => log.objectReference
            },
            {
              key: 'timestamp',
              header: 'Timestamp (UTC)',
              className: 'w-44 font-mono text-xs text-slate-500 ',
              render: (log) => format(new Date(log.timestampUTC), 'yyyy-MM-dd HH:mm:ss')
            },
            {
              key: 'route',
              header: 'From Facility → To Facility',
              render: (log) => (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-800 ">{log.beforeValues?.from}</span>
                  <span className="text-slate-400 ">→</span>
                  <span className="font-semibold text-slate-800 ">{log.afterValues?.to}</span>
                  {log.afterValues?.newCondition === 'Reused' && (
                    <StatusBadge status="info" size="sm" label="Reused Pool" />
                  )}
                  {log.afterValues?.overcapacityWarning && (
                    <StatusBadge status="warning" size="sm" label="Overcapacity" />
                  )}
                </div>
              )
            },
            {
              key: 'details',
              header: 'Batch & Quantity',
              className: 'w-48 font-mono text-xs',
              render: (log) => (
                <div>
                  <span className="font-bold text-slate-900 ">{log.beforeValues?.qty} units</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Batch: {log.beforeValues?.batch}
                  </span>
                </div>
              )
            },
            {
              key: 'actor',
              header: 'Transferred By',
              className: 'w-40 text-xs text-slate-600 ',
              render: (log) => log.user
            }
          ]}
        />
      </ContainerCard>
    </div>
  );
}
