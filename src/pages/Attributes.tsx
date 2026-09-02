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
import { Tags, Plus, Eye, Edit2, Trash2, Layers } from 'lucide-react';
import { Attribute } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Attributes() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { showInfo } = useSwal();
  const { attributes, itemGroups, saveAttribute, trashAttribute, currentUser } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('active');
  const [selectedAttrForDetails, setSelectedAttrForDetails] = React.useState<Attribute | null>(null);

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

  const filteredAttributes = React.useMemo(() => {
    return attributes.filter(attr => {
      const matchSearch = attr.code.toLowerCase().includes(search.toLowerCase()) ||
                          attr.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                          attr.nameAr.includes(search);
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? attr.active : !attr.active;
      const isNotDeleted = !attr.deletedAt;
      return matchSearch && matchStatus && isNotDeleted;
    });
  }, [attributes, search, statusFilter]);

  // Check if attribute is linked to any active Item Group
  const getLinkedGroups = (attrId: string) => {
    return itemGroups.filter(g => g.active && !g.deletedAt && g.assignedAttributeIds.includes(attrId));
  };

  const handleToggleActive = async (attr: Attribute) => {
    if (attr.active) {
      const linked = getLinkedGroups(attr.id);
      if (linked.length > 0) {
        if (currentUser.role !== 'Admin') {
          await showInfo(
            'Deactivation Restriction',
            `This attribute is currently linked to active Item Groups (${linked.map(l => l.nameEn).join(', ')}). Only an Admin can override and deactivate it.`
 );
 return;
 }

 setOverrideModal({
 isOpen: true,
 title: `Deactivate In-Use Attribute: ${attr.code}`,
 warning: `This attribute is currently linked to ${linked.length} active Item Group(s) (${linked.map(l => l.nameEn).join(', ')}). Deactivating it requires an Admin Override reason.`,
          action: () => saveAttribute({ ...attr, active: false })
        });
        return;
      }
      saveAttribute({ ...attr, active: false });
    } else {
      saveAttribute({ ...attr, active: true });
    }
  };

  const handleTrash = async (attr: Attribute) => {
    const linked = getLinkedGroups(attr.id);
    if (linked.length > 0) {
      if (currentUser.role !== 'Admin') {
        await showInfo(
          'Deletion Restriction',
          'Cannot move attribute to trash: Linked to active Item Groups. Only an Admin can override.'
        );
        return;
      }

      setOverrideModal({
        isOpen: true,
        title: `Move In-Use Attribute to Trash: ${attr.code}`,
        warning: `This attribute is linked to ${linked.length} Item Group(s). Deleting it will unlink it from those groups while preserving historical issuance values. An Admin Override reason is required.`,
        action: () => trashAttribute(attr.id, 'Admin override: Moved in-use attribute to trash')
      });
      return;
    }

    setOverrideModal({
      isOpen: true,
      title: `Move Attribute to Trash: ${attr.code}`,
      warning: `This attribute will be moved to the shared Trash Bin (NEW-04).`,
      action: () => trashAttribute(attr.id, 'Standard deletion')
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('attributes')}
        subtitle="Define global variant specifications (Sizes, Colors, Gender) for dynamic equipment generation"
        action={
          currentUser.role === 'Admin' && (
            <Button size="sm" onClick={() => navigate('/attributes/new')}>
              <Plus className="w-3.5 h-3.5 me-1.5" /> Add Attribute
            </Button>
          )
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search attributes by code or name..."
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
          data={filteredAttributes}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Tags className="w-8 h-8 text-slate-400" />} title="No attributes found" />}
          columns={[
            {
              key: 'code',
              header: 'Code',
              className: 'w-36 font-mono font-bold text-xs text-slate-900 ',
              render: (item) => item.code
            },
            {
              key: 'name',
              header: 'Bilingual Name',
              render: (item) => (
                <div>
                  <span className="font-bold text-slate-900 block">{item.nameEn}</span>
                  <span className="text-[11px] text-slate-500 font-arabic">{item.nameAr}</span>
                </div>
              )
            },
            {
              key: 'values',
              header: 'Configured Values',
              render: (item) => (
                <div className="flex flex-wrap gap-1">
                  {item.values.map(val => (
                    <span 
                      key={val.id} 
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        val.active 
                          ? 'bg-slate-100 text-slate-800 border border-[#E2E8F0] ' 
                          : 'bg-slate-50 text-slate-400 line-through'
                      }`}
                    >
                      {val.valueEn}
                    </span>
                  ))}
                </div>
              )
            },
            {
              key: 'usage',
              header: 'Linked Groups',
              className: 'w-48',
              render: (item) => {
                const linked = getLinkedGroups(item.id);
                if (linked.length === 0) {
                  return <span className="text-slate-400 text-xs italic">Not currently used</span>;
                }
                return (
                  <div className="flex flex-wrap gap-1">
                    {linked.map(g => (
                      <span key={g.id} className="px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[10px] font-medium">
                        {g.nameEn}
                      </span>
                    ))}
                  </div>
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
                  onView={() => setSelectedAttrForDetails(item)}
                  viewTooltip="View Attribute Details (BD-I450)"
                  onEdit={currentUser.role === 'Admin' ? () => navigate(`/attributes/${item.id}/edit`) : undefined}
                  editTooltip="Edit Attribute (BD-I448)"
                  onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
                  deleteTooltip="Move to Trash (BD-I451)"
                  size="sm"
                />
              )
            }
          ]}
        />
      </ContainerCard>

      {/* DETAIL DRAWER (BD-I450) */}
      {selectedAttrForDetails && (
        <SlideOverDrawer
          isOpen={Boolean(selectedAttrForDetails)}
          onClose={() => setSelectedAttrForDetails(null)}
          title={`Attribute: ${selectedAttrForDetails.nameEn}`}
          subtitle={`Code: ${selectedAttrForDetails.code}`}
          width="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Arabic Name</span>
              <p className="font-arabic font-bold text-sm text-slate-900 ">{selectedAttrForDetails.nameAr}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                Configured Values ({selectedAttrForDetails.values.length})
              </h4>
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0] ">
                {selectedAttrForDetails.values.map(val => (
                  <div key={val.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 ">{val.valueEn}</span>
                      <span className="text-slate-500 font-arabic ms-2">({val.valueAr})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">Order: {val.sortOrder}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        val.active ? 'bg-emerald-100 text-emerald-800 ' : 'bg-slate-100 text-slate-500 '
                      }`}>
                        {val.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                Linked Item Groups
              </h4>
              {(() => {
                const linked = getLinkedGroups(selectedAttrForDetails.id);
                if (linked.length === 0) {
                  return <p className="text-slate-400 text-xs italic">Not currently used in any active Item Group.</p>;
                }
                return (
                  <div className="space-y-1.5">
                    {linked.map(g => (
                      <div key={g.id} className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-800 ">{g.nameEn}</span>
                        <span className="font-mono text-[10px] text-teal-700 font-bold">{g.code}</span>
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
