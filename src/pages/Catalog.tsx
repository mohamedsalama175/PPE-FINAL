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
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemDetailModal } from '../components/modals/ItemDetailModal';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { downloadCsv } from '../lib/excelService';
import { Box, Plus, Download, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import { PPEItem } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { ppeItems, itemGroups, stockBalances, softDeleteEntity, toggleEntityActive, checkInUse } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [groupFilter, setGroupFilter] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('active');
  const [selectedItem, setSelectedItem] = React.useState<PPEItem | null>(null);

  // In-use protection override state
  const [overrideTarget, setOverrideTarget] = React.useState<{ item: PPEItem; action: 'delete' | 'deactivate'; reasons: string[] } | null>(null);

  const filteredItems = React.useMemo(() => {
    return ppeItems.filter(item => {
      const matchSearch = item.itemCode.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const matchGroup = !groupFilter || item.itemGroupId === groupFilter;
      const matchRisk = !riskFilter || item.riskCategory === riskFilter;
      const matchActive = activeFilter === 'all' ? true : activeFilter === 'active' ? item.active : !item.active;
      const isNotDeleted = !item.deletedAt;
      return matchSearch && matchCategory && matchGroup && matchRisk && matchActive && isNotDeleted;
    });
  }, [ppeItems, search, categoryFilter, groupFilter, riskFilter, activeFilter]);

  const handleToggleActive = (item: PPEItem) => {
    if (item.active) {
      const check = checkInUse('ppeItems', item.id);
      if (check.inUse) {
        setOverrideTarget({ item, action: 'deactivate', reasons: check.reasons });
        return;
      }
      const res = toggleEntityActive('ppeItems', item.id, false);
      if (!res.success) addToast(res.message || 'Error deactivating item.', 'error');
      else addToast('Item deactivated.', 'success');
    } else {
      toggleEntityActive('ppeItems', item.id, true);
      addToast('Item activated.', 'success');
    }
  };

  const handleDelete = (item: PPEItem) => {
    const check = checkInUse('ppeItems', item.id);
    if (check.inUse) {
      setOverrideTarget({ item, action: 'delete', reasons: check.reasons });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${item.itemCode}? It will be moved to the Trash Bin.`)) return;
    const res = softDeleteEntity('ppeItems', item.id);
    if (!res.success) addToast(res.message || 'Error deleting item.', 'error');
    else addToast('Item moved to Trash Bin.', 'success');
  };

  const handleOverrideConfirm = (reason: string) => {
    if (!overrideTarget) return;
    const { item, action } = overrideTarget;
    if (action === 'delete') {
      const res = softDeleteEntity('ppeItems', item.id, reason);
      if (res.success) addToast('Item deleted with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    } else {
      const res = toggleEntityActive('ppeItems', item.id, false, reason);
      if (res.success) addToast('Item deactivated with Admin override.', 'success');
      else addToast(res.message || 'Override failed.', 'error');
    }
    setOverrideTarget(null);
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      addToast('No items to export.', 'error');
      return;
    }
    const headers = ['Item Code', 'Name (EN)', 'Name (AR)', 'Category', 'Risk Category', 'Lifespan Value', 'Lifespan Type', 'UoM', 'Reorder Level', 'Active'];
    const rows = filteredItems.map(item => [
      item.itemCode,
      item.nameEn,
      item.nameAr,
      item.category,
      `Category ${item.riskCategory}`,
      item.lifespanValue,
      item.lifespanType,
      item.uom || 'Piece',
      item.reorderLevel,
      item.active ? 'Yes' : 'No'
    ]);
    downloadCsv('ppe_catalog_master', headers, rows);
    addToast('Catalog exported to CSV successfully.', 'success');
  };

  return (
    <div>
      <PageHeader 
        title={t('catalog')} 
        subtitle="Manage master equipment specifications and lifecycle standards"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export Catalog
            </Button>
            <Button onClick={() => navigate('/catalog/new')}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        } 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-40">
          <option value="">All Categories</option>
          <option value="Head">Head</option>
          <option value="Eye & Face">Eye & Face</option>
          <option value="Hearing">Hearing</option>
          <option value="Respiratory">Respiratory</option>
          <option value="Hand">Hand</option>
          <option value="Foot">Foot</option>
          <option value="Body">Body</option>
          <option value="Fall Protection">Fall Protection</option>
        </Select>
        <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="w-40">
          <option value="">All Groups</option>
          {itemGroups.filter(g => g.active && !g.deletedAt).map(g => (
            <option key={g.id} value={g.id}>{g.nameEn}</option>
          ))}
        </Select>
        <Select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-32">
          <option value="">All Risks</option>
          <option value="I">Category I</option>
          <option value="II">Category II</option>
          <option value="III">Category III</option>
        </Select>
        <div className="flex bg-surface border border-border rounded-md p-1">
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm cursor-pointer transition-colors ${activeFilter === 'all' ? 'bg-canvas text-ink shadow-sm' : 'text-body hover:text-ink'}`}
            onClick={() => setActiveFilter('all')}
          >All</button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm cursor-pointer transition-colors ${activeFilter === 'active' ? 'bg-canvas text-ink shadow-sm' : 'text-body hover:text-ink'}`}
            onClick={() => setActiveFilter('active')}
          >Active</button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm cursor-pointer transition-colors ${activeFilter === 'inactive' ? 'bg-canvas text-ink shadow-sm' : 'text-body hover:text-ink'}`}
            onClick={() => setActiveFilter('inactive')}
          >Inactive</button>
        </div>
      </FilterBar>

      <DataTable 
        data={filteredItems}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<Box />} title="No PPE items found" description="Add an item to start building your catalog." action={<Button variant="secondary" onClick={() => navigate('/catalog/new')}>Add Item</Button>} />}
        columns={[
          { key: 'itemCode', header: t('code'), render: (item) => (
            <span 
              onClick={() => setSelectedItem(item)}
              className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
            >
              {item.itemCode}
            </span>
          )},
          { key: 'name', header: t('name'), render: (item) => (
            <div>
              <div 
                onClick={() => setSelectedItem(item)}
                className="font-medium text-ink cursor-pointer hover:underline"
              >
                {language === 'en' ? item.nameEn : item.nameAr}
              </div>
              <div className="text-[11px] text-body">{item.manufacturer} {item.model ? `· ${item.model}` : ''}</div>
            </div>
          )},
          { key: 'group', header: 'Group', render: (item) => {
            const group = itemGroups.find(g => g.id === item.itemGroupId);
            return group ? (language === 'en' ? group.nameEn : group.nameAr) : '-';
          }},
          { key: 'riskCategory', header: 'Risk', render: (item) => (
            <StatusBadge 
              status={item.riskCategory === 'I' ? 'success' : item.riskCategory === 'II' ? 'warning' : 'error'} 
              label={`Cat ${item.riskCategory}`} 
              icon={false}
            />
          )},
          { key: 'stockAlert', header: 'Stock Alert (PPE-006)', render: (item) => {
            const lowLocations = item.locationIds.filter(locId => {
              const bal = stockBalances.find(b => b.ppeItemId === item.id && b.locationId === locId);
              const qty = bal ? bal.quantityOnHand : 0;
              return qty <= item.reorderLevel;
            });

            if (lowLocations.length > 0) {
              return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-safety-amber-signal bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" /> Low at {lowLocations.length} loc
                </span>
              );
            }
            return <span className="text-[11px] text-safety-green font-medium">Optimal</span>;
          }},
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)} title="View Details (PPE-005)">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/catalog/${item.id}/edit`)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item)}>
                Delete
              </Button>
            </div>
          )}
        ]}
      />

      {/* PPE-005 Item Details Modal */}
      <ItemDetailModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
        onEdit={(it) => {
          setSelectedItem(null);
          navigate(`/catalog/${it.id}/edit`);
        }}
      />

      {/* G2 In-Use Protection Override Modal */}
      <OverrideModal 
        isOpen={!!overrideTarget}
        entityName={overrideTarget?.item.itemCode || ''}
        reasons={overrideTarget?.reasons || []}
        actionLabel={overrideTarget?.action === 'delete' ? 'Override and Delete' : 'Override and Deactivate'}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
    </div>
  );
}
