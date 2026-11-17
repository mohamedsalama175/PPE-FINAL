import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { UnitDetailModal } from '../components/modals/UnitDetailModal';
import { useToastStore } from '../store/toastStore';
import { Ruler, Plus, Eye } from 'lucide-react';
import { UnitOfMeasure } from '../types';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortKey = 'code' | 'name' | 'usage';

/** PPE-053: Units of Measure list. */
export default function Units() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { units, ppeItems, unitUsage, toggleEntityActive, softDeleteEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [sort, setSort] = React.useState<SortKey>('code');
  const [selected, setSelected] = React.useState<UnitOfMeasure | null>(null);

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return units
      .filter(u => !u.deletedAt) // trashed units appear only in the Trash Bin
      .filter(u => !q || u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
      .filter(u => status === 'all' || (status === 'active' ? u.active : !u.active))
      .map(u => ({ unit: u, usage: unitUsage(u.id) }))
      .sort((a, b) => sort === 'usage'
        ? b.usage.itemCount - a.usage.itemCount
        : (sort === 'name' ? a.unit.name.localeCompare(b.unit.name) : a.unit.code.localeCompare(b.unit.code)));
    // ppeItems is read through unitUsage; keep it in the deps so counts refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, ppeItems, search, status, sort, unitUsage]);

  const handleToggle = (u: UnitOfMeasure) => {
    const res = toggleEntityActive('units', u.id, !u.active);
    if (!res.success) addToast(res.message || t('unitInUseBlocked'), 'error');
    else addToast(u.active ? `${u.code} deactivated.` : `${u.code} activated.`, 'success');
  };

  const handleTrash = (u: UnitOfMeasure) => {
    const usage = unitUsage(u.id);
    if (usage.itemCount + usage.trashedItemCount > 0) {
      addToast(`${t('unitInUseBlocked')} (${usage.itemCount + usage.trashedItemCount})`, 'error');
      return;
    }
    if (!window.confirm(`Move unit ${u.code} (${u.name}) to the Trash Bin?`)) return;
    const res = softDeleteEntity('units', u.id);
    if (!res.success) addToast(res.message || 'Could not move the unit to the Trash Bin.', 'error');
    else addToast(`${u.code} moved to the Trash Bin.`, 'success');
  };

  return (
    <div>
      <PageHeader
        title={t('unitsOfMeasure')}
        subtitle="Units used to count and issue catalog items (PPE-051 to PPE-056)"
        actions={<Button onClick={() => navigate('/units/new')}><Plus className="w-4 h-4 me-2" /> {t('addUnit')}</Button>}
      />

      <FilterBar>
        <SearchInput placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={status} onChange={e => setStatus(e.target.value as StatusFilter)} className="w-36" aria-label={t('status')}>
          <option value="all">{t('all')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </Select>
        <Select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="w-44" aria-label="Sort">
          <option value="code">Sort: {t('code')}</option>
          <option value="name">Sort: {t('name')}</option>
          <option value="usage">Sort: {t('itemsUsingIt')}</option>
        </Select>
      </FilterBar>

      <DataTable
        data={rows}
        keyExtractor={r => r.unit.id}
        emptyState={
          <EmptyState
            icon={<Ruler />}
            title={t('noUnitsFound')}
            description={search ? `Nothing matches "${search}".` : undefined}
            action={<Button variant="secondary" onClick={() => navigate('/units/new')}>{t('addUnit')}</Button>}
          />
        }
        columns={[
          { key: 'code', header: t('code'), className: 'text-start', render: r => (
            <button onClick={() => setSelected(r.unit)} className="font-mono text-xs font-bold text-accent hover:underline">{r.unit.code}</button>
          ) },
          { key: 'name', header: t('name'), className: 'text-start', render: r => <span className="font-medium text-ink">{r.unit.name}</span> },
          { key: 'symbol', header: t('symbol'), className: 'text-start', render: r => <span className="font-mono text-xs">{r.unit.symbol}</span> },
          { key: 'usage', header: t('itemsUsingIt'), className: 'text-start', render: r => (
            <span className="text-xs">{r.usage.itemCount}</span>
          ) },
          { key: 'status', header: t('status'), className: 'text-start', render: r => (
            <StatusBadge status={r.unit.active ? 'success' : 'neutral'} label={r.unit.active ? t('active') : t('inactive')} />
          ) },
          { key: 'actions', header: t('actions'), className: 'text-end', render: r => (
            <div className="flex justify-end items-center gap-1.5">
              <ToggleSwitch checked={r.unit.active} onChange={() => handleToggle(r.unit)} />
              <Button variant="ghost" size="sm" onClick={() => setSelected(r.unit)}><Eye className="w-3.5 h-3.5 me-1" /> View</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/units/${r.unit.id}/edit`)}>{t('edit')}</Button>
              <Button variant="ghost" size="sm" className="text-safety-red hover:bg-safety-red/10" onClick={() => handleTrash(r.unit)}>{t('delete')}</Button>
            </div>
          ) },
        ]}
      />

      <UnitDetailModal
        unit={selected}
        onClose={() => setSelected(null)}
        onEdit={u => { setSelected(null); navigate(`/units/${u.id}/edit`); }}
        onTrash={u => { setSelected(null); handleTrash(u); }}
      />
    </div>
  );
}
