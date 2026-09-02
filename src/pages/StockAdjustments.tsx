import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { useToastStore } from '../store/toastStore';
import { ClipboardList, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { StockAdjustment } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function StockAdjustments() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { stockAdjustments, ppeItems, locations, currentUser, reviewAdjustment } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  
  const [statusFilter, setStatusFilter] = React.useState(initialFilter || 'all');

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? usePPEStore.getState().locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper]);

  const filteredAdjustments = React.useMemo(() => {
    return stockAdjustments.filter(a => {
      if (isStoreKeeper && !myLocations.includes(a.locationId)) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockAdjustments, isStoreKeeper, myLocations, statusFilter]);

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    reviewAdjustment(id, status, currentUser.id);
    addToast(`Adjustment ${status}.`, 'success');
  };

  const canApprove = ['Admin', 'HSE Supervisor'].includes(currentUser.role);

  return (
    <div>
      <PageHeader 
        title={t('adjustments')} 
        action={<Button onClick={() => navigate('/stock/adjustments/new')}><Plus className="w-4 h-4 mr-2" /> New Adjustment</Button>} 
      />
      
      <FilterBar>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-48">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="applied">Applied Directly</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={filteredAdjustments}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<ClipboardList />} title="No adjustments found" />}
        columns={[
          { key: 'reference', header: 'Reference', render: (a) => <span className="font-mono text-xs">{a.reference}</span> },
          { key: 'date', header: 'Date', render: (a) => format(new Date(a.createdAt), 'MMM d, yyyy') },
          { key: 'type', header: 'Type', render: (a) => (
            <StatusBadge 
              status={a.type === 'IN' ? 'success' : 'error'} 
              label={a.type} 
              icon={false}
            />
          )},
          { key: 'item', header: 'Item', render: (a) => {
            const item = ppeItems.find(i => i.id === a.ppeItemId);
            return item ? (language === 'en' ? item.nameEn : item.nameAr) : a.ppeItemId;
          }},
          { key: 'location', header: 'Location', render: (a) => {
            const loc = locations.find(l => l.id === a.locationId);
            return loc ? (language === 'en' ? loc.nameEn : loc.nameAr) : a.locationId;
          }},
          { key: 'batch', header: 'Batch', render: (a) => a.batchNumber },
          { key: 'qty', header: 'Delta', render: (a) => (
            <span className={a.quantityDelta > 0 ? 'text-safety-green font-medium' : 'text-safety-red font-medium'}>
              {a.quantityDelta > 0 ? '+' : ''}{a.quantityDelta}
            </span>
          )},
          { key: 'reason', header: 'Reason', render: (a) => (
            <div>
              <div className="font-medium">{a.reasonCategory}</div>
              <div className="text-xs text-body truncate max-w-[150px]" title={a.reason}>{a.reason}</div>
            </div>
          )},
          { key: 'status', header: 'Status', render: (a) => (
            <StatusBadge 
              status={a.status === 'approved' || a.status === 'applied' ? 'success' : a.status === 'rejected' ? 'error' : 'warning'} 
              label={a.status === 'applied' ? 'Applied' : t(a.status as any)} 
            />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (a) => {
            if (a.status === 'pending' && canApprove) {
              return (
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleReview(a.id, 'rejected')}>{t('reject')}</Button>
                  <Button variant="primary" size="sm" onClick={() => handleReview(a.id, 'approved')}>{t('approve')}</Button>
                </div>
              )
            }
            return null;
          }}
        ]}
      />
    </div>
  )
}
