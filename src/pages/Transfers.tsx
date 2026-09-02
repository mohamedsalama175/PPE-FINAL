import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/useTranslation';

export default function Transfers() {
  const navigate = useNavigate();
  const { stockMovements, ppeItems, locations } = usePPEStore();
  const { language } = useTranslation();

  const transfers = React.useMemo(() => {
    return stockMovements
      .filter(m => m.type === 'transfer')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockMovements]);
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Stock Transfers"
        actions={
          <Button onClick={() => navigate('/stock/transfers/new')} icon={<Plus />}>
            New Transfer
          </Button>
        }
      />
      
      <DataTable 
        data={transfers}
        keyExtractor={t => t.id}
        emptyState={<EmptyState icon={<ArrowRightLeft />} title="No transfers found" />}
        columns={[
          { key: 'reference', header: 'Reference', render: (t) => <span className="font-mono text-xs">{t.reference}</span> },
          { key: 'date', header: 'Date', render: (t) => format(new Date(t.createdAt), 'MMM d, yyyy') },
          { key: 'item', header: 'Item', render: (t) => {
            const item = ppeItems.find(i => i.id === t.ppeItemId);
            return item ? (language === 'en' ? item.nameEn : item.nameAr) : t.ppeItemId;
          }},
          { key: 'from', header: 'From Location', render: (t) => {
            const loc = locations.find(l => l.id === t.locationId);
            return loc ? (language === 'en' ? loc.nameEn : loc.nameAr) : t.locationId;
          }},
          { key: 'to', header: 'To Location', render: (t) => {
            const loc = locations.find(l => l.id === t.toLocationId);
            return loc ? (language === 'en' ? loc.nameEn : loc.nameAr) : t.toLocationId || '-';
          }},
          { key: 'qty', header: 'Quantity', render: (t) => t.quantity },
          { key: 'status', header: 'Status', render: () => <StatusBadge status="success" label="Completed" /> }
        ]}
      />
    </div>
  )
}
