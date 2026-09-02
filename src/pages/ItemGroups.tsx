import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { Layers, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ItemGroups() {
  const { t, language } = useTranslation();
  const { itemGroups, attributes, softDeleteEntity, saveEntity, ppeItems } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const navigate = useNavigate();

  const filteredItems = React.useMemo(() => {
    return itemGroups.filter(item => {
      const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const isNotDeleted = !item.deletedAt;
      return matchSearch && isNotDeleted;
    });
  }, [itemGroups, search]);

  const handleToggleActive = (item: any) => {
    if (item.active) {
      const inUse = ppeItems.some(p => p.itemGroupId === item.id);
      if (inUse && !window.confirm('This item group is in use by PPE Items. Deactivating it may cause issues. Proceed?')) return;
      saveEntity('itemGroups', { ...item, active: false });
    } else {
      saveEntity('itemGroups', { ...item, active: true });
    }
  };

  const handleDelete = (id: string) => {
    const inUse = ppeItems.some(p => p.itemGroupId === id);
    if (inUse && !window.confirm('This item group is in use by PPE Items. Deleting it will move it to the Trash Bin. Proceed?')) return;
    if (!inUse && !window.confirm('Are you sure you want to delete this item group?')) return;
    softDeleteEntity('itemGroups', id);
  };

  return (
    <div>
      <PageHeader 
        title={t('itemGroups')} 
        action={<Button onClick={() => navigate('/item-groups/new')}><Plus className="w-4 h-4 mr-2" /> Add Item Group</Button>} 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </FilterBar>

      <DataTable 
        data={filteredItems}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<Layers />} title="No item groups found" action={<Button variant="secondary" onClick={() => navigate('/item-groups/new')}>Add Item Group</Button>} />}
        columns={[
          { key: 'code', header: t('code'), className: 'font-mono text-xs' },
          { key: 'name', header: t('name'), render: (item) => (
            <div className="font-medium text-ink">{language === 'en' ? item.nameEn : item.nameAr}</div>
          )},
          { key: 'attributes', header: 'Linked Attributes', render: (item) => (
            <div className="flex gap-1 flex-wrap">
              {item.attributeIds.map((attrId: string) => {
                const attr = attributes.find(a => a.id === attrId);
                return attr ? (
                  <span key={attrId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-canvas border border-border text-body">
                    {language === 'en' ? attr.nameEn : attr.nameAr}
                  </span>
                ) : null;
              })}
            </div>
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/item-groups/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
          )}
        ]}
      />
    </div>
  )
}
