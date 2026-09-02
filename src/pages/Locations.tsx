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
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
import { 
  MapPin, Plus, Eye, Edit2, Trash2, AlertOctagon, 
  Warehouse, ShieldCheck, Lock, AlertTriangle, Users
} from 'lucide-react';
import { Location } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Locations() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { showInfo, showConfirm } = useSwal();
  const { 
    locations, 
    employees, 
    batches, 
    ppeItems, 
    visitorLoans, 
    saveLocation, 
    trashLocation, 
    currentUser 
  } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [siteFilter, setSiteFilter] = React.useState('all');
  const [conditionFilter, setConditionFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('active');

  const [selectedLocForDetails, setSelectedLocForDetails] = React.useState<Location | null>(null);

  // Filter locations
  const filteredLocations = React.useMemo(() => {
    return locations.filter(loc => {
      const matchSearch = loc.code.toLowerCase().includes(search.toLowerCase()) ||
                          loc.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                          loc.nameAr.includes(search);
      const matchSite = siteFilter === 'all' || loc.site === siteFilter;
      const matchCondition = conditionFilter === 'all' || loc.stockCondition === conditionFilter;
      const matchType = typeFilter === 'all' || loc.locationType === typeFilter;
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? loc.active : !loc.active;
      const isNotDeleted = !loc.deletedAt;

      return matchSearch && matchSite && matchCondition && matchType && matchStatus && isNotDeleted;
    });
  }, [locations, search, siteFilter, conditionFilter, typeFilter, statusFilter]);

  const uniqueSites = React.useMemo(() => Array.from(new Set(locations.map(l => l.site))), [locations]);

  // Compute location stock & hard-block constraints (Rule 3 & BD-I459, BD-I461)
  const getLocationMeta = (loc: Location) => {
    const locBatches = batches.filter(b => b.locationId === loc.id);
    const onHand = locBatches.reduce((acc, b) => acc + b.quantity, 0);
    const available = locBatches.reduce((acc, b) => acc + b.availableQty, 0);
    const quarantined = locBatches.reduce((acc, b) => acc + b.quarantinedQty, 0);

    // Hard block check: On hand > 0 (Scrap locations exempt)
    const hasStockOnHand = onHand > 0 && loc.stockCondition !== 'Scrap';

    // Hard block check: Only assigned location for an active catalog item
    const isOnlyLocationForActiveItem = ppeItems.some(item => 
      item.active && !item.deletedAt && item.locationIds.length === 1 && item.locationIds[0] === loc.id
    );

    // Hard block check: Has open or partially returned loans
    const hasOpenLoans = visitorLoans.some(loan => 
      (loan.status === 'Open' || loan.status === 'Overdue' || loan.status === 'Partially Returned') &&
      (loan.fromLocationId === loc.id || loan.items.some(i => i.fromLocationId === loc.id))
    );

    const isHardBlocked = hasStockOnHand || isOnlyLocationForActiveItem || hasOpenLoans;

    let hardBlockReason = '';
    if (hasStockOnHand) hardBlockReason = `Contains ${onHand} units on hand. Scrap locations are exempt, but New/Used locations holding stock cannot be deactivated or trashed.`;
    else if (isOnlyLocationForActiveItem) hardBlockReason = `It is the only assigned location for one or more active catalog items.`;
    else if (hasOpenLoans) hardBlockReason = `It is currently associated with an open or overdue loan.`;

    const capacityUsedPercent = loc.capacityUnits > 0 ? Math.round((onHand / loc.capacityUnits) * 100) : 0;

    return { onHand, available, quarantined, isHardBlocked, hardBlockReason, capacityUsedPercent };
  };

  const handleToggleActive = async (loc: Location) => {
    const meta = getLocationMeta(loc);
    if (loc.active && meta.isHardBlocked) {
      await showInfo(
        'Strict Hard Block (No Override Allowed)',
        `Cannot deactivate location "${loc.nameEn}".\n\nReason: ${meta.hardBlockReason}`
      );
      return;
    }

    saveLocation({ ...loc, active: !loc.active });
  };

  const handleTrash = async (loc: Location) => {
    const meta = getLocationMeta(loc);
    if (meta.isHardBlocked) {
      await showInfo(
        'Strict Hard Block (No Override Allowed)',
        `Cannot delete location "${loc.nameEn}".\n\nReason: ${meta.hardBlockReason}`
      );
      return;
    }

    const confirmed = await showConfirm(
      'Move to Trash',
      `Move location "${loc.nameEn}" (${loc.code}) to the Trash Bin?`,
      'Move to Trash',
      true
    );
    if (confirmed) {
      trashLocation(loc.id, 'Standard location deletion');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('locations')}
        subtitle="Manage warehouse facilities, stock condition flags (New/Used/Scrap), and store keeper assignments"
        action={
          currentUser.role === 'Admin' && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/settings/store-keeper-assignments')}>
                <Users className="w-3.5 h-3.5 me-1" /> Access Matrix
              </Button>
              <Button size="sm" onClick={() => navigate('/locations/new')}>
                <Plus className="w-3.5 h-3.5 me-1.5" /> Add Location
              </Button>
            </div>
          )
        }
      />

      <FilterBar>
        <SearchInput
          placeholder="Search by code or location name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="w-36">
          <option value="all">All Sites</option>
          {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="w-36">
          <option value="all">All Stock Conditions</option>
          <option value="New">New Stock</option>
          <option value="Used">Used / Reused</option>
          <option value="Scrap">Scrap</option>
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-40">
          <option value="all">All Facility Types</option>
          <option value="Central Warehouse">Central Warehouse</option>
          <option value="Site Store">Site Store</option>
          <option value="Department Store">Department Store</option>
          <option value="General">General</option>
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-28">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredLocations}
          keyExtractor={(item) => item.id}
          emptyState={<EmptyState icon={<Warehouse className="w-8 h-8 text-slate-400" />} title="No locations found" />}
          columns={[
            {
              key: 'code',
              header: 'Code',
              className: 'w-36 font-mono font-bold text-xs text-slate-900 ',
              render: (loc) => loc.code
            },
            {
              key: 'name',
              header: 'Name & Site',
              render: (loc) => (
                <div>
                  <span className="font-bold text-slate-900 block">{loc.nameEn}</span>
                  <span className="text-[11px] text-slate-500 font-arabic">{loc.nameAr}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">Site: {loc.site} • {loc.locationType}</span>
                </div>
              )
            },
            {
              key: 'condition',
              header: 'Stock Condition (Rule 4)',
              className: 'w-36',
              render: (loc) => (
                <StatusBadge status={loc.stockCondition} />
              )
            },
            {
              key: 'capacity',
              header: 'Capacity & Stock',
              className: 'w-44',
              render: (loc) => {
                const meta = getLocationMeta(loc);
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-800 ">{meta.onHand} On Hand</span>
                      <span className="text-slate-400">
                        {loc.stockCondition === 'Scrap' ? 'No limit' : `/ ${loc.capacityUnits}`}
                      </span>
                    </div>
                    {loc.stockCondition !== 'Scrap' && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${meta.capacityUsedPercent > 100 ? 'bg-danger' : 'bg-primary'}`}
 style={{ width: `${Math.min(100, meta.capacityUsedPercent)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'storeKeepers',
              header: 'Assigned Keepers (BD-I462)',
              render: (loc) => {
                const keepers = employees.filter(e => loc.assignedStoreKeeperIds.includes(e.id));
                if (keepers.length === 0) {
                  return <span className="text-danger font-semibold text-[11px]">Unassigned</span>;
                }
                return (
                  <div className="flex flex-wrap gap-1">
                    {keepers.map(k => (
                      <span key={k.id} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-[#E2E8F0] text-[10px] font-medium">
                        {k.name}
                      </span>
                    ))}
                  </div>
                );
              }
            },
            {
              key: 'obStatus',
              header: 'Opening Bal',
              className: 'w-28 text-center',
              render: (loc) => (
                <StatusBadge 
                  status={loc.openingBalanceStatus === 'Open' ? 'warning' : 'neutral'} 
                  label={loc.openingBalanceStatus} 
                />
              )
            },
            {
              key: 'active',
              header: 'Active',
              className: 'w-20 text-center',
              render: (loc) => {
                const meta = getLocationMeta(loc);
                return (
                  <div title={meta.isHardBlocked ? meta.hardBlockReason : undefined}>
                    <ToggleSwitch
                      checked={loc.active}
                      onChange={() => handleToggleActive(loc)}
                    />
                  </div>
                );
              }
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              className: 'w-24 text-end',
              render: (loc) => {
                const meta = getLocationMeta(loc);
                return (
                  <TableActionsButtons
                    onView={() => setSelectedLocForDetails(loc)}
                    viewTooltip="View Location Details (BD-I460)"
                    onEdit={currentUser.role === 'Admin' ? () => navigate(`/locations/${loc.id}/edit`) : undefined}
                    editTooltip="Edit Location (BD-I458)"
                    onDelete={currentUser.role === 'Admin' ? () => handleTrash(loc) : undefined}
                    deleteTooltip={meta.isHardBlocked ? `HARD BLOCKED: ${meta.hardBlockReason}` : 'Move to Trash (BD-I461)'}
                    size="sm"
                  />
                );
              }
            }
          ]}
        />
      </ContainerCard>

      {/* DETAIL DRAWER (BD-I460) */}
      {selectedLocForDetails && (
        <SlideOverDrawer
          isOpen={Boolean(selectedLocForDetails)}
          onClose={() => setSelectedLocForDetails(null)}
          title={`Location: ${selectedLocForDetails.nameEn}`}
          subtitle={`Code: ${selectedLocForDetails.code} • Site: ${selectedLocForDetails.site}`}
          width="lg"
          badge={<StatusBadge status={selectedLocForDetails.stockCondition} />}
        >
          {(() => {
            const meta = getLocationMeta(selectedLocForDetails);
            const locBatches = batches.filter(b => b.locationId === selectedLocForDetails.id);

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Facility Type</span>
                    <p className="font-semibold text-slate-800 ">{selectedLocForDetails.locationType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Opening Balance Status</span>
                    <p className="font-bold text-amber-800 ">{selectedLocForDetails.openingBalanceStatus}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Capacity Units</span>
                    <p className="font-semibold text-slate-800 ">
                      {selectedLocForDetails.stockCondition === 'Scrap' ? 'Optional (No limit)' : selectedLocForDetails.capacityUnits}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Capacity Used</span>
                    <p className="font-semibold text-slate-800 ">{meta.capacityUsedPercent}%</p>
                  </div>
                </div>

                {meta.isHardBlocked && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-900 ">
                    <AlertOctagon className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Hard-Block Deactivation Guard Active:</span>
                      <p className="text-[11px] leading-relaxed">{meta.hardBlockReason}</p>
                    </div>
                  </div>
                )}

                {/* Assigned Keepers */}
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                    Responsible Store Keeper(s) (BD-I462)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {employees.filter(e => selectedLocForDetails.assignedStoreKeeperIds.includes(e.id)).map(k => (
                      <span key={k.id} className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-800 ">
                        {k.name} ({k.employeeCode})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Stock Summary */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700 ">
                    Live Stock Batches in Location ({locBatches.length})
                  </h4>
                  {locBatches.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Location currently holds zero stock.</p>
                  ) : (
                    <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden">
                      {locBatches.map(b => {
                        const ppe = ppeItems.find(p => p.id === b.ppeItemId);
                        return (
                          <div key={b.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900 ">{ppe?.nameEn || b.ppeItemId}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">Batch: {b.batchNumber}</span>
                            </div>
                            <div className="text-end font-mono">
                              <span className="font-bold text-slate-900 ">{b.availableQty} Avail</span>
                              <span className="text-[10px] text-slate-400 block">{b.quantity} on hand</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </SlideOverDrawer>
      )}
    </div>
  );
}
