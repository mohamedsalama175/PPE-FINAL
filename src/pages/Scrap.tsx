import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { useSwal } from '../lib/useSwal';
import { Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function Scrap() {
  const { t, language } = useTranslation();
  const { scrapEntries, currentUser, reverseScrap, ppeItems, locations } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const { showDeleteReason } = useSwal();

  const canReverse = ['Admin', 'HSE Supervisor'].includes(currentUser.role);
  const REVERSAL_WINDOW_DAYS = 7;

  const handleReverse = async (id: string, createdAt: string) => {
    const daysSinceScrap = differenceInDays(new Date(), new Date(createdAt));
    if (daysSinceScrap > REVERSAL_WINDOW_DAYS) {
      addToast(`Cannot reverse scrap entries older than ${REVERSAL_WINDOW_DAYS} days.`, 'error');
      return;
    }

    const reason = await showDeleteReason(
      "Reverse Scrap Entry",
      "Please enter the operational reason for reversal (minimum 5 characters)..."
    );
    if (!reason) {
      addToast('A reason is required to reverse a scrap entry.', 'error');
      return;
    }

    reverseScrap(id, reason);
    addToast('Scrap entry reversed, stock restored.', 'success');
  };

  const sortedScraps = React.useMemo(() => {
    return [...scrapEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scrapEntries]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader title={t('scrapAndReturns')} subtitle={`Reverse window: ${REVERSAL_WINDOW_DAYS} days`} />
      
      <ContainerCard noPadding className="flex-1 overflow-hidden">
        <DataTable 
          data={sortedScraps}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Trash2 />} title="No scrap entries found" />}
          columns={[
            { key: 'date', header: 'Date', render: (s) => format(new Date(s.createdAt), 'MMM d, yyyy') },
            { key: 'item', header: 'Item', render: (s) => {
              const item = ppeItems.find(p => p.id === s.ppeItemId);
              return item ? (language === 'en' ? item.nameEn : item.nameAr) : s.ppeItemId;
            }},
            { key: 'location', header: 'Location', render: (s) => {
              const loc = locations.find(l => l.id === s.locationId);
              return loc ? loc.nameEn : s.locationId;
            }},
            { key: 'qty', header: 'Qty', className: 'font-mono', render: (s) => s.quantity },
            { key: 'reason', header: 'Reason', render: (s) => s.reason },
            { key: 'status', header: 'Status', render: (s) => (
               s.reversed ? (
                 <div className="flex flex-col gap-0.5">
                   <StatusBadge status="neutral" label="Reversed" size="sm" icon={false} />
                   {s.reversalReason && (
                     <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={s.reversalReason}>
                       {s.reversalReason}
                     </span>
                   )}
                 </div>
               ) : (
                 <StatusBadge status="danger" label="Scrapped" size="sm" />
               )
            )},
            { key: 'actions', header: '', align: 'right', className: 'text-end', render: (s) => {
              if (!s.reversed && canReverse) {
                const daysSinceScrap = differenceInDays(new Date(), new Date(s.createdAt));
                const isWithinWindow = daysSinceScrap <= REVERSAL_WINDOW_DAYS;
                
                return (
                  <Button 
                    variant="outline" 
                    color="secondary"
                    size="sm" 
                    disabled={!isWithinWindow}
                    onClick={() => handleReverse(s.id, s.createdAt)}
                    title={!isWithinWindow ? `Cannot reverse after ${REVERSAL_WINDOW_DAYS} days` : ''}
                  >
                    {t('reverse')}
                  </Button>
                );
              }
              return null;
            }}
          ]}
        />
      </ContainerCard>
    </div>
  );
}
