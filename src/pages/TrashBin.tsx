import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Modal } from '../components/ui/Modal';
import { useSwal } from '../lib/useSwal';
import { 
  Trash2, RotateCcw, ShieldAlert, AlertTriangle, 
  Clock, CheckCircle2, History, AlertOctagon 
} from 'lucide-react';
import { format } from 'date-fns';
import { TrashItem } from '../types';

export default function TrashBin() {
  const { t, language } = useTranslation();
  const { showConfirm, showToast } = useSwal();

  const { 
    trashItems, 
    restoreTrashItem, 
    settings, 
    currentUser 
  } = usePPEStore();

  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [selectedTrashIds, setSelectedTrashIds] = React.useState<string[]>([]);

  // Code conflict modal state
  const [conflictModal, setConflictModal] = React.useState<{
    isOpen: boolean;
    item: TrashItem | null;
    newCode: string;
    errorMessage?: string;
  }>({
    isOpen: false,
    item: null,
    newCode: ''
  });

  const retentionDays = settings.trashRetentionDays || 90;

  const filteredTrash = React.useMemo(() => {
    return trashItems
      .filter(item => {
        if (typeFilter !== 'all' && item.entityType !== typeFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchCode = item.code.toLowerCase().includes(q);
          const matchName = item.nameEn.toLowerCase().includes(q) || item.nameAr.toLowerCase().includes(q);
          if (!matchCode && !matchName) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }, [trashItems, typeFilter, search]);

  const handleRestoreClick = async (item: TrashItem) => {
    const confirmed = await showConfirm(
      'Restore Record',
      `Are you sure you want to restore "${item.nameEn}"?`,
      'Restore',
      false
    );
    if (!confirmed) return;

    const result = restoreTrashItem(item.id);
    if (!result.success) {
      if (result.error?.includes('already in use')) {
        // Prompt for new code
        setConflictModal({
          isOpen: true,
          item,
          newCode: `${item.code}_RESTORED`,
          errorMessage: result.error
        });
      } else {
        showToast(result.error || 'Restore blocked.', 'error');
      }
    } else {
      showToast(`Restored "${item.nameEn}" successfully.`, 'success');
      setSelectedTrashIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const handleConfirmConflictRestore = () => {
    if (!conflictModal.item || !conflictModal.newCode.trim()) return;

    const result = restoreTrashItem(conflictModal.item.id, conflictModal.newCode.trim());
    if (!result.success) {
      setConflictModal(prev => ({ ...prev, errorMessage: result.error }));
    } else {
      showToast(`Restored "${conflictModal.item.nameEn}" with remapped code "${conflictModal.newCode}".`, 'success');
      setConflictModal({ isOpen: false, item: null, newCode: '' });
      setSelectedTrashIds(prev => prev.filter(id => id !== conflictModal.item!.id));
    }
  };

  const handleBulkRestore = async () => {
    const confirmed = await showConfirm(
      'Bulk Restore Records',
      `Are you sure you want to restore ${selectedTrashIds.length} records?`,
      'Restore All',
      false
    );
    if (!confirmed) return;

    let successCount = 0;
    const failedItems: string[] = [];

    selectedTrashIds.forEach(id => {
      const item = trashItems.find(t => t.id === id);
      if (item) {
        const res = restoreTrashItem(id);
        if (res.success) {
          successCount++;
        } else {
          failedItems.push(`${item.nameEn} (${res.error})`);
        }
      }
    });

    if (successCount > 0) {
      showToast(`Bulk restored ${successCount} record(s).`, 'success');
      setSelectedTrashIds([]);
    }
    if (failedItems.length > 0) {
      showToast(`Could not restore ${failedItems.length} record(s): ${failedItems[0]}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trash Bin & Restore Engine (NEW-04)"
        subtitle="Shared trash across Items, Attributes, Item Groups, Locations, and Kits with historical retention rules and parent validation"
        action={
          selectedTrashIds.length > 0 ? (
            <Button variant="primary" size="sm" onClick={handleBulkRestore}>
              <RotateCcw className="w-4 h-4 me-1.5" /> Bulk Restore ({selectedTrashIds.length})
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search code or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 text-xs"
          />

          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-48 text-xs"
          >
            <option value="all">All Entity Types</option>
            <option value="Item">PPE Items</option>
            <option value="Attribute">Attributes</option>
            <option value="ItemGroup">Item Groups</option>
            <option value="Location">Locations</option>
            <option value="Kit">Job Kits</option>
          </Select>
        </div>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredTrash}
          keyExtractor={item => item.id}
          emptyState={<EmptyState icon={<Trash2 />} title="Trash Bin is empty" description="No deleted records currently pending restore or retention." />}
          columns={[
            {
              key: 'checkbox',
              header: '',
              className: 'w-8',
              render: item => (
                <input
                  type="checkbox"
                  checked={selectedTrashIds.includes(item.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedTrashIds(prev => [...prev, item.id]);
                    } else {
                      setSelectedTrashIds(prev => prev.filter(id => id !== item.id));
                    }
                  }}
                  className="rounded border-slate-300 text-primary"
                />
              )
            },
            {
              key: 'type',
              header: 'Entity Type',
              render: item => (
                <span className="font-semibold text-slate-800 text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 ">
                  {item.entityType}
                </span>
              )
            },
            {
              key: 'code',
              header: 'Identifier',
              render: item => (
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 ">{item.code}</span>
                  <div className="text-[11px] text-slate-500 ">{item.nameEn}</div>
                </div>
              )
            },
            {
              key: 'deletedAt',
              header: 'Deleted Date & By',
              render: item => (
                <div className="text-xs">
                  <div className="font-medium text-slate-800 ">{format(new Date(item.deletedAt), 'MMM d, yyyy')}</div>
                  <div className="text-[10px] text-slate-400 ">By {item.deletedBy}</div>
                </div>
              )
            },
            {
              key: 'reason',
              header: 'Deletion Reason',
              render: item => (
                <div className="max-w-[200px] text-xs text-slate-600 truncate" title={item.reason}>
                  {item.reason}
                </div>
              )
            },
            {
              key: 'retention',
              header: 'Retention & Countdown',
              render: item => {
                if (item.hasHistory) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 ">
                      <History className="w-3 h-3" /> Retained — has history
                    </span>
                  );
                }

                const daysLeft = Math.max(0, retentionDays - item.daysInTrash);
                const isUrgent = daysLeft <= 7;

                return (
                  <div className="text-xs">
                    <span
                      className={`font-mono font-bold ${
                        isUrgent ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 ' : 'text-slate-700 '
                      }`}
                    >
                      {daysLeft} days left
                    </span>
                    <div className="text-[10px] text-slate-400 ">Auto-purge at 0</div>
                  </div>
                );
              }
            },
            {
              key: 'actions',
              header: '',
              className: 'text-end',
              render: item => (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRestoreClick(item)}
                >
                  <RotateCcw className="w-3.5 h-3.5 me-1 text-primary" /> Restore
                </Button>
              )
            }
          ]}
        />
      </ContainerCard>

      {/* Duplicate Code Conflict Resolution Modal */}
      {conflictModal.isOpen && conflictModal.item && (
        <Modal
          opened={conflictModal.isOpen}
          onClose={() => setConflictModal({ isOpen: false, item: null, newCode: '' })}
          title="Code Already In Use"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              The original code <span className="font-mono font-bold text-slate-800 ">"{conflictModal.item.code}"</span> has since been taken by an active record. Enter a unique new code to complete the restore:
            </p>

            {conflictModal.errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 ">
                {conflictModal.errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Unique Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={conflictModal.newCode}
                onChange={e => setConflictModal(prev => ({ ...prev, newCode: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                placeholder="e.g. HLM-001_NEW"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setConflictModal({ isOpen: false, item: null, newCode: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmConflictRestore}
              >
                Confirm & Restore
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
