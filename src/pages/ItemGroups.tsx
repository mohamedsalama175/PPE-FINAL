import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
import { Layers, Plus, Eye, Edit2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ItemGroup } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ItemGroups() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { showInfo } = useSwal();
  const { itemGroups, attributes, ppeItems, saveItemGroup, trashItemGroup, currentUser } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('active');
  const [selectedGroupForDetails, setSelectedGroupForDetails] = React.useState<ItemGroup | null>(null);

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

  const filteredGroups = React.useMemo(() => {
    return itemGroups.filter(grp => {
      const matchSearch = grp.code.toLowerCase().includes(search.toLowerCase()) ||
                          grp.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                          grp.nameAr.includes(search);
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? grp.active : !grp.active;
      const isNotDeleted = !grp.deletedAt;
      return matchSearch && matchStatus && isNotDeleted;
    });
  }, [itemGroups, search, statusFilter]);

  // Check linked active items
  const getLinkedItems = (groupId: string) => {
    return ppeItems.filter(p => p.active && !p.deletedAt && p.itemGroupId === groupId);
  };

  const handleToggleActive = async (grp: ItemGroup) => {
    if (grp.active) {
      const linked = getLinkedItems(grp.id);
      if (linked.length > 0) {
        if (currentUser.role !== 'Admin') {
          await showInfo(
            'Deactivation Restriction',
            `This item group is assigned to active catalog items (${linked.map(l => l.itemCode).join(', ')}). Only an Admin can override and deactivate it.`
 );
 return;
 }

 setOverrideModal({
 isOpen: true,
 title: `Deactivate In-Use Item Group: ${grp.code}`,
 warning: `This group is assigned to ${linked.length} active catalog item(s). Deactivating it requires an Admin Override reason.`,
          action: () => saveItemGroup({ ...grp, active: false })
        });
        return;
      }
      saveItemGroup({ ...grp, active: false });
    } else {
      saveItemGroup({ ...grp, active: true });
    }
  };

  const handleTrash = async (grp: ItemGroup) => {
    const linked = getLinkedItems(grp.id);
    if (linked.length > 0) {
      if (currentUser.role !== 'Admin') {
        await showInfo(
          'Deletion Restriction',
          'Cannot move item group to trash: Assigned to active catalog items. Only an Admin can override.'
        );
        return;
      }

      setOverrideModal({
        isOpen: true,
        title: `Move In-Use Item Group to Trash: ${grp.code}`,
        warning: `This group is assigned to ${linked.length} active catalog item(s). Moving it to Trash requires an Admin Override reason.`,
        action: () => trashItemGroup(grp.id, 'Admin override: Moved in-use item group to trash')
      });
      return;
    }

    setOverrideModal({
      isOpen: true,
      title: `Move Item Group to Trash: ${grp.code}`,
      warning: `This item group will be moved to the shared Trash Bin (NEW-04).`,
      action: () => trashItemGroup(grp.id, 'Standard deletion')
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('itemGroups')}
        subtitle="Group equipment families and bundle their shared variant attributes and gender match rules"
        action={
          currentUser.role === 'Admin' && (
            <Button size="sm" onClick={() => navigate('/item-groups/new')}>
              <Plus className="w-3.5 h-3.5 me-1.5" /> Add Item Group
            </Button>
          )
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search item groups by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-32">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Layers className="w-8 h-8 text-slate-400" />} title="No item groups found" />}
          columns={[
            {
              key: 'code',
              header: 'Code',
              className: 'w-36 font-mono font-bold text-xs text-slate-900 ',
              render: (item) => item.code
            },
            {
              key: 'name',
              header: 'Bilingual Group Name',
              render: (item) => (
                <div>
                  <span className="font-bold text-slate-900 block">{item.nameEn}</span>
                  <span className="text-[11px] text-slate-500 font-arabic">{item.nameAr}</span>
                </div>
              )
            },
            {
              key: 'attributes',
              header: 'Assigned Attributes (Rule 5)',
              render: (item) => (
                <div className="flex flex-wrap gap-1">
                  {item.assignedAttributeIds.map(aId => {
                    const attr = attributes.find(a => a.id === aId);
                    return (
                      <span key={aId} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-[#E2E8F0] text-[10px] font-mono font-medium">
                        {attr ? attr.nameEn : aId}
                      </span>
                    );
                  })}
                </div>
              )
            },
            {
              key: 'genderMatch',
              header: 'Gender Match',
              className: 'w-36',
              render: (item) => item.requiresGenderMatch ? (
                <StatusBadge status="warning" label="Mandatory Match" />
              ) : (
                <span className="text-slate-400 text-xs">Not required</span>
              )
            },
            {
              key: 'linkedItems',
              header: 'Active Items',
              className: 'w-28 font-mono text-xs',
              render: (item) => {
                const count = getLinkedItems(item.id).length;
                return (
                  <span className="font-semibold text-slate-700 ">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                );
              }
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
              align: 'right',
              className: 'w-24 text-end',
              render: (item) => (
                <TableActionsButtons
                  onView={() => setSelectedGroupForDetails(item)}
                  viewTooltip="View Group Details (BD-I455)"
                  onEdit={currentUser.role === 'Admin' ? () => navigate(`/item-groups/${item.id}/edit`) : undefined}
                  editTooltip="Edit Item Group (BD-I453)"
                  onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
                  deleteTooltip="Move to Trash (BD-I456)"
                  size="sm"
                />
              )
            }
          ]}
        />
      </ContainerCard>

      {/* DETAIL DRAWER (BD-I455) */}
      {selectedGroupForDetails && (
        <SlideOverDrawer
          isOpen={Boolean(selectedGroupForDetails)}
          onClose={() => setSelectedGroupForDetails(null)}
          title={`Item Group: ${selectedGroupForDetails.nameEn}`}
          subtitle={`Code: ${selectedGroupForDetails.code}`}
          width="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Arabic Name</span>
              <p className="font-arabic font-bold text-sm text-slate-900 ">{selectedGroupForDetails.nameAr}</p>
            </div>

            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-white space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Gender Match Status</span>
              <p className="text-xs text-slate-800 ">
                {selectedGroupForDetails.requiresGenderMatch
                  ? 'Gender matching is strictly enforced for this item group. Issuing items in this group requires the variant gender to equal the employee gender or be Unisex.'
                  : 'Gender match is not required for this item group.'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                Assigned Attributes ({selectedGroupForDetails.assignedAttributeIds.length})
              </h4>
              <div className="space-y-1.5">
                {selectedGroupForDetails.assignedAttributeIds.map(aId => {
                  const attr = attributes.find(a => a.id === aId);
                  if (!attr) return null;
                  return (
                    <div key={attr.id} className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 ">{attr.nameEn} ({attr.code})</span>
                        <span className="text-[10px] text-slate-400 font-mono">{attr.values.length} values</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attr.values.map(v => (
                          <span key={v.id} className="px-1.5 py-0.2 bg-white rounded border border-[#E2E8F0] text-[10px] font-mono text-slate-700 ">
                            {v.valueEn}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                Linked Catalog Equipment ({getLinkedItems(selectedGroupForDetails.id).length})
              </h4>
              {(() => {
                const linked = getLinkedItems(selectedGroupForDetails.id);
                if (linked.length === 0) {
                  return <p className="text-slate-400 text-xs italic">No active catalog items linked to this group.</p>;
                }
                return (
                  <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden">
                    {linked.map(item => (
                      <div key={item.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 ">{item.nameEn}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">Code: {item.itemCode}</span>
                        </div>
                        <StatusBadge status={item.riskCategory} size="sm" />
                      </div>
                    ))}
                  </div>
                );
              })()}
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
