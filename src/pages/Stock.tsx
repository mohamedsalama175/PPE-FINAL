import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PackageSearch, ArrowRightLeft } from 'lucide-react';
import { StockBalance, PPEItem } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Stock() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { stockBalances, ppeItems, locations, currentUser } = usePPEStore();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(initialFilter || 'all');
  const [locationFilter, setLocationFilter] = React.useState('all');

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const myLocations = React.useMemo(() => {
    return isStoreKeeper ? locations.filter(l => l.assignedStoreKeeperIds.includes(currentUser.id)).map(l => l.id) : [];
  }, [currentUser.id, isStoreKeeper, locations]);

  const viewableLocations = isStoreKeeper ? locations.filter(l => myLocations.includes(l.id)) : locations;

  const enrichedBalances = React.useMemo(() => {
    return stockBalances.map(b => {
      const item = ppeItems.find(i => i.id === b.ppeItemId);
      const loc = locations.find(l => l.id === b.locationId);
      
      let status: 'inStock' | 'lowStock' | 'outOfStock' = 'inStock';
      if (b.quantityOnHand === 0) status = 'outOfStock';
      else if (item && b.quantityOnHand <= item.reorderLevel) status = 'lowStock';

      return {
        ...b,
        item,
        loc,
        status
      }
    }).filter(b => {
      if (isStoreKeeper && !myLocations.includes(b.locationId)) return false;
      if (locationFilter !== 'all' && b.locationId !== locationFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'out_of_stock' && b.status !== 'outOfStock') return false;
        if (statusFilter === 'low_stock' && b.status !== 'lowStock') return false;
      }
      if (search && b.item) {
        const q = search.toLowerCase();
        return b.item.itemCode.toLowerCase().includes(q) || b.item.nameEn.toLowerCase().includes(q) || b.item.nameAr.includes(q);
      }
      return true;
    });
  }, [stockBalances, ppeItems, locations, isStoreKeeper, myLocations, locationFilter, statusFilter, search]);

  if (isStoreKeeper && myLocations.length === 0) {
    return (
      <div>
        <PageHeader title={t('stock')} />
        <EmptyState 
          icon={<PackageSearch />} 
          title="No locations assigned" 
          description="You must be assigned to at least one location to view stock." 
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title={t('stock')} 
        actions={
          <div className="flex gap-2">
            {['Admin', 'HSE Supervisor'].includes(currentUser.role) && (
              <Button variant="secondary" onClick={() => navigate('/stock/opening-balances/new')}>Opening Balance</Button>
            )}
            <Button onClick={() => navigate('/stock/transfers/new')}><ArrowRightLeft className="w-4 h-4 mr-2" /> {t('transfer')}</Button>
          </div>
        } 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-48">
          <option value="all">All Locations</option>
          {viewableLocations.map(l => (
            <option key={l.id} value={l.id}>{language === 'en' ? l.nameEn : l.nameAr}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-48">
          <option value="all">All Statuses</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={enrichedBalances}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<PackageSearch />} title="No stock records found" />}
        columns={[
          { key: 'itemCode', header: 'Item Code', className: 'font-mono text-xs', render: (b) => b.item?.itemCode },
          { key: 'itemName', header: 'Item Name', render: (b) => (
            <div className="font-medium text-ink">{b.item ? (language === 'en' ? b.item.nameEn : b.item.nameAr) : '-'}</div>
          )},
          { key: 'location', header: 'Location', render: (b) => b.loc ? (language === 'en' ? b.loc.nameEn : b.loc.nameAr) : '-' },
          { key: 'qoh', header: 'QOH', render: (b) => b.quantityOnHand },
          { key: 'status', header: 'Status', render: (b) => {
            if (b.status === 'outOfStock') return <StatusBadge status="error" label={t('outOfStock')} />;
            if (b.status === 'lowStock') return <StatusBadge status="warning" label={t('lowStock')} />;
            return <StatusBadge status="success" label={t('inStock')} />;
          }}
        ]}
      />
    </div>
  )
}
