import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { generateId } from '../lib/utils';
import { Location, LocationType, StockCondition } from '../types';
import { Lock, Search, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LocationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { locations, employees, stockBalances, saveEntity, locationHasStock } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<Location>>({
    code: '',
    nameEn: '',
    nameAr: '',
    site: 'Main Campus',
    locationType: 'Central Warehouse',
    stockCondition: 'New',
    description: '',
    capacityUnits: 200,
    address: '',
    assignedStoreKeeperIds: [],
    active: true
  });

  const [skSearch, setSkSearch] = React.useState('');

  // PPE-019: Location Code and Stock Condition are locked once the location holds stock
  const isLockedByStock = React.useMemo(() => {
    if (!isEdit || !id) return false;
    return locationHasStock(id);
  }, [isEdit, id, locationHasStock]);

  const currentHeldStock = React.useMemo(() => {
    if (!isEdit || !id) return 0;
    return stockBalances
      .filter(b => b.locationId === id)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);
  }, [isEdit, id, stockBalances]);

  React.useEffect(() => {
    if (isEdit && id) {
      const loc = locations.find(l => l.id === id);
      if (loc) {
        setFormData({
          ...loc,
          stockCondition: loc.stockCondition || (loc.locationType === 'Scrap' ? 'Scrap' : loc.locationType === 'Used' ? 'Used' : 'New')
        });
      }
    }
  }, [id, isEdit, locations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const code = (formData.code || '').trim().toUpperCase();
    if (!code || !formData.nameEn?.trim() || !formData.site?.trim()) {
      addToast('Location Code, English Name, and Site are required.', 'error');
      return;
    }

    // Check duplicate code
    const duplicate = locations.find(l => l.code.toLowerCase() === code.toLowerCase() && l.id !== id && !l.deletedAt);
    if (duplicate) {
      addToast(`Location Code "${code}" is already in use.`, 'error');
      return;
    }

    // Stock Condition check
    if (!formData.stockCondition) {
      addToast('Stock Condition (New, Used, or Scrap) is required.', 'error');
      return;
    }

    // Capacity validation: Required unless Scrap
    const isScrap = formData.stockCondition === 'Scrap';
    const capacity = Number(formData.capacityUnits);
    if (!isScrap && (!capacity || capacity <= 0)) {
      addToast('Capacity Units is required for New and Used locations and must be greater than zero.', 'error');
      return;
    }

    // PPE-019: If new capacity is below stock currently held, show warning and still allow saving
    if (isEdit && !isScrap && capacity < currentHeldStock) {
      const proceed = window.confirm(
        `Warning: The entered capacity (${capacity} units) is below the stock currently stored at this location (${currentHeldStock} units). Save anyway?`
      );
      if (!proceed) return;
    }

    saveEntity('locations', {
      ...formData,
      code,
      capacityUnits: isScrap ? (capacity || 0) : capacity,
      id: isEdit ? id : generateId()
    } as Location);

    addToast(isEdit ? 'Location updated successfully.' : 'Location created successfully.', 'success');
    navigate('/locations');
  };

  const storeKeepers = React.useMemo(() => {
    return employees.filter(e => e.role === 'Store Keeper' && e.active && !e.deletedAt);
  }, [employees]);

  const filteredStoreKeepers = React.useMemo(() => {
    if (!skSearch.trim()) return storeKeepers;
    const q = skSearch.toLowerCase();
    return storeKeepers.filter(sk => 
      sk.name.toLowerCase().includes(q) || sk.employeeCode.toLowerCase().includes(q)
    );
  }, [storeKeepers, skSearch]);

  const toggleStoreKeeper = (empId: string) => {
    setFormData(prev => {
      const ids = prev.assignedStoreKeeperIds || [];
      if (ids.includes(empId)) {
        return { ...prev, assignedStoreKeeperIds: ids.filter(i => i !== empId) };
      }
      return { ...prev, assignedStoreKeeperIds: [...ids, empId] };
    });
  };

  return (
    <div className="max-w-4xl pb-16">
      <PageHeader 
        title={isEdit ? `Edit Location: ${formData.code}` : 'Add New Warehouse / Location (PPE-018)'} 
        subtitle="Manage storage locations, stock condition categories, storage capacities, and responsible Store Keepers"
        onBack={() => navigate('/locations')}
      />

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-4 space-y-6">
        
        {/* Basic Identity */}
        <FormSection title="Identity & Site" description="Unique location identifier and geographical placement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Location Code">
              <div className="relative">
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  className={`font-mono uppercase ${isLockedByStock ? 'bg-canvas text-body cursor-not-allowed pr-8' : ''}`}
                  placeholder="e.g. LOC-001 or WH-MAIN"
                  disabled={isLockedByStock}
                  required 
                />
                {isLockedByStock && (
                  <div className="absolute right-2.5 top-2.5 text-body" title="Location Code is locked once the location holds stock (PPE-019)">
                    <Lock className="w-4 h-4 text-safety-amber-signal" />
                  </div>
                )}
              </div>
              {isLockedByStock && (
                <p className="text-[11px] text-safety-amber-signal mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked: location holds active inventory (Rule PPE-019)
                </p>
              )}
            </FormGroup>

            <FormGroup label="Site / Campus">
              <Select value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} required>
                <option value="Main Campus">Main Campus</option>
                <option value="North Field">North Field</option>
                <option value="South Field">South Field</option>
                <option value="Alexandria Site">Alexandria Site</option>
                <option value="Cairo Main Store">Cairo Main Store</option>
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Location Name (English)">
              <Input 
                value={formData.nameEn} 
                onChange={e => setFormData({...formData, nameEn: e.target.value})} 
                placeholder="e.g. Clinic A - Fridge 2"
                required 
              />
            </FormGroup>
            <FormGroup label="Location Name (Arabic)">
              <Input 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})} 
                dir="rtl" 
                placeholder="مثال: عيادة أ - ثلاجة 2"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Classification & Stock Condition (Rule G6) */}
        <FormSection 
          title="Type, Stock Condition & Capacity (Rule G6)" 
          description="Condition dictates allowable inventory: New, Used, or Scrap. Scrap stock cannot be transferred out."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormGroup label="Location Type">
              <Select 
                value={formData.locationType} 
                onChange={e => setFormData({...formData, locationType: e.target.value as LocationType})} 
                required
              >
                <option value="Central Warehouse">Central Warehouse</option>
                <option value="Site Store">Site Store</option>
                <option value="Department Store">Department Store</option>
                <option value="General">General</option>
              </Select>
            </FormGroup>

            <FormGroup label="Stock Condition (Rule G6)">
              <div className="relative">
                <Select 
                  value={formData.stockCondition} 
                  onChange={e => setFormData({...formData, stockCondition: e.target.value as StockCondition})} 
                  disabled={isLockedByStock}
                  className={isLockedByStock ? 'bg-canvas text-body cursor-not-allowed' : ''}
                  required
                >
                  <option value="New">New (Factory fresh inventory)</option>
                  <option value="Used">Used (Inspected reusable equipment)</option>
                  <option value="Scrap">Scrap (Damaged/decommissioned items)</option>
                </Select>
                {isLockedByStock && (
                  <div className="absolute right-2.5 top-2.5 text-body">
                    <Lock className="w-4 h-4 text-safety-amber-signal" />
                  </div>
                )}
              </div>
              {isLockedByStock && (
                <p className="text-[11px] text-safety-amber-signal mt-1">
                  Condition locked while holding stock
                </p>
              )}
            </FormGroup>

            <FormGroup label={`Capacity Units ${formData.stockCondition === 'Scrap' ? '(Optional)' : '(Required)'}`}>
              <Input 
                type="number" 
                min="0" 
                value={formData.capacityUnits} 
                onChange={e => setFormData({...formData, capacityUnits: parseInt(e.target.value, 10) || 0})} 
                placeholder={formData.stockCondition === 'Scrap' ? 'Optional for Scrap' : 'e.g. 200'}
                required={formData.stockCondition !== 'Scrap'}
              />
              <span className="text-[11px] text-body">Maximum items/pairs this location can hold</span>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Physical Address / Depot Location">
              <Input 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="e.g. Site A, Building 3, Room 102"
              />
            </FormGroup>
            <FormGroup label="Description & Notes">
              <Input 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="e.g. Upper shelf, west wall"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Responsible Store Keepers (PPE-018 & PPE-023) */}
        <FormSection 
          title="Responsible Store Keeper(s) (PPE-023)" 
          description="Store Keepers assigned here will have operational access to manage and issue stock from this location."
        >
          <div className="mb-3 max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-body" />
              <Input 
                value={skSearch} 
                onChange={e => setSkSearch(e.target.value)} 
                placeholder="Search Store Keepers by name or code..."
                className="pl-9 text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredStoreKeepers.map(sk => {
              const isAssigned = (formData.assignedStoreKeeperIds || []).includes(sk.id);
              return (
                <label 
                  key={sk.id} 
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    isAssigned ? 'bg-accent/10 border-accent/40 shadow-xs' : 'bg-surface border-border hover:bg-canvas'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="mr-3 mt-1" 
                    checked={isAssigned} 
                    onChange={() => toggleStoreKeeper(sk.id)} 
                  />
                  <div>
                    <span className="block text-sm font-bold text-ink">{sk.name}</span>
                    <span className="text-xs text-body font-mono">{sk.employeeCode} &middot; Store Keeper</span>
                  </div>
                </label>
              );
            })}
          </div>

          {storeKeepers.length === 0 && (
            <p className="text-xs text-body italic p-3 bg-canvas rounded border border-border">
              No active Store Keeper accounts found in the Employee directory.
            </p>
          )}
        </FormSection>

        <div className="py-4 flex justify-end gap-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/locations')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Location' : 'Save Location'}
          </Button>
        </div>
      </form>
    </div>
  );
}
