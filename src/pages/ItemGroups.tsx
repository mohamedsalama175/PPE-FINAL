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
import { ItemGroupDetailModal } from '../components/modals/ItemGroupDetailModal';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { Layers, Plus, Eye, ShieldCheck } from 'lucide-react';
import { ItemGroup } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ItemGroups() {
  const { t, language } = useTranslation();
  const { itemGroups, attributes, softDeleteEntity, toggleEntityActive, checkInUse } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<ItemGroup | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<{ group: ItemGroup; action: 'delete' | 'deactivate'; reasons: string[] } | null>(null);

  const addToast = useToastStore(s => s.addToast);
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

  const handleToggleActive = (item: ItemGroup) => {
    if (item.active) {
      const check = checkInUse('itemGroups', item.id);
      if (check.inUse) {
        setOverrideTarget({ group: item, action: 'deactivate', reasons: check.reasons });
        return;
      }
      const res = toggleEntityActive('itemGroups', item.id, false);
      if (!res.success) addToast(res.message || 'Error deactivating group.', 'error');
      else addToast('Item Group deactivated.', 'success');
    } else {
      toggleEntityActive('itemGroups', item.id, true);
      addToast('Item Group activated.', 'success');
    }
  };

  const handleDelete = (item: ItemGroup) => {
    const check = checkInUse('itemGroups', item.id);
    if (check.inUse) {
      setOverrideTarget({ group: item, action: 'delete', reasons: check.reasons });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete item group ${item.code}?`)) return;
    const res = softDeleteEntity('itemGroups', item.id);
    if (!res.success) addToast(res.message || 'Error deleting item group.', 'error');
    else addToast('Item Group moved to Trash Bin.', 'success');
  };

  const handleOverrideConfirm = (reason: string) => {
    if (!overrideTarget) return;
    const { group, action } = overrideTarget;
    if (action === 'delete') {
      const res = softDeleteEntity('itemGroups', group.id, reason);
      if (res.success) addToast('Item Group deleted with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    } else {
      const res = toggleEntityActive('itemGroups', group.id, false, reason);
      if (res.success) addToast('Item Group deactivated with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    }
    setOverrideTarget(null);
  };

  return (
    <div>
      <PageHeader 
        title={t('itemGroups')} 
        subtitle="Organize equipment by body protection zone and attach variant attributes"
        actions={<Button onClick={() => navigate('/item-groups/new')}><Plus className="w-4 h-4 mr-2" /> Add Item Group</Button>} 
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
          { key: 'code', header: t('code'), render: (item) => (
            <span 
              onClick={() => setSelectedGroup(item)}
              className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
            >
              {item.code}
            </span>
          )},
          { key: 'name', header: t('name'), render: (item) => (
            <div 
              onClick={() => setSelectedGroup(item)}
              className="font-medium text-ink cursor-pointer hover:underline"
            >
              {language === 'en' ? item.nameEn : item.nameAr}
            </div>
          )},
          { key: 'attributes', header: 'Linked Attributes', render: (item) => (
            <div className="flex gap-1 flex-wrap">
              {item.attributeIds.map((attrId: string) => {
                const attr = attributes.find(a => a.id === attrId);
                return attr ? (
                  <span key={attrId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-canvas border border-border text-body">
                    {language === 'en' ? attr.nameEn : attr.nameAr}
                  </span>
                ) : null;
              })}
            </div>
          )},
          { key: 'genderMatch', header: 'Gender Matching (G4)', render: (item) => (
            item.requiresGenderMatch ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-safety-green bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" /> Enforced
              </span>
            ) : (
              <span className="text-[11px] text-body">Unisex Permitted</span>
            )
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setSelectedGroup(item)} title="View Details (PPE-016)">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/item-groups/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item)}>Delete</Button>
            </div>
          )}
        ]}
      />

      {/* PPE-016 Item Group Details Modal */}
      <ItemGroupDetailModal 
        itemGroup={selectedGroup} 
        onClose={() => setSelectedGroup(null)} 
        onEdit={(grp) => {
          setSelectedGroup(null);
          navigate(`/item-groups/${grp.id}/edit`);
        }}
      />

      {/* G2 In-Use Protection Override Modal */}
      <OverrideModal 
        isOpen={!!overrideTarget}
        entityName={overrideTarget?.group.code || ''}
        reasons={overrideTarget?.reasons || []}
        actionLabel={overrideTarget?.action === 'delete' ? 'Override and Delete' : 'Override and Deactivate'}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
    </div>
  );
}
