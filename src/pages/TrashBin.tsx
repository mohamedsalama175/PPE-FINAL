import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { Trash2, RotateCcw, AlertOctagon, ShieldCheck, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function TrashBin() {
  const store = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const retentionPeriodDays = store.moduleSettings.trashRetentionDays || 90;

  // Aggregate all soft-deleted entities
  const deletedEntities = React.useMemo(() => {
    const arr: { 
      type: string; 
      storeKey: 'ppeItems' | 'attributes' | 'itemGroups' | 'locations' | 'kits'; 
      id: string; 
      name: string; 
      deletedAt: string;
      daysRemaining: number;
      hasHistory: boolean;
    }[] = [];
    
    const types = [
      { key: 'ppeItems' as const, label: 'PPE Item', nameField: 'itemCode' },
      { key: 'attributes' as const, label: 'Attribute', nameField: 'code' },
      { key: 'itemGroups' as const, label: 'Item Group', nameField: 'code' },
      { key: 'locations' as const, label: 'Location', nameField: 'code' },
      { key: 'kits' as const, label: 'Kit', nameField: 'nameEn' },
    ];

    types.forEach(t => {
      const list = store[t.key] as any[];
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item.deletedAt) {
            const ageDays = differenceInDays(new Date(), new Date(item.deletedAt));
            const daysRemaining = Math.max(0, retentionPeriodDays - ageDays);

            // Check history protection (Rule G10)
            let hasHistory = false;
            if (t.key === 'ppeItems') {
              hasHistory = store.issuances.some(i => i.ppeItemId === item.id) || store.stockMovements.some(m => m.ppeItemId === item.id);
            } else if (t.key === 'locations') {
              hasHistory = store.stockMovements.some(m => m.locationId === item.id || m.toLocationId === item.id) || store.issuances.some(i => i.locationId === item.id);
            } else if (t.key === 'kits') {
              hasHistory = store.issuances.some(i => i.kitId === item.id);
            }

            arr.push({
              type: t.label,
              storeKey: t.key,
              id: item.id,
              name: item[t.nameField] || 'Unknown',
              deletedAt: item.deletedAt,
              daysRemaining,
              hasHistory
            });
          }
        });
      }
    });

    return arr.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }, [store, retentionPeriodDays]);

  const handleRestore = (storeKey: 'ppeItems' | 'attributes' | 'itemGroups' | 'locations' | 'kits', id: string) => {
    const res = store.restoreEntity(storeKey, id);
    if (!res.success) {
      addToast(res.message || 'Cannot restore entity: dependency missing.', 'error');
    } else {
      addToast('Item restored successfully from Trash Bin.', 'success');
    }
  };

  const handlePurgeSingle = (storeKey: 'ppeItems' | 'attributes' | 'itemGroups' | 'locations' | 'kits', id: string) => {
    if (!window.confirm('Permanently delete this record? This action cannot be undone.')) return;
    const res = store.purgeEntity(storeKey, id);
    if (!res.success) {
      addToast(res.message || 'Cannot purge record.', 'error');
    } else {
      addToast('Record permanently purged.', 'success');
    }
  };

  const handlePurgeEligible = () => {
    if (!window.confirm(`Auto-purge all clean records that have exceeded the ${retentionPeriodDays}-day retention period? (Historical records will remain safe per Rule G10).`)) return;
    const res = store.purgeEligibleTrash();
    addToast(`Purged ${res.purgedCount} clean record(s) older than ${retentionPeriodDays} days.`, 'success');
  };

  return (
    <div>
      <PageHeader 
        title="Trash Bin & Data Retention (PPE-048)" 
        subtitle={`Soft-deleted records with 90-day retention countdown and Rule G10 historical protection`}
        actions={
          <Button variant="danger" size="sm" onClick={handlePurgeEligible}>
            <Trash2 className="w-4 h-4 mr-2" /> Auto-Purge Clean Records
          </Button>
        }
      />
      
      <DataTable 
        data={deletedEntities}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<Trash2 />} title="Trash is empty" description="No soft-deleted records found." />}
        columns={[
          { key: 'type', header: 'Entity Type', className: 'w-36 font-semibold', render: (item) => item.type },
          { key: 'name', header: 'Identifier', render: (item) => <span className="font-mono text-xs font-bold text-ink">{item.name}</span> },
          { key: 'deletedAt', header: 'Deleted Date', render: (item) => format(new Date(item.deletedAt), 'yyyy-MM-dd HH:mm') },
          { key: 'retention', header: 'Retention Policy (G10)', render: (item) => (
            item.hasHistory ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-safety-green bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" /> Retained - has history
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-body bg-canvas border border-border px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5" /> {item.daysRemaining} days left
              </span>
            )
          )},
          { key: 'actions', header: '', className: 'text-right w-44', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleRestore(item.storeKey, item.id)}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
              </Button>
              {!item.hasHistory && (
                <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handlePurgeSingle(item.storeKey, item.id)}>
                  Purge
                </Button>
              )}
            </div>
          )}
        ]}
      />
    </div>
  );
}
