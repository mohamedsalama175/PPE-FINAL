import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { Location, LocationType, StockCondition } from '../types';
import { ArrowLeft, Lock, AlertTriangle, Warehouse } from 'lucide-react';

const SITES = ['Cairo Site', 'Alexandria Site', 'Main Campus'];
const LOCATION_TYPES: LocationType[] = ['Central Warehouse', 'Site Store', 'Department Store', 'General'];
const STOCK_CONDITIONS: StockCondition[] = ['New', 'Used', 'Scrap'];

export default function LocationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locations, employees, batches, saveLocation } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEditing = Boolean(id);
  const existingLoc = isEditing ? locations.find(l => l.id === id) : null;

  // Check if location has held stock (locks Code and Stock Condition)
  const hasHeldStock = React.useMemo(() => {
    if (!existingLoc) return false;
    return existingLoc.hasHeldStock || batches.some(b => b.locationId === existingLoc.id);
  }, [existingLoc, batches]);

  // Current stock on hand for capacity lowering warning
  const currentStockOnHand = React.useMemo(() => {
    if (!existingLoc) return 0;
    return batches.filter(b => b.locationId === existingLoc.id).reduce((acc, b) => acc + b.quantity, 0);
  }, [existingLoc, batches]);

  const [formData, setFormData] = React.useState<Location>(() => {
    if (existingLoc) return { ...existingLoc };
    return {
      id: '',
      code: '',
      nameEn: '',
      nameAr: '',
      site: 'Cairo Site',
      locationType: 'Site Store',
      stockCondition: 'New',
      description: '',
      capacityUnits: 200,
      address: '',
      assignedStoreKeeperIds: [],
      openingBalanceStatus: 'Open',
      active: true,
      hasHeldStock: false
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [capacityWarning, setCapacityWarning] = React.useState<string | null>(null);

  // Filter store keepers
  const storeKeepers = React.useMemo(() => {
    return employees.filter(e => e.role === 'Store Keeper' && e.active);
  }, [employees]);

  const handleKeeperToggle = (empId: string) => {
    const isAssigned = formData.assignedStoreKeeperIds.includes(empId);
    if (isAssigned) {
      setFormData({
        ...formData,
        assignedStoreKeeperIds: formData.assignedStoreKeeperIds.filter(id => id !== empId)
      });
    } else {
      setFormData({
        ...formData,
        assignedStoreKeeperIds: [...formData.assignedStoreKeeperIds, empId]
      });
    }
  };

  const handleCapacityChange = (val: number) => {
    const newCap = Math.max(0, val);
    setFormData({ ...formData, capacityUnits: newCap });

    if (formData.stockCondition !== 'Scrap' && currentStockOnHand > 0 && newCap < currentStockOnHand) {
      setCapacityWarning(`Warning: New capacity (${newCap}) is lower than current stock on hand (${currentStockOnHand}). This will result in an overcapacity state.`);
    } else {
      setCapacityWarning(null);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) errs.code = 'Location Code is required.';
    else {
      const duplicate = locations.find(l => l.code.toLowerCase() === formData.code.trim().toLowerCase() && l.id !== formData.id);
      if (duplicate) errs.code = 'A location with this Code already exists.';
    }

    if (!formData.nameEn.trim()) errs.nameEn = 'English Name is required.';
    if (!formData.nameAr.trim()) errs.nameAr = 'Arabic Name is required.';

    // Capacity required for New and Used locations (BD-I457)
    if (formData.stockCondition !== 'Scrap' && formData.capacityUnits <= 0) {
      errs.capacity = 'Capacity units must be a positive whole number for New and Used locations.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please resolve validation errors before saving.', 'error');
      return;
    }

    saveLocation({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      hasHeldStock: hasHeldStock || formData.hasHeldStock
    });

    addToast(isEditing ? 'Location updated successfully.' : 'New Location created.', 'success');
    navigate('/locations');
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="outline" color="secondary" size="sm" onClick={() => navigate('/locations')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Locations
        </Button>
      </div>

      <PageHeader
        title={isEditing ? `Edit Location: ${formData.code}` : 'Add New Location (BD-I457)'}
        subtitle="Configure warehouse facility, stock condition rules (Rule 4), and responsible store keepers"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContainerCard title="Facility Identification">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Location Code"
              required
              disabled={hasHeldStock}
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="e.g. LOC-CAI-NEW"
              error={errors.code}
              helperText={hasHeldStock ? "Location Code is permanently locked because this facility holds inventory." : undefined}
              endIcon={hasHeldStock ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : undefined}
              className="font-mono font-bold uppercase"
            />

            <Input
              label="Facility Name (EN)"
              required
              value={formData.nameEn}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="e.g. Cairo Main Store"
              error={errors.nameEn}
            />

            <Input
              label="Facility Name (AR)"
              required
              dir="rtl"
              value={formData.nameAr}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="مثال: مستودع القاهرة الرئيسي"
              error={errors.nameAr}
              className="font-arabic"
            />
          </div>
        </ContainerCard>

        {/* Site & Stock Condition (Rules 4, 13) */}
        <ContainerCard 
          title="Site, Type & Stock Condition (Rule 4)" 
          subtitle="Condition locks permanently once stock is held"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Site Location"
              required
              value={formData.site}
              onChange={val => setFormData({ ...formData, site: val || 'Cairo Site' })}
              data={SITES}
            />

            <Select
              label="Facility Type"
              required
              value={formData.locationType}
              onChange={val => setFormData({ ...formData, locationType: (val as LocationType) || 'Site Store' })}
              data={LOCATION_TYPES}
            />

            <Select
              label="Stock Condition Flag"
              required
              disabled={hasHeldStock}
              value={formData.stockCondition}
              onChange={val => setFormData({ ...formData, stockCondition: (val as StockCondition) || 'New' })}
              data={STOCK_CONDITIONS}
              helperText={hasHeldStock ? "Stock condition cannot be changed once stock is held." : undefined}
            />
          </div>

          {/* Capacity Units */}
          <div className="pt-3 max-w-xs">
            <Input
              label={`Capacity Units ${formData.stockCondition === 'Scrap' ? '(Optional for Scrap)' : ''}`}
              type="number"
              min={0}
              required={formData.stockCondition !== 'Scrap'}
              value={formData.capacityUnits}
              onChange={e => handleCapacityChange(parseInt(e.target.value) || 0)}
              error={errors.capacity}
              endIcon={<span className="text-xs text-slate-400 font-mono">units</span>}
            />
            {capacityWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium mt-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{capacityWarning}</span>
              </div>
            )}
          </div>
        </ContainerCard>

        {/* Responsible Store Keepers (BD-I462) */}
        <ContainerCard
          title="Responsible Store Keeper(s) (BD-I462)"
          subtitle="Check Store Keepers who have operational authorization for this warehouse facility."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {storeKeepers.map(keeper => {
              const isAssigned = formData.assignedStoreKeeperIds.includes(keeper.id);

              return (
                <div
                  key={keeper.id}
                  onClick={() => handleKeeperToggle(keeper.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${
                    isAssigned 
                      ? 'bg-primary-light/40 border-primary/50' 
                      : 'bg-slate-50 border-[#E2E8F0] hover:border-slate-300 '
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{keeper.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {keeper.employeeCode}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => {}}
                    className="rounded text-primary focus:ring-primary cursor-pointer pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </ContainerCard>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] ">
          <Button type="button" variant="outline" color="secondary" onClick={() => navigate('/locations')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Location' : 'Create Location'}
          </Button>
        </div>
      </form>
    </div>
  );
}
