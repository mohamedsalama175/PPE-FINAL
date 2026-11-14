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
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { MapPin, Plus, Eye, Lock, Unlock } from 'lucide-react';
import { Location } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Locations() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { locations, employees, currentUser, stockBalances, softDeleteEntity, toggleEntityActive, closeOpeningBalance, checkInUse } = usePPEStore();
  
  const [search, setSearch] = React.useState('');
  const [siteFilter, setSiteFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [conditionFilter, setConditionFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<{ location: Location; action: 'delete' | 'deactivate'; reasons: string[] } | null>(null);

  const addToast = useToastStore(s => s.addToast);

  // Role scoping (PPE-023)
  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myAssignedLocationIds = React.useMemo(() => {
    return isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper, locations]);

  const filteredItems = React.useMemo(() => {
    return locations.filter(item => {
      // PPE-023: If store keeper, show only assigned locations unless admin or HSE
      if (isStoreKeeper && !myAssignedLocationIds.includes(item.id)) return false;

      const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const matchSite = !siteFilter || item.site === siteFilter;
      const matchType = !typeFilter || item.locationType === typeFilter;
      const matchCondition = !conditionFilter || (item.stockCondition || 'New') === conditionFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? item.active : !item.active);
      const isNotDeleted = !item.deletedAt;
      return matchSearch && matchSite && matchType && matchCondition && matchStatus && isNotDeleted;
    });
  }, [locations, search, siteFilter, typeFilter, conditionFilter, statusFilter, isStoreKeeper, myAssignedLocationIds]);

  const handleToggleActive = (item: Location) => {
    if (item.active) {
      const isScrap = item.stockCondition === 'Scrap' || item.locationType === 'Scrap';
      const hasStock = stockBalances.some(b => b.locationId === item.id && b.quantityOnHand > 0);
      if (!isScrap && hasStock) {
        addToast(`Cannot deactivate: Location holds active stock. Stock must be moved out first (Rule G2 hard block, no override).`, 'error');
        return;
      }

      const check = checkInUse('locations', item.id);
      if (check.inUse) {
        setOverrideTarget({ location: item, action: 'deactivate', reasons: check.reasons });
        return;
      }
      const res = toggleEntityActive('locations', item.id, false);
      if (!res.success) addToast(res.message || 'Error deactivating location.', 'error');
      else addToast('Location deactivated.', 'success');
    } else {
      toggleEntityActive('locations', item.id, true);
      addToast('Location activated.', 'success');
    }
  };

  const handleDelete = (item: Location) => {
    const isScrap = item.stockCondition === 'Scrap' || item.locationType === 'Scrap';
    const hasStock = stockBalances.some(b => b.locationId === item.id && b.quantityOnHand > 0);
    if (!isScrap && hasStock) {
      addToast(`Cannot delete: Location holds active stock. Stock must be moved out first (Rule G2 hard block, no override).`, 'error');
      return;
    }

    const check = checkInUse('locations', item.id);
    if (check.inUse) {
      setOverrideTarget({ location: item, action: 'delete', reasons: check.reasons });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete location ${item.code}?`)) return;
    const res = softDeleteEntity('locations', item.id);
    if (!res.success) addToast(res.message || 'Error deleting location.', 'error');
    else addToast('Location moved to Trash Bin.', 'success');
  };

  const handleOverrideConfirm = (reason: string) => {
    if (!overrideTarget) return;
    const { location, action } = overrideTarget;
    if (action === 'delete') {
      const res = softDeleteEntity('locations', location.id, reason);
      if (res.success) addToast('Location deleted with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    } else {
      const res = toggleEntityActive('locations', location.id, false, reason);
      if (res.success) addToast('Location deactivated with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    }
    setOverrideTarget(null);
  };

  const handleCloseOpeningBalance = (locationId: string) => {
    if (!window.confirm('Closing Opening Balance will permanently lock this location from creating further opening balances (PPE-024). Confirm?')) return;
    closeOpeningBalance(locationId, currentUser.id);
    addToast('Opening balance locked for this location.', 'success');
  };

  const uniqueSites = React.useMemo(() => Array.from(new Set(locations.map(l => l.site).filter(Boolean))), [locations]);

  return (
    <div>
      <PageHeader 
        title={t('locations')} 
        subtitle="Warehouses, site stores, and disposal staging with capacity tracking"
        actions={
          ['Admin', 'HSE Supervisor'].includes(currentUser.role) ? (
            <Button onClick={() => navigate('/locations/new')}><Plus className="w-4 h-4 mr-2" /> Add Location</Button>
          ) : undefined
        } 
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
        <Select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="w-36">
          <option value="">All Conditions</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Scrap">Scrap</option>
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
        emptyState={<EmptyState icon={<MapPin />} title="No locations accessible" description={isStoreKeeper ? "You are not assigned to any locations." : "Create a location to manage stock balances."} />}
        columns={[
          { key: 'code', header: t('code'), render: (item) => (
            <span 
              onClick={() => setSelectedLocation(item)}
              className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
            >
              {item.code}
            </span>
          )},
          { key: 'name', header: t('name'), render: (item) => (
            <div>
              <div 
                onClick={() => setSelectedLocation(item)}
                className="font-medium text-ink cursor-pointer hover:underline"
              >
                {language === 'en' ? item.nameEn : item.nameAr}
              </div>
              <div className="text-[11px] text-body">{item.site} &middot; {item.locationType}</div>
            </div>
          )},
          { key: 'condition', header: 'Condition (G6)', render: (item) => (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              item.stockCondition === 'Scrap' ? 'bg-red-100 text-safety-red' : item.stockCondition === 'Used' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-safety-green'
            }`}>
              {item.stockCondition || 'New'}
            </span>
          )},
          { key: 'capacity', header: 'Capacity Utilization (PPE-021)', render: (item) => {
            const onHand = stockBalances
              .filter(b => b.locationId === item.id)
              .reduce((sum, b) => sum + b.quantityOnHand, 0);
            const cap = item.capacityUnits || 1;
            const pct = Math.round((onHand / cap) * 100);
            const isHigh = pct >= 90;
            return (
              <div className="w-36">
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span>{onHand}/{cap}</span>
                  <span className={isHigh ? 'text-safety-red font-bold' : 'text-body'}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${pct > 100 ? 'bg-safety-red' : isHigh ? 'bg-safety-amber-signal' : 'bg-accent'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          }},
          { key: 'openingBalance', header: 'Opening Bal (PPE-024)', render: (item) => (
            item.openingBalanceClosed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-safety-red bg-red-50 px-2 py-0.5 rounded border border-red-200">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-safety-green font-medium">Open</span>
                {['Admin'].includes(currentUser.role) && (
                  <button 
                    onClick={() => handleCloseOpeningBalance(item.id)}
                    className="text-[10px] text-body hover:text-safety-red underline cursor-pointer"
                    title="Close opening balance"
                  >
                    Lock
                  </button>
                )}
              </div>
            )
          )},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch 
              checked={item.active} 
              onChange={() => handleToggleActive(item)} 
              disabled={isStoreKeeper}
            />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLocation(item)} title="View Details (PPE-021)">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              {['Admin', 'HSE Supervisor'].includes(currentUser.role) && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/locations/${item.id}/edit`)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item)}>Delete</Button>
                </>
              )}
            </div>
          )}
        ]}
      />

      {/* PPE-021 Location Details Modal */}
      <LocationDetailModal 
        location={selectedLocation} 
        onClose={() => setSelectedLocation(null)} 
        onEdit={(loc) => {
          setSelectedLocation(null);
          navigate(`/locations/${loc.id}/edit`);
        }}
      />

      {/* G2 In-Use Protection Override Modal */}
      <OverrideModal 
        isOpen={!!overrideTarget}
        entityName={overrideTarget?.location.code || ''}
        reasons={overrideTarget?.reasons || []}
        actionLabel={overrideTarget?.action === 'delete' ? 'Override and Delete' : 'Override and Deactivate'}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
    </div>
  );
}
