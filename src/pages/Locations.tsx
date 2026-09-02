import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { useToastStore } from '../store/toastStore';
import { MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Locations() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { locations, employees, stockBalances, saveEntity, softDeleteEntity } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const [siteFilter, setSiteFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  
  const addToast = useToastStore(s => s.addToast);

  const filteredItems = React.useMemo(() => {
    return locations.filter(item => {
      const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const matchSite = !siteFilter || item.site === siteFilter;
      const matchType = !typeFilter || item.locationType === typeFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? item.active : !item.active);
      const isNotDeleted = !item.deletedAt;
      return matchSearch && matchSite && matchType && matchStatus && isNotDeleted;
    });
  }, [locations, search, siteFilter, typeFilter, statusFilter]);

  const handleToggleActive = (item: any) => {
    if (item.active) {
      const hasStock = stockBalances.some(b => b.locationId === item.id && b.quantityOnHand > 0);
      if (hasStock) {
        addToast('Cannot deactivate a location that currently holds stock.', 'error');
        return;
      }
      saveEntity('locations', { ...item, active: false });
    } else {
      saveEntity('locations', { ...item, active: true });
    }
  };

  const handleDelete = (id: string) => {
    const hasStock = stockBalances.some(b => b.locationId === id && b.quantityOnHand > 0);
    if (hasStock) {
      addToast('Cannot delete location with stock on hand.', 'error');
      return;
    }
    softDeleteEntity('locations', id);
    addToast('Location moved to Trash Bin.', 'success');
  };

  // Extract unique sites
  const uniqueSites = React.useMemo(() => Array.from(new Set(locations.map(l => l.site).filter(Boolean))), [locations]);

  return (
    <div>
      <PageHeader 
        title={t('locations')} 
        action={<Button onClick={() => navigate('/locations/new')}><Plus className="w-4 h-4 mr-2" /> Add Location</Button>} 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="w-40">
          <option value="">All Sites</option>
          {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-48">
          <option value="">All Types</option>
          <option value="General">General</option>
          <option value="Central Warehouse">Central Warehouse</option>
          <option value="Site Store">Site Store</option>
          <option value="Department Store">Department Store</option>
          <option value="Scrap">Scrap</option>
          <option value="Used">Used</option>
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-32">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={filteredItems}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<MapPin />} title="No locations found" action={<Button variant="secondary" onClick={() => navigate('/locations/new')}>Add Location</Button>} />}
        columns={[
          { key: 'code', header: t('code'), className: 'font-mono text-xs' },
          { key: 'name', header: t('name'), render: (item) => (
            <div>
              <div className="font-medium text-ink">{language === 'en' ? item.nameEn : item.nameAr}</div>
              <div className="text-xs text-body">{item.site} • {item.locationType}</div>
            </div>
          )},
          { key: 'storeKeepers', header: 'Assigned Store Keepers', render: (item) => {
            const keepers = item.assignedStoreKeeperIds?.map((id: string) => employees.find((e: any) => e.id === id)?.name).filter(Boolean);
            return (keepers && keepers.length > 0) ? (
              <span className="text-sm">{keepers.join(', ')}</span>
            ) : (
              <span className="text-xs text-body italic">None</span>
            );
          }},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/locations/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
          )}
        ]}
      />
    </div>
  )
}
