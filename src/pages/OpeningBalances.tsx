import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Plus, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

export default function OpeningBalances() {
  const navigate = useNavigate();
  const { openingBalances, locations } = useStore();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Opening Balances" 
        description="Manage initial physical inventory counts per location."
        actions={
          <Button onClick={() => navigate('/stock/opening-balances/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Record Opening Balance
          </Button>
        }
      />
      
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <DataTable
          data={openingBalances}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center text-body">
              <ClipboardList className="w-12 h-12 mb-4 text-border" />
              <h3 className="text-lg font-medium text-ink mb-1">No opening balances found</h3>
              <p className="text-sm">Record an opening balance to initialize your inventory.</p>
            </div>
          }
          columns={[
            {
              key: 'location',
              header: 'Location',
              render: (row: any) => {
                const loc = locations.find(l => l.id === row.locationId);
                return loc ? `${loc.code} - ${loc.nameEn}` : 'Unknown';
              }
            },
            {
              key: 'referenceDate',
              header: 'Reference Date',
              render: (row: any) => format(new Date(row.referenceDate), 'dd MMM yyyy')
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
              key: 'lines',
              header: 'Items',
              render: (row: any) => row.lines.length
            },
            {
              key: 'createdAt',
              header: 'Created At',
              render: (row: any) => format(new Date(row.createdAt), 'dd MMM yyyy HH:mm')
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (row: any) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/stock/opening-balances/${row.id}`)}>
                    View / Edit
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
