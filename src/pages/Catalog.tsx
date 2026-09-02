import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { Box, Plus, Download, Upload } from 'lucide-react';
import { PPEItem } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { ppeItems, itemGroups, issuances, softDeleteEntity, saveEntity } = usePPEStore();
  const [search, setSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('active');

  const filteredItems = React.useMemo(() => {
    return ppeItems.filter(item => {
      const matchSearch = item.itemCode.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const matchActive = activeFilter === 'all' ? true : activeFilter === 'active' ? item.active : !item.active;
      const isNotDeleted = !item.deletedAt;
      return matchSearch && matchActive && isNotDeleted;
    });
  }, [ppeItems, search, activeFilter]);

  const handleToggleActive = (item: PPEItem) => {
    if (item.active) {
      const inUse = issuances.some(i => i.ppeItemId === item.id && i.status === 'issued');
      if (inUse && !window.confirm('This item is currently issued to employees. Deactivating it will prevent new issuances but won\'t affect current ones. Proceed?')) {
        return;
      }
      saveEntity('ppeItems', { ...item, active: false });
    } else {
      saveEntity('ppeItems', { ...item, active: true });
    }
  };

  const handleDelete = (id: string) => {
    const inUse = issuances.some(i => i.ppeItemId === id && i.status === 'issued');
    if (inUse && !window.confirm('This item is currently issued to employees. Deleting it will move it to the Trash Bin. Proceed?')) return;
    if (!inUse && !window.confirm('Are you sure you want to delete this item?')) return;
    softDeleteEntity('ppeItems', id);
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      alert("No items to export.");
      return;
    }
    const headers = ["Item Code", "Name (EN)", "Name (AR)", "Category", "Risk Category", "UoM", "Active"];
    const rows = filteredItems.map(item => [
      item.itemCode,
      `"${item.nameEn}"`,
      `"${item.nameAr}"`,
      item.category,
      item.riskCategory,
      item.uom || '',
      item.active ? "Yes" : "No"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ppe_catalog_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeader 
        title={t('catalog')} 
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button variant="outline" onClick={() => alert("Import feature would launch here. Please use UI.")}><Upload className="w-4 h-4 mr-2" /> Import</Button>
            <Button onClick={() => navigate('/catalog/new')}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </div>
        } 
      />
      
      <FilterBar>
        <SearchInput 
          placeholder={t('search')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <div className="flex bg-surface border border-border rounded-md p-1">
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm ${activeFilter === 'all' ? 'bg-canvas text-ink shadow-sm' : 'text-body'}`}
            onClick={() => setActiveFilter('all')}
          >All</button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm ${activeFilter === 'active' ? 'bg-canvas text-ink shadow-sm' : 'text-body'}`}
            onClick={() => setActiveFilter('active')}
          >Active</button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-sm ${activeFilter === 'inactive' ? 'bg-canvas text-ink shadow-sm' : 'text-body'}`}
            onClick={() => setActiveFilter('inactive')}
          >Inactive</button>
        </div>
      </FilterBar>

      <DataTable 
        data={filteredItems}
        keyExtractor={(item) => item.id}
        emptyState={<EmptyState icon={<Box />} title="No PPE items found" description="Add an item to start building your catalog." action={<Button variant="secondary" onClick={() => navigate('/catalog/new')}>Add Item</Button>} />}
        columns={[
          { key: 'itemCode', header: t('code'), className: 'font-mono text-xs' },
          { key: 'name', header: t('name'), render: (item) => (
            <div className="font-medium text-ink">{language === 'en' ? item.nameEn : item.nameAr}</div>
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
          { key: 'active', header: t('active'), render: (item) => (
            <ToggleSwitch checked={item.active} onChange={() => handleToggleActive(item)} />
          )},
          { key: 'actions', header: '', className: 'text-right', render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/catalog/${item.id}/edit`)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
          )}
        ]}
      />
    </div>
  )
}
