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
import { AttributeDetailModal } from '../components/modals/AttributeDetailModal';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { Tags, Plus, Eye } from 'lucide-react';
import { Attribute } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Attributes() {
  const { t, language } = useTranslation();
  const { attributes, softDeleteEntity, toggleEntityActive, checkInUse } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const [selectedAttribute, setSelectedAttribute] = React.useState<Attribute | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<{ attribute: Attribute; action: 'delete' | 'deactivate'; reasons: string[] } | null>(null);
  
  const addToast = useToastStore(s => s.addToast);
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

  const handleToggleActive = (item: Attribute) => {
    if (item.active) {
      const check = checkInUse('attributes', item.id);
      if (check.inUse) {
        setOverrideTarget({ attribute: item, action: 'deactivate', reasons: check.reasons });
        return;
      }
      const res = toggleEntityActive('attributes', item.id, false);
      if (!res.success) addToast(res.message || 'Error deactivating attribute.', 'error');
      else addToast('Attribute deactivated.', 'success');
    } else {
      toggleEntityActive('attributes', item.id, true);
      addToast('Attribute activated.', 'success');
    }
  };

  const handleDelete = (item: Attribute) => {
    const check = checkInUse('attributes', item.id);
    if (check.inUse) {
      setOverrideTarget({ attribute: item, action: 'delete', reasons: check.reasons });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete attribute ${item.code}?`)) return;
    const res = softDeleteEntity('attributes', item.id);
    if (!res.success) addToast(res.message || 'Error deleting attribute.', 'error');
    else addToast('Attribute moved to Trash Bin.', 'success');
  };

  const handleOverrideConfirm = (reason: string) => {
    if (!overrideTarget) return;
    const { attribute, action } = overrideTarget;
    if (action === 'delete') {
      const res = softDeleteEntity('attributes', attribute.id, reason);
      if (res.success) addToast('Attribute deleted with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    } else {
      const res = toggleEntityActive('attributes', attribute.id, false, reason);
      if (res.success) addToast('Attribute deactivated with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    }
    setOverrideTarget(null);
  };

  return (
    <div>
      <PageHeader 
        title={t('attributes')} 
        subtitle="Manage dimensional attributes (sizes, colors, filters) and ordered values"
        actions={<Button onClick={() => navigate('/attributes/new')}><Plus className="w-4 h-4 mr-2" /> Add Attribute</Button>} 
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
          { key: 'code', header: t('code'), render: (item) => (
            <span 
              onClick={() => setSelectedAttribute(item)}
              className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
            >
              {item.code}
            </span>
          )},
          { key: 'name', header: t('name'), render: (item) => (
            <div 
              onClick={() => setSelectedAttribute(item)}
              className="font-medium text-ink cursor-pointer hover:underline"
            >
              {language === 'en' ? item.nameEn : item.nameAr}
            </div>
          )},
          { key: 'values', header: 'Values (PPE-008)', render: (item) => (
            <div className="flex gap-1 flex-wrap">
              {item.values.slice(0, 4).map((v) => (
                <span key={v.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-canvas border border-border text-body">
                  {v.value}
                </span>
              ))}
              {item.values.length > 4 && (
                <span className="text-xs text-body font-semibold">+{item.values.length - 4} more</span>
              )}
            </div>
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setSelectedAttribute(item)} title="View Details (PPE-011)">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/attributes/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item)}>Delete</Button>
            </div>
          )}
        ]}
      />

      {/* PPE-011 Attribute Details Modal */}
      <AttributeDetailModal 
        attribute={selectedAttribute} 
        onClose={() => setSelectedAttribute(null)} 
        onEdit={(attr) => {
          setSelectedAttribute(null);
          navigate(`/attributes/${attr.id}/edit`);
        }}
      />

      {/* G2 In-Use Protection Override Modal */}
      <OverrideModal 
        isOpen={!!overrideTarget}
        entityName={overrideTarget?.attribute.code || ''}
        reasons={overrideTarget?.reasons || []}
        actionLabel={overrideTarget?.action === 'delete' ? 'Override and Delete' : 'Override and Deactivate'}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
    </div>
  );
}
