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
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';
import { ContainerCard } from '../components/ui/ContainerCard';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { useSwal } from '../lib/useSwal';
import { Briefcase, Plus, Eye, Edit2, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Kit } from '../types';
import { useNavigate } from 'react-router-dom';
import { subDays, isAfter } from 'date-fns';

export default function Kits() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { kits, jobPositions, ppeItems, issuances, settings, saveKit, trashKit, currentUser } = usePPEStore();
  const { showInfo } = useSwal();

  const [search, setSearch] = React.useState('');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('active');

  const [selectedKitForDetails, setSelectedKitForDetails] = React.useState<Kit | null>(null);

  const [overrideModal, setOverrideModal] = React.useState<{
    isOpen: boolean;
    title: string;
    warning: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    warning: '',
    action: () => {}
  });

  const filteredKits = React.useMemo(() => {
    return kits.filter(kit => {
      const matchSearch = kit.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          kit.nameAr.includes(search);
      const matchPos = positionFilter === 'all' || kit.jobPositionId === positionFilter;
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? kit.active : !kit.active;
      const isNotDeleted = !kit.deletedAt;
      return matchSearch && matchPos && matchStatus && isNotDeleted;
    });
  }, [kits, search, positionFilter, statusFilter]);

  // Check Sole Active Kit Protection rule (Rule 3 & BD-I469, BD-I478, BD-I480)
  const isSoleActiveKitWithRecentIssuances = (kit: Kit) => {
    // Check if other active kits exist for this job position
    const otherActiveKits = kits.filter(k => k.jobPositionId === kit.jobPositionId && k.id !== kit.id && k.active && !k.deletedAt);
    if (otherActiveKits.length > 0) return false;

    // Check if this kit had issuances within recent window (default 90 days)
    const cutoffDate = subDays(new Date(), settings.recentIssuanceWindowDays || 90);
    const hasRecentIssuances = issuances.some(i => i.kitId === kit.id && isAfter(new Date(i.issueDate), cutoffDate));

    return hasRecentIssuances;
  };

  const handleToggleActive = (kit: Kit) => {
    if (kit.active && isSoleActiveKitWithRecentIssuances(kit)) {
      if (currentUser.role !== 'Admin') {
        showInfo('Sole Active Kit Protection', 'This is the sole active kit for this Job Position and had issuances within the last 90 days. Only an Admin can override this restriction.');
        return;
      }

      const jobPos = jobPositions.find(j => j.id === kit.jobPositionId);
      setOverrideModal({
        isOpen: true,
        title: `Deactivate Sole Active Kit: ${kit.nameEn}`,
        warning: `This is the ONLY active kit configured for "${jobPos?.nameEn}" and has had issuances within the configured recent window (${settings.recentIssuanceWindowDays} days). Deactivating it requires an Admin Override reason.`,
        action: () => saveKit({ ...kit, active: false })
      });
      return;
    }

    saveKit({ ...kit, active: !kit.active });
  };

  const handleTrash = (kit: Kit) => {
    if (isSoleActiveKitWithRecentIssuances(kit)) {
      if (currentUser.role !== 'Admin') {
        showInfo('Sole Active Kit Protection', 'Cannot trash sole active kit with recent issuances. Only an Admin can override.');
        return;
      }

      const jobPos = jobPositions.find(j => j.id === kit.jobPositionId);
      setOverrideModal({
        isOpen: true,
        title: `Move Sole Active Kit to Trash: ${kit.nameEn}`,
        warning: `This is the sole active kit for "${jobPos?.nameEn}" with recent issuances. Moving it to Trash requires an Admin Override reason.`,
        action: () => trashKit(kit.id, 'Admin override: Moved sole active kit to trash')
      });
      return;
    }

    setOverrideModal({
      isOpen: true,
      title: `Move Kit to Trash: ${kit.nameEn}`,
      warning: `This kit will be moved to the shared Trash Bin (NEW-04).`,
      action: () => trashKit(kit.id, 'Standard deletion')
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('kits')}
        subtitle="Manage job-position equipment bundles for accelerated issuance and standard safety compliance"
        action={
          currentUser.role === 'Admin' && (
            <Button size="sm" onClick={() => navigate('/kits/new')}>
              <Plus className="w-3.5 h-3.5 me-1.5" /> Add Job Kit
            </Button>
          )
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search kits by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="w-48">
          <option value="all">All Job Positions</option>
          {jobPositions.filter(j => j.active).map(j => (
            <option key={j.id} value={j.id}>{language === 'en' ? j.nameEn : j.nameAr}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-32">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredKits}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Briefcase className="w-8 h-8 text-slate-400" />} title="No job kits found" />}
          columns={[
            {
              key: 'name',
              header: 'Kit Bundle Name',
              render: (item) => (
                <div>
                  <span className="font-bold text-slate-900 block">{item.nameEn}</span>
                  <span className="text-[11px] text-slate-500 font-arabic">{item.nameAr}</span>
                </div>
              )
            },
            {
              key: 'position',
              header: 'Job Position',
              className: 'w-48',
              render: (item) => {
                const pos = jobPositions.find(j => j.id === item.jobPositionId);
                return (
                  <span className="font-medium text-xs text-slate-800">
                    {pos ? pos.nameEn : 'General'}
                  </span>
                );
              }
            },
            {
              key: 'itemsCount',
              header: 'Items in Bundle',
              className: 'w-36 font-mono text-xs',
              render: (item) => (
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {item.items.length} {item.items.length === 1 ? 'line item' : 'line items'}
                </span>
              )
            },
            {
              key: 'active',
              header: 'Active',
              className: 'w-20 text-center',
              render: (item) => (
                <ToggleSwitch
                  checked={item.active}
                  onChange={() => handleToggleActive(item)}
                />
              )
            },
            {
              key: 'actions',
              header: '',
              className: 'w-24 text-end',
              render: (item) => (
                <div className="flex items-center justify-end">
                  <TableActionsButtons
                    onView={() => setSelectedKitForDetails(item)}
                    onEdit={currentUser.role === 'Admin' ? () => navigate(`/kits/${item.id}/edit`) : undefined}
                    onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
                  />
                </div>
              )
            }
          ]}
        />
      </ContainerCard>

      {/* DETAIL DRAWER (BD-I479) */}
      {selectedKitForDetails && (
        <SlideOverDrawer
          isOpen={Boolean(selectedKitForDetails)}
          onClose={() => setSelectedKitForDetails(null)}
          title={`Job Kit: ${selectedKitForDetails.nameEn}`}
          subtitle={`Position: ${jobPositions.find(j => j.id === selectedKitForDetails.jobPositionId)?.nameEn}`}
          width="lg"
        >
          <div className="space-y-5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Arabic Name</span>
              <p className="font-arabic font-bold text-sm text-slate-900">{selectedKitForDetails.nameAr}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700">
                Line Items in Bundle ({selectedKitForDetails.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedKitForDetails.items.map(line => {
                  const ppe = ppeItems.find(p => p.id === line.ppeItemId);
                  const isInactiveOrTrashed = !ppe || !ppe.active || Boolean(ppe.deletedAt);

                  return (
                    <div key={line.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ppe?.nameEn || 'Unknown Equipment'}</span>
                          {isInactiveOrTrashed && (
                            <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[9px] font-bold rounded">
                              Inactive / Trashed
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Code: {ppe?.itemCode || '—'}</span>
                      </div>
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        Qty: {line.quantity} {ppe?.uom}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issuance Count over last 90 days */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs text-indigo-950 font-mono">
              <span className="font-medium">Issuances in Last 90 Days:</span>
              <span className="font-extrabold text-sm">
                {(() => {
                  const cutoff = subDays(new Date(), 90);
                  const count = issuances.filter(i => i.kitId === selectedKitForDetails.id && isAfter(new Date(i.issueDate), cutoff)).length;
                  return count > 0 ? `${count} times issued` : 'Not yet issued in window';
                })()}
              </span>
            </div>
          </div>
        </SlideOverDrawer>
      )}

      {/* Admin Override Modal */}
      <AdminOverrideModal
        isOpen={overrideModal.isOpen}
        title={overrideModal.title}
        warningMessage={overrideModal.warning}
        onConfirm={(reason) => {
          overrideModal.action();
          setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} });
        }}
        onCancel={() => setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} })}
      />
    </div>
  );
}
