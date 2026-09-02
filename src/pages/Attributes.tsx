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
import { Tags, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Attributes() {
  const { t, language } = useTranslation();
  const { attributes, softDeleteEntity, saveEntity, ppeItems, itemGroups } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const navigate = useNavigate();

  const filteredItems = React.useMemo(() => {
    return attributes.filter(item => {
      const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const isNotDeleted = !item.deletedAt;
      return matchSearch && isNotDeleted;
    });
  }, [attributes, search]);

  const handleToggleActive = (item: any) => {
    if (item.active) {
      // Check if in use
      const inUse = itemGroups.some(g => g.attributeIds.includes(item.id));
      if (inUse && !window.confirm('This attribute is in use by Item Groups. Deactivating it may cause issues. Proceed?')) return;
      saveEntity('attributes', { ...item, active: false });
    } else {
      saveEntity('attributes', { ...item, active: true });
    }
  };

  const handleDelete = (id: string) => {
    const inUse = itemGroups.some(g => g.attributeIds.includes(id));
    if (inUse && !window.confirm('This attribute is in use by Item Groups. Deleting it will move it to the Trash Bin. Proceed?')) return;
    if (!inUse && !window.confirm('Are you sure you want to delete this attribute?')) return;
    softDeleteEntity('attributes', id);
  };

  return (
    <div>
      <PageHeader 
        title={t('attributes')} 
        action={<Button onClick={() => navigate('/attributes/new')}><Plus className="w-4 h-4 mr-2" /> Add Attribute</Button>} 
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
        emptyState={<EmptyState icon={<Tags />} title="No attributes found" action={<Button variant="secondary" onClick={() => navigate('/attributes/new')}>Add Attribute</Button>} />}
        columns={[
          { key: 'code', header: t('code'), className: 'font-mono text-xs' },
          { key: 'name', header: t('name'), render: (item) => (
            <div className="font-medium text-ink">{language === 'en' ? item.nameEn : item.nameAr}</div>
          )},
          { key: 'values', header: 'Values', render: (item) => (
            <div className="flex gap-1 flex-wrap">
              {item.values.slice(0, 3).map((v: any) => (
                <span key={v.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-canvas border border-border text-body">
                  {v.value}
                </span>
              ))}
              {item.values.length > 3 && <span className="text-xs text-body">+{item.values.length - 3}</span>}
            </div>
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/attributes/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
          )}
        ]}
      />
    </div>
  )
}
