import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Plus, ClipboardList, Lock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function OpeningBalances() {
  const navigate = useNavigate();
  const { openingBalances, locations } = useStore();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Opening Balances (PPE-024)" 
        description="Physical stock count on go-live per location. Once completed, locations are locked and modifications use adjustments."
        actions={
          <Button onClick={() => navigate('/stock/opening-balances/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Record Opening Balance
          </Button>
        }
      />

      {/* Location Status Chips (PPE-024) */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-3">Warehouse Opening Count Status (PPE-024)</h4>
        <div className="flex flex-wrap gap-2">
          {locations.filter(l => l.stockCondition !== 'Scrap').map(loc => (
            <div 
              key={loc.id} 
              className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
                loc.openingBalanceClosed 
                  ? 'bg-canvas text-body border-border' 
                  : 'bg-green-50 text-safety-green border-green-200 font-semibold'
              }`}
            >
              <span className="font-mono">{loc.code}</span>
              <span>{loc.name}</span>
              {loc.openingBalanceClosed ? (
                <span className="inline-flex items-center text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-bold">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Closed
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] bg-green-200 text-green-900 px-1.5 py-0.2 rounded font-bold">
                  Open
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <DataTable
          data={openingBalances}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center text-body">
              <ClipboardList className="w-12 h-12 mb-4 text-border" />
              <h3 className="text-lg font-medium text-ink mb-1">No opening balances recorded</h3>
              <p className="text-xs">Record an opening balance to initialize your warehouse inventory.</p>
            </div>
          }
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              render: (row: any) => (
                <span className="font-mono text-xs font-bold text-ink">
                  {row.reference || row.id}
                </span>
              )
            },
            {
              key: 'location',
              header: 'Location',
              render: (row: any) => {
                const loc = locations.find(l => l.id === row.locationId);
                return (
                  <div>
                    <div className="font-semibold text-ink text-xs">{loc?.name || 'Unknown'}</div>
                    <div className="text-[10px] font-mono text-body">{loc?.code} &middot; {loc?.stockCondition}</div>
                  </div>
                );
              }
            },
            {
              key: 'referenceDate',
              header: 'Count Date',
              render: (row: any) => <span className="text-xs font-mono">{format(new Date(row.referenceDate), 'yyyy-MM-dd')}</span>
            },
            {
              key: 'lines',
              header: 'Line Items',
              render: (row: any) => <span className="font-bold text-xs">{row.lines.length} items</span>
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: any) => {
                let variant: any = 'neutral';
                if (row.status === 'Approved') variant = 'success';
                if (row.status === 'Pending Approval') variant = 'warning';
                if (row.status === 'Rejected') variant = 'error';
                return <StatusBadge status={variant} label={row.status} />;
              }
            },
            {
              key: 'createdAt',
              header: 'Submitted',
              render: (row: any) => <span className="text-xs text-body font-mono">{format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm')}</span>
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (row: any) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/stock/opening-balances/${row.id}`)}>
                    View / Details
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
