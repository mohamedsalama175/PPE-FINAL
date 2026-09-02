import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/ui/EmptyState';
import { SlideOverDrawer } from '../components/ui/SlideOverDrawer';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { Modal } from '../components/ui/Modal';
import { useSwal } from '../lib/useSwal';
import { 
  Box, Plus, Download, Upload, Eye, Edit2, Trash2, 
  Clock, ShieldAlert, AlertTriangle, CheckCircle2, X, FileSpreadsheet, Lock
} from 'lucide-react';
import { PPEItem, RiskCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Catalog() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { showInfo, showToast } = useSwal();
  const { 
    ppeItems, 
    itemGroups, 
    attributes,
    locations, 
    batches, 
    issuances, 
    savePPEItem, 
    trashPPEItem, 
    currentUser 
  } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [groupFilter, setGroupFilter] = React.useState('all');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('active');

  // Detail Drawer state (BD-I476)
  const [selectedItemForDetails, setSelectedItemForDetails] = React.useState<PPEItem | null>(null);

  // Lifespan Quick-Edit Modal state (BD-I445)
  const [itemForLifespanEdit, setItemForLifespanEdit] = React.useState<PPEItem | null>(null);
  const [newLifespanVal, setNewLifespanVal] = React.useState<number>(1);
  const [newLifespanUnit, setNewLifespanUnit] = React.useState<'Days' | 'Months' | 'Years'>('Months');

  // Admin Override Modal state (Rule 3)
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

  // Import Modal state (BD-I486)
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importMode, setImportMode] = React.useState<'new_only' | 'new_and_update'>('new_only');
  const [importPreview, setImportPreview] = React.useState<{
    newCount: number;
    updatedCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  // Filter items
  const filteredItems = React.useMemo(() => {
    return ppeItems.filter(item => {
      const matchSearch = item.itemCode.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameAr.includes(search);
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchGroup = groupFilter === 'all' || item.itemGroupId === groupFilter;
      const matchRisk = riskFilter === 'all' || item.riskCategory === riskFilter;
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? item.active : !item.active;
      const isNotDeleted = !item.deletedAt;

      return matchSearch && matchCat && matchGroup && matchRisk && matchStatus && isNotDeleted;
    });
  }, [ppeItems, search, categoryFilter, groupFilter, riskFilter, statusFilter]);

  // Compute Low Stock locations per item (BD-I466, BD-I475)
  const getItemStockSummary = (item: PPEItem) => {
    let totalOnHand = 0;
    let totalAvailable = 0;
    let lowStockLocationsCount = 0;

    item.locationIds.forEach(locId => {
      const itemBatches = batches.filter(b => b.locationId === locId && b.ppeItemId === item.id);
      const onHand = itemBatches.reduce((acc, b) => acc + b.quantity, 0);
      const available = itemBatches.reduce((acc, b) => acc + b.availableQty, 0);
      const reorder = item.reorderLevels[locId] || 0;

      totalOnHand += onHand;
      totalAvailable += available;

      if (available < reorder && reorder > 0) {
        lowStockLocationsCount++;
      }
    });

    return { totalOnHand, totalAvailable, lowStockLocationsCount };
  };

  // Toggle active with In-Use Protection & Admin Override Modal (Rule 3 & BD-I444)
  const handleToggleActive = async (item: PPEItem) => {
    if (item.active) {
      // Check if item has active issuances
      const hasActiveIssuances = issuances.some(i => i.ppeItemId === item.id && i.status === 'issued');

      if (hasActiveIssuances) {
        if (currentUser.role !== 'Admin') {
          await showInfo(
            'Deactivation Restriction',
            'This item cannot be deactivated because employees currently hold active issuances. Only an Admin can override this restriction.'
          );
          return;
        }

        setOverrideModal({
          isOpen: true,
          title: `Deactivate In-Use Item: ${item.itemCode}`,
          warning: `This item is currently issued to one or more employees. Deactivating it will prevent new issuances and stock receipts, but existing holders will retain their equipment and replacement reminders.`,
          action: () => savePPEItem({ ...item, active: false })
        });
        return;
      }

      savePPEItem({ ...item, active: false });
    } else {
      savePPEItem({ ...item, active: true });
    }
  };

  // Move to trash with In-Use Protection & Admin Override Modal (Rule 3 & BD-I446)
  const handleTrash = async (item: PPEItem) => {
    const hasActiveIssuances = issuances.some(i => i.ppeItemId === item.id && i.status === 'issued');

    if (hasActiveIssuances) {
      if (currentUser.role !== 'Admin') {
        await showInfo(
          'Deletion Restriction',
          'This item cannot be deleted because employees currently hold active issuances. Only an Admin can override this restriction.'
        );
        return;
      }

      setOverrideModal({
        isOpen: true,
        title: `Move In-Use Item to Trash: ${item.itemCode}`,
        warning: `This item is currently held by active employees. Moving it to Trash requires an Admin Override reason. Existing holders will retain a read-only record and reminder tracking.`,
        action: () => trashPPEItem(item.id, 'Admin override: Moved in-use item to trash bin')
      });
      return;
    }

    setOverrideModal({
      isOpen: true,
      title: `Delete Item: ${item.itemCode}`,
      warning: `This item will be moved to the shared Trash Bin (NEW-04). If it has historical transactions, it will be retained permanently; otherwise, it will be eligible for auto-purge after 90 days.`,
      action: () => trashPPEItem(item.id, 'Standard deletion')
    });
  };

  // Lifespan Quick Edit Save (BD-I445)
  const handleSaveLifespan = () => {
    if (!itemForLifespanEdit) return;
    savePPEItem({
      ...itemForLifespanEdit,
      lifespanValue: newLifespanVal,
      lifespanUnit: newLifespanUnit
    }, `Updated lifespan to ${newLifespanVal} ${newLifespanUnit} (Applies to future issuances only)`);
    setItemForLifespanEdit(null);
  };

  // Export Catalog to CSV (BD-I486)
  const handleExport = () => {
    if (filteredItems.length === 0) {
      showToast("No items to export.", "warning");
      return;
    }
    const headers = [
      "Item Code", "Name (EN)", "Name (AR)", "Category", "Item Group", 
      "Risk Category", "Lifespan", "Unit of Measure", "Active", "Assigned Locations", "Reorder Levels"
    ];
    const rows = filteredItems.map(item => {
      const group = itemGroups.find(g => g.id === item.itemGroupId);
      const locNames = item.locationIds.map(id => locations.find(l => l.id === id)?.nameEn).filter(Boolean).join('; ');
      const reorders = Object.entries(item.reorderLevels).map(([locId, val]) => {
        const loc = locations.find(l => l.id === locId);
        return `${loc?.code || locId}:${val}`;
      }).join('; ');

      return [
        `"${item.itemCode}"`,
 `"${item.nameEn}"`,
 `"${item.nameAr}"`,
 `"${item.category}"`,
 `"${group?.nameEn || ''}"`,
 `"${item.riskCategory}"`,
 `"${item.lifespanValue} ${item.lifespanUnit}"`,
 `"${item.uom}"`,
        item.active ? "Yes" : "No",
        `"${locNames}"`,
 `"${reorders}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `PPE_Catalog_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportPreview(null);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      // Offline / demo fallback when no file selected
      handleSimulateImport();
      return;
    }

    setIsImporting(true);
    try {
      const res = await api.importCatalog(selectedFile, importMode);
      setImportPreview({
        newCount: res.imported ?? res.created ?? 0,
        updatedCount: res.updated ?? 0,
        errorCount: res.errors?.length ?? 0,
        errors: res.errors ?? [],
      });
    } catch (err: any) {
      setImportPreview({
        newCount: 0,
        updatedCount: 0,
        errorCount: 1,
        errors: [err.message || 'Catalog import failed'],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Simulate file upload and preview (BD-I486)
  const handleSimulateImport = () => {
    // Simulated catalog import batch
    if (importMode === 'new_only') {
      setImportPreview({
        newCount: 2,
        updatedCount: 0,
        errorCount: 1,
        errors: [
          'Row 3: Item Code "HLM-001" already exists in active catalog. Skipped in Add New Only mode.'
 ]
 });
 } else {
 setImportPreview({
 newCount: 1,
 updatedCount: 3,
 errorCount: 1,
 errors: [
 'Row 4: Attempted to modify locked Item Code for "BOT-003" with active transactions. Row skipped.'
        ]
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title={t('catalog')}
        subtitle="Manage master equipment, dynamic variants, lifespans, and per-location reorder levels"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-3.5 h-3.5 me-1.5" /> Import Catalog
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 me-1.5" /> Export CSV
            </Button>
            {currentUser.role === 'Admin' && (
              <Button size="sm" onClick={() => navigate('/catalog/new')}>
                <Plus className="w-3.5 h-3.5 me-1.5" /> Add PPE Item
              </Button>
            )}
          </div>
        } 
      />

      {/* Filter Bar */}
      <FilterBar>
        <SearchInput 
          placeholder="Search by code or name..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />

        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-36">
          <option value="all">All Categories</option>
          <option value="Head">Head</option>
          <option value="Eye">Eye</option>
          <option value="Hearing">Hearing</option>
          <option value="Hand">Hand</option>
          <option value="Foot">Foot</option>
          <option value="Body">Body</option>
          <option value="Respiratory">Respiratory</option>
          <option value="Fall Protection">Fall Protection</option>
        </Select>

        <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="w-40">
          <option value="all">All Item Groups</option>
          {itemGroups.filter(g => g.active).map(g => (
            <option key={g.id} value={g.id}>{language === 'en' ? g.nameEn : g.nameAr}</option>
          ))}
        </Select>

        <Select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-36">
          <option value="all">All Risk Levels</option>
          <option value="Category I">Category I (Minor)</option>
          <option value="Category II">Category II (Medium)</option>
          <option value="Category III">Category III (Lethal)</option>
        </Select>

        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-28">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      {/* Catalog Table */}
      <ContainerCard noPadding className="overflow-hidden">
        <DataTable 
          data={filteredItems}
          keyExtractor={(item) => item.id}
          emptyState={
            <EmptyState 
              icon={<Box className="w-8 h-8 text-slate-400" />} 
              title="No PPE items found" 
              description="Adjust your search criteria or add a new equipment item to the catalog." 
            />
          }
          columns={[
            {
              key: 'code',
              header: 'Item Code',
              className: 'w-32',
              render: (item) => (
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900 ">
                  <span>{item.itemCode}</span>
                  {item.itemCodeLocked && (
                    <span title="Item Code locked permanently (in-use in transactions)">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'name',
              header: 'Bilingual Name & Model',
              render: (item) => (
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{item.nameEn}</span>
                  <span className="text-[11px] text-slate-500 font-arabic block">{item.nameAr}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{item.manufacturer} • {item.model}</span>
                </div>
              )
            },
            {
              key: 'category',
              header: 'Category & Group',
              className: 'w-44',
              render: (item) => {
                const group = itemGroups.find(g => g.id === item.itemGroupId);
                return (
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">{item.category}</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-medium inline-block">
                      {group ? group.nameEn : 'Standard'}
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'riskCategory',
              header: 'Risk Level',
              className: 'w-32',
              render: (item) => (
                <StatusBadge status={item.riskCategory} />
              )
            },
            {
              key: 'lifespan',
              header: 'Lifespan',
              className: 'w-28',
              render: (item) => (
                <button
                  type="button"
                  onClick={() => {
                    setItemForLifespanEdit(item);
                    setNewLifespanVal(item.lifespanValue);
                    setNewLifespanUnit(item.lifespanUnit);
                  }}
                  className="group flex items-center gap-1 font-mono text-xs text-slate-700 hover:text-primary cursor-pointer"
                  title="Click to edit lifespan (BD-I445)"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary " />
                  <span>{item.lifespanValue} {item.lifespanUnit}</span>
                </button>
              )
            },
            {
              key: 'stockStatus',
              header: 'Stock & Watchlist',
              className: 'w-44',
              render: (item) => {
                const { totalAvailable, lowStockLocationsCount } = getItemStockSummary(item);
                const isOutOfStock = totalAvailable === 0;

                return (
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-slate-800 ">
                      {totalAvailable} {item.uom}
                    </div>
                    {lowStockLocationsCount > 0 ? (
                      <StatusBadge 
                        status="warning" 
                        label={`Low at ${lowStockLocationsCount} ${lowStockLocationsCount === 1 ? 'loc' : 'locs'}`} 
                        size="sm"
                      />
                    ) : isOutOfStock ? (
                      <StatusBadge status="Out of Stock" size="sm" />
                    ) : (
                      <StatusBadge status="Active" label="In Stock" size="sm" />
                    )}
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
              className: 'w-28 text-end',
              render: (item) => (
                <TableActionsButtons
                  onView={() => setSelectedItemForDetails(item)}
                  viewTooltip="View Details (BD-I476)"
                  onEdit={currentUser.role === 'Admin' ? () => navigate(`/catalog/${item.id}/edit`) : undefined}
                  editTooltip="Edit Item (BD-I444)"
                  onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
                  deleteTooltip="Move to Trash (BD-I446)"
                  size="sm"
                />
              )
            }
          ]}
        />
      </ContainerCard>

      {/* ========================================================= */}
      {/* DETAIL DRAWER (BD-I476) */}
      {/* ========================================================= */}
      {selectedItemForDetails && (
        <SlideOverDrawer
          isOpen={Boolean(selectedItemForDetails)}
          onClose={() => setSelectedItemForDetails(null)}
          title={selectedItemForDetails.nameEn}
          subtitle={`Code: ${selectedItemForDetails.itemCode} • ${selectedItemForDetails.category}`}
          width="xl"
          badge={
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              selectedItemForDetails.riskCategory === 'Category III' ? 'bg-red-100 text-red-800' :
              selectedItemForDetails.riskCategory === 'Category II' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {selectedItemForDetails.riskCategory}
            </span>
          }
        >
          <div className="space-y-5">
            {/* Bilingual Names & Specs */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Arabic Name</span>
                <p className="font-arabic font-bold text-sm text-slate-900">{selectedItemForDetails.nameAr}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Standard Certification</span>
                  <p className="font-semibold text-slate-800">{selectedItemForDetails.standardCertification || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Unit of Measure</span>
                  <p className="font-semibold text-slate-800">{selectedItemForDetails.uom}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Manufacturer & Model</span>
                  <p className="font-semibold text-slate-800">{selectedItemForDetails.manufacturer} • {selectedItemForDetails.model}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Configured Lifespan</span>
                  <p className="font-semibold text-slate-800">{selectedItemForDetails.lifespanValue} {selectedItemForDetails.lifespanUnit}</p>
                </div>
              </div>
            </div>

            {/* Dynamic Variants from Item Group (Rule 5) */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700">
                Dynamic Variants (From Item Group)
              </h4>
              {(() => {
                const group = itemGroups.find(g => g.id === selectedItemForDetails.itemGroupId);
                if (!group || group.assignedAttributeIds.length === 0) {
                  return <p className="text-slate-400 italic">No variant attributes assigned to this item group.</p>;
                }
                return (
                  <div className="space-y-2">
                    {group.assignedAttributeIds.map(attrId => {
                      const attr = attributes.find(a => a.id === attrId);
                      if (!attr) return null;
                      return (
                        <div key={attr.id} className="p-2.5 bg-white border border-slate-200 rounded">
                          <span className="text-[11px] font-bold text-slate-800">{attr.nameEn} ({attr.code}):</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {attr.values.filter(v => v.active).map(val => (
                              <span key={val.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-medium">
                                {val.valueEn} / {val.valueAr}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Per-Location Reorder Levels & Live Stock Summary */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-xs text-slate-700">
                Assigned Locations & Stock Levels
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedItemForDetails.locationIds.map(locId => {
                  const loc = locations.find(l => l.id === locId);
                  const itemBatches = batches.filter(b => b.locationId === locId && b.ppeItemId === selectedItemForDetails.id);
                  const onHand = itemBatches.reduce((acc, b) => acc + b.quantity, 0);
                  const available = itemBatches.reduce((acc, b) => acc + b.availableQty, 0);
                  const reorder = selectedItemForDetails.reorderLevels[locId] || 0;
                  const isLow = available < reorder;

                  return (
                    <div key={locId} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{loc?.nameEn || locId}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Site: {loc?.site} • Condition: {loc?.stockCondition}</span>
                      </div>
                      <div className="text-end font-mono">
                        <span className="font-bold text-slate-900">{available} Avail</span>
                        <span className="text-slate-400 text-[10px] block">Reorder at: {reorder}</span>
                        {isLow && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">
                            Below Reorder
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issuance Count */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
              <span className="font-medium">Currently Held by Active Employees:</span>
              <span className="font-extrabold text-sm font-mono">
                {issuances.filter(i => i.ppeItemId === selectedItemForDetails.id && i.status === 'issued').length} units
              </span>
            </div>
          </div>
        </SlideOverDrawer>
      )}

      {/* ========================================================= */}
      {/* QUICK LIFESPAN EDIT MODAL (BD-I445) */}
      {/* ========================================================= */}
      <Modal
        opened={Boolean(itemForLifespanEdit)}
        onClose={() => setItemForLifespanEdit(null)}
        title="Edit Item Lifespan (BD-I445)"
        subtitle={itemForLifespanEdit ? `${itemForLifespanEdit.nameEn} (${itemForLifespanEdit.itemCode})` : undefined}
        icon={<Clock className="w-5 h-5 text-primary" />}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" color="secondary" size="sm" onClick={() => setItemForLifespanEdit(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveLifespan}>
              Save Lifespan
            </Button>
          </div>
        }
      >
        {itemForLifespanEdit && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 ">
              Changes apply strictly to <strong>future issuances only</strong> and will not recalculate dates for existing equipment holders.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Lifespan Value"
                type="number"
                min={1}
                value={newLifespanVal}
                onChange={e => setNewLifespanVal(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <Select
                label="Unit"
                value={newLifespanUnit}
                onChange={val => setNewLifespanUnit((val as any) || 'Months')}
                data={['Days', 'Months', 'Years']}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* CATALOG IMPORT MODAL (BD-I486) */}
      {/* ========================================================= */}
      <Modal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Catalog from Spreadsheet (BD-I486)"
        icon={<FileSpreadsheet className="w-5 h-5 text-teal-600" />}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" color="secondary" size="sm" onClick={() => setImportModalOpen(false)}>
              Close
            </Button>
            {importPreview && (
              <Button size="sm" onClick={() => setImportModalOpen(false)}>
                Done
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">Import Mode *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[#E2E8F0] bg-white ">
                <input 
                  type="radio" 
                  name="importMode" 
                  checked={importMode === 'new_only'} 
                  onChange={() => setImportMode('new_only')} 
                  className="text-primary focus:ring-primary"
                />
                <span className="text-slate-700 "><strong>Add New Only:</strong> Skips rows if Item Code already exists in system.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[#E2E8F0] bg-white ">
                <input 
                  type="radio" 
                  name="importMode" 
                  checked={importMode === 'new_and_update'} 
                  onChange={() => setImportMode('new_and_update')} 
                  className="text-primary focus:ring-primary"
                />
                <span className="text-slate-700 "><strong>Add New and Update Existing:</strong> Updates matching items (locked codes cannot be modified).</span>
              </label>
            </div>
          </div>

          {/* Upload trigger */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv" 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-center space-y-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            {selectedFile ? (
              <div>
                <p className="text-xs font-semibold text-teal-700 ">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — click to change</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 ">Select `.csv` catalog template file</p>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              color="secondary"
              disabled={isImporting}
              onClick={(e) => {
                e.stopPropagation();
                handleExecuteImport();
              }}
            >
              {isImporting ? "Processing..." : selectedFile ? "Upload & Import" : "Simulate Demo Parse"}
            </Button>
          </div>

          {/* Preview Step */}
          {importPreview && (
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Validation Preview:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 ">
                  <span className="text-emerald-700 font-extrabold text-sm block">{importPreview.newCount}</span>
                  <span className="text-[10px] text-emerald-800 ">New Items</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 ">
                  <span className="text-blue-700 font-extrabold text-sm block">{importPreview.updatedCount}</span>
                  <span className="text-[10px] text-blue-800 ">Updated</span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg border border-red-200 ">
                  <span className="text-red-700 font-extrabold text-sm block">{importPreview.errorCount}</span>
                  <span className="text-[10px] text-red-800 ">Errors / Skipped</span>
                </div>
              </div>

              {importPreview.errors.length > 0 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-900 space-y-1">
                  <span className="font-bold block">Downloadable Error Report:</span>
                  {importPreview.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Admin Override Modal (Rule 3) */}
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
