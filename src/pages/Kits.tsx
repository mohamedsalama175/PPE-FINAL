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
import { Briefcase, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Kits() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { kits, jobPositions, ppeItems, softDeleteEntity } = usePPEStore();
  const [search, setSearch] = React.useState('');

  const filteredItems = React.useMemo(() => {
    return kits.filter(item => {
      const matchSearch = item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const isNotDeleted = !item.deletedAt;
      return matchSearch && isNotDeleted;
    });
  }, [kits, search]);

  return (
    <div>
      <PageHeader 
        title={t('kits')} 
        action={<Button onClick={() => navigate('/kits/new')}><Plus className="w-4 h-4 mr-2" /> Add Kit</Button>} 
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
            <div className="font-medium text-ink">{language === 'en' ? item.nameEn : item.nameAr}</div>
          )},
          { key: 'jobPosition', header: 'Job Position', render: (item) => {
            const jp = jobPositions.find(j => j.id === item.jobPositionId);
            return jp ? (language === 'en' ? jp.nameEn : jp.nameAr) : '-';
          }},
          { key: 'items', header: 'Items Count', render: (item) => item.items.length },
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => {}} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/kits/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => softDeleteEntity('kits', item.id)}>Delete</Button>
            </div>
          )}
        ]}
      />
    </div>
  )
}
