import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { BaseEntity } from '../types';

export default function TrashBin() {
  const store = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  // Aggregate all soft-deleted entities
  const deletedEntities = React.useMemo(() => {
    const arr: { type: string, storeKey: keyof typeof store, id: string, name: string, deletedAt: string }[] = [];
    
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
            arr.push({
              type: t.label,
              storeKey: t.key,
              id: item.id,
              name: item[t.nameField] || 'Unknown',
              deletedAt: item.deletedAt
            });
          }
        });
      }
    });

    return arr.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }, [store]);

  const handleRestore = (storeKey: keyof typeof store, id: string) => {
    store.restoreEntity(storeKey, id);
    addToast('Item restored successfully.', 'success');
  };

  return (
    <div>
      <PageHeader title="Trash Bin" />
      
      <DataTable 
        data={deletedEntities}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<Trash2 />} title="Trash is empty" description="No deleted items found." />}
        columns={[
          { key: 'type', header: 'Entity Type', className: 'w-48' },
          { key: 'name', header: 'Identifier', render: (item) => <span className="font-mono text-xs">{item.name}</span> },
          { key: 'deletedAt', header: 'Deleted At', render: (item) => format(new Date(item.deletedAt), 'MMM d, yyyy HH:mm') },
          { key: 'actions', header: '', className: 'text-right w-32', render: (item) => (
            <Button variant="secondary" size="sm" onClick={() => handleRestore(item.storeKey, item.id)}>Restore</Button>
          )}
        ]}
      />
    </div>
  )
}
