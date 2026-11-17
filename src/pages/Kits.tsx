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
import { KitDetailModal } from '../components/modals/KitDetailModal';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { Briefcase, Plus, Eye, Send } from 'lucide-react';
import { Kit } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Kits() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { kits, jobPositions, softDeleteEntity, toggleEntityActive, checkInUse } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const [selectedKit, setSelectedKit] = React.useState<Kit | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<{ kit: Kit; action: 'delete' | 'deactivate'; reasons: string[] } | null>(null);

  const addToast = useToastStore(s => s.addToast);

  const filteredItems = React.useMemo(() => {
    return kits.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const isNotDeleted = !item.deletedAt;
      return matchSearch && isNotDeleted;
    });
  }, [kits, search]);

  const handleToggleActive = (item: Kit) => {
    if (item.active) {
      const check = checkInUse('kits', item.id);
      if (check.inUse) {
        setOverrideTarget({ kit: item, action: 'deactivate', reasons: check.reasons });
        return;
      }
      const res = toggleEntityActive('kits', item.id, false);
      if (!res.success) addToast(res.message || 'Error deactivating kit.', 'error');
      else addToast('Kit deactivated.', 'success');
    } else {
      toggleEntityActive('kits', item.id, true);
      addToast('Kit activated.', 'success');
    }
  };

  const handleDelete = (item: Kit) => {
    const check = checkInUse('kits', item.id);
    if (check.inUse) {
      setOverrideTarget({ kit: item, action: 'delete', reasons: check.reasons });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete kit ${item.name}?`)) return;
    const res = softDeleteEntity('kits', item.id);
    if (!res.success) addToast(res.message || 'Error deleting kit.', 'error');
    else addToast('Kit moved to Trash Bin.', 'success');
  };

  const handleOverrideConfirm = (reason: string) => {
    if (!overrideTarget) return;
    const { kit, action } = overrideTarget;
    if (action === 'delete') {
      const res = softDeleteEntity('kits', kit.id, reason);
      if (res.success) addToast('Kit deleted with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    } else {
      const res = toggleEntityActive('kits', kit.id, false, reason);
      if (res.success) addToast('Kit deactivated with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    }
    setOverrideTarget(null);
  };

  return (
    <div>
      <PageHeader 
        title={t('kits')} 
        subtitle="Standardized bundles of safety gear matched to employee job positions"
        actions={<Button onClick={() => navigate('/kits/new')}><Plus className="w-4 h-4 mr-2" /> Add Kit</Button>} 
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
        emptyState={<EmptyState icon={<Briefcase />} title="No kits found" action={<Button variant="secondary" onClick={() => navigate('/kits/new')}>Add Kit</Button>} />}
        columns={[
          { key: 'name', header: t('name'), render: (item) => (
            <div 
              onClick={() => setSelectedKit(item)}
              className="font-medium text-ink cursor-pointer hover:underline"
            >
              {item.name}
            </div>
          )},
          { key: 'jobPosition', header: 'Job Position', render: (item) => {
            const jp = jobPositions.find(j => j.id === item.jobPositionId);
            return jp ? (
              <span className="font-semibold text-accent">
                {jp.name}
              </span>
            ) : '-';
          }},
          { key: 'items', header: 'Items Count', render: (item) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-canvas border border-border">
              {item.items.length} items
            </span>
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-1.5">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate(`/issuances/new-kit?kitId=${item.id}`)}
                title="Issue Kit to Employee"
              >
                <Send className="w-3.5 h-3.5 mr-1 text-accent" /> Issue
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedKit(item)} title="View Details (PPE-032)">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/kits/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item)}>Delete</Button>
            </div>
          )}
        ]}
      />

      {/* PPE-032 Kit Details Modal */}
      <KitDetailModal 
        kit={selectedKit} 
        onClose={() => setSelectedKit(null)} 
        onEdit={(k) => {
          setSelectedKit(null);
          navigate(`/kits/${k.id}/edit`);
        }}
      />

      {/* G2 In-Use Protection Override Modal */}
      <OverrideModal 
        isOpen={!!overrideTarget}
        entityName={overrideTarget?.kit.name || ''}
        reasons={overrideTarget?.reasons || []}
        actionLabel={overrideTarget?.action === 'delete' ? 'Override and Delete' : 'Override and Deactivate'}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
    </div>
  );
}
