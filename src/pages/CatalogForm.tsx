import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { PPEItem, RiskCategory, LifespanUnit } from '../types';
import { Lock, ArrowLeft, Layers } from 'lucide-react';

const CATEGORIES = [
  'Head', 'Eye', 'Hearing', 'Hand', 'Foot', 'Body', 'Respiratory', 'Fall Protection'
];

export default function CatalogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { ppeItems, itemGroups, attributes, locations, issuances, batches, visitorLoans, savePPEItem } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEditing = Boolean(id);
  const existingItem = isEditing ? ppeItems.find(p => p.id === id) : null;

  // Determine if item code is locked due to usage in issuances, batches, or loans
  const isCodeLocked = React.useMemo(() => {
    if (!existingItem) return false;
    return issuances.some(i => i.ppeItemId === existingItem.id) ||
           batches.some(b => b.ppeItemId === existingItem.id) ||
           visitorLoans.some(l => l.items.some(li => li.ppeItemId === existingItem.id));
  }, [existingItem, issuances, batches, visitorLoans]);

  const [formData, setFormData] = React.useState<PPEItem>(() => {
    if (existingItem) {
      return { ...existingItem };
    }
    return {
      id: '',
      itemCode: '',
      nameEn: '',
      nameAr: '',
      category: 'Head',
      itemGroupId: itemGroups[0]?.id || '',
      lifespanValue: 12,
      lifespanUnit: 'Months',
      uom: 'Piece',
      descriptionEn: '',
      descriptionAr: '',
      manufacturer: '',
      model: '',
      standardCertification: '',
      riskCategory: 'Category II',
      reorderLevels: {},
      locationIds: [],
      active: true,
      itemCodeLocked: false
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Offer ONLY Active, non-Scrap locations (BD-I443)
  const availableLocations = React.useMemo(() => {
    return locations.filter(l => l.active && l.stockCondition !== 'Scrap');
  }, [locations]);

  // Selected Item Group to dynamically show variant attributes
  const selectedGroup = React.useMemo(() => {
    return itemGroups.find(g => g.id === formData.itemGroupId);
  }, [itemGroups, formData.itemGroupId]);

  const handleLocationToggle = (locId: string) => {
    const isSelected = formData.locationIds.includes(locId);
    if (isSelected) {
      const newLocIds = formData.locationIds.filter(id => id !== locId);
      const newReorders = { ...formData.reorderLevels };
      delete newReorders[locId];
      setFormData({ ...formData, locationIds: newLocIds, reorderLevels: newReorders });
    } else {
      setFormData({
        ...formData,
        locationIds: [...formData.locationIds, locId],
        reorderLevels: { ...formData.reorderLevels, [locId]: 20 } // default reorder level 20
      });
    }
  };

  const handleReorderLevelChange = (locId: string, val: number) => {
    setFormData({
      ...formData,
      reorderLevels: {
        ...formData.reorderLevels,
        [locId]: Math.max(0, val)
      }
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.itemCode.trim()) errs.itemCode = 'Item Code is required.';
    else if (/\s/.test(formData.itemCode)) errs.itemCode = 'Item Code must be a single word without spaces.';
    else {
      // Check duplicate code
      const duplicate = ppeItems.find(p => p.itemCode.toLowerCase() === formData.itemCode.trim().toLowerCase() && p.id !== formData.id);
      if (duplicate) errs.itemCode = 'An item with this Item Code already exists.';
    }

    if (!formData.nameEn.trim()) errs.nameEn = 'English Name is required.';
    if (!formData.nameAr.trim()) errs.nameAr = 'Arabic Name is required.';
    if (formData.locationIds.length === 0) errs.locations = 'At least one active warehouse location must be assigned.';
    if (formData.lifespanValue <= 0) errs.lifespan = 'Lifespan value must be greater than zero.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please resolve validation errors before saving.', 'error');
      return;
    }

    savePPEItem({
      ...formData,
      itemCode: formData.itemCode.trim().toUpperCase(),
      itemCodeLocked: isCodeLocked || formData.itemCodeLocked
    });

    addToast(isEditing ? 'PPE Item updated successfully.' : 'New PPE Item added to catalog.', 'success');
    navigate('/catalog');
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="outline" color="secondary" size="sm" onClick={() => navigate('/catalog')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Catalog
        </Button>
      </div>

      <PageHeader 
        title={isEditing ? `Edit Item: ${formData.itemCode}` : 'Add New PPE Item to Catalog (BD-I443)'} 
        subtitle="Variants are automatically derived from the chosen Item Group's attributes (Rule 5)"
 />

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Core Identifiers */}
 <ContainerCard title="Basic Identification">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Input
 label="Item Code"
              required
              disabled={isCodeLocked}
              value={formData.itemCode}
              onChange={e => setFormData({ ...formData, itemCode: e.target.value.replace(/\s/g, '').toUpperCase() })}
              placeholder="e.g. HLM-001, GLOV-HV-01"
              error={errors.itemCode}
              helperText={isCodeLocked ? "This Item Code is permanently locked because transactions have been recorded." : undefined}
              endIcon={isCodeLocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : undefined}
              className="font-mono font-bold uppercase"
            />

            <Select
              label="Risk Category"
              required
              value={formData.riskCategory}
              onChange={val => setFormData({ ...formData, riskCategory: (val as RiskCategory) || 'Category II' })}
              data={[
                { value: 'Category I', label: 'Category I (Minor Risk — Hand/Sun protection)' },
                { value: 'Category II', label: 'Category II (Intermediate Risk — Helmets, safety footwear)' },
                { value: 'Category III', label: 'Category III (Irreversible/Lethal Risk — Harnesses, Respirators)' }
              ]}
              helperText="Category III items require HSE Supervisor approval for stock adjustments."
            />

            <Input
              label="Item Name (English)"
              required
              value={formData.nameEn}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="e.g. MSA V-Gard Safety Helmet"
              error={errors.nameEn}
            />

            <Input
              label="Item Name (Arabic)"
              required
              dir="rtl"
              value={formData.nameAr}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="مثال: خوذة أمان MSA V-Gard"
              error={errors.nameAr}
              className="font-arabic"
            />
          </div>
        </ContainerCard>

        {/* Classification & Group */}
        <ContainerCard 
          title="Classification & Dynamic Variants (Rule 5)" 
          subtitle="Gender & Size attributes are derived from the selected Item Group"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Safety Category"
              required
              value={formData.category}
              onChange={val => setFormData({ ...formData, category: val || 'Head' })}
              data={CATEGORIES}
            />

            <Select
              label="Item Group"
              required
              value={formData.itemGroupId}
              onChange={val => setFormData({ ...formData, itemGroupId: val || '' })}
              data={itemGroups.filter(g => g.active).map(g => ({
                value: g.id,
                label: `${g.nameEn} (${g.code})`
              }))}
            />

            <Select
              label="Unit of Measure (UoM)"
              required
              value={formData.uom}
              onChange={val => setFormData({ ...formData, uom: val || 'Piece' })}
              data={['Piece', 'Pair', 'Set', 'Box']}
            />
          </div>

          {/* Dynamic Variant Preview for selected Group */}
          {selectedGroup && (
            <div className="p-3.5 mt-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary " />
                Active Attributes inherited from "{selectedGroup.nameEn}":
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedGroup.assignedAttributeIds.map(attrId => {
                  const attr = attributes.find(a => a.id === attrId);
                  return (
                    <span key={attrId} className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-800 ">
                      {attr ? `${attr.nameEn} (${attr.code})` : attrId}
                    </span>
                  );
                })}
              </div>
              {selectedGroup.requiresGenderMatch && (
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  • Requires Gender Match: Selected variant gender must match employee gender or be Unisex at issuance.
                </p>
              )}
            </div>
          )}
        </ContainerCard>

        {/* Lifespan & Expiry (Rule 12) */}
        <ContainerCard 
          title="Lifespan & Expiry Calculation (Rule 12)" 
          subtitle="Time-based only • Evaluated at issuance"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Lifespan Value"
              type="number"
              min={1}
              required
              value={formData.lifespanValue}
              onChange={e => setFormData({ ...formData, lifespanValue: Math.max(1, parseInt(e.target.value) || 1) })}
              error={errors.lifespan}
            />

            <Select
              label="Lifespan Unit"
              required
              value={formData.lifespanUnit}
              onChange={val => setFormData({ ...formData, lifespanUnit: (val as LifespanUnit) || 'Months' })}
              data={['Days', 'Months', 'Years']}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-3">
            Expected Replacement Date is calculated as: <strong>Issue Date + {formData.lifespanValue} {formData.lifespanUnit}</strong>.
            Warehoused stock has no countdown.
          </p>
        </ContainerCard>

        {/* Assigned Locations & Per-Location Reorder Levels (BD-I443, BD-I466) */}
        <ContainerCard
          title="Assigned Warehouse Locations & Reorder Levels"
          subtitle="Only Active, non-Scrap locations are offered. Set an optional Reorder Level per location."
        >
          {errors.locations && <p className="text-xs text-danger font-bold mb-3">{errors.locations}</p>}

          <div className="space-y-3">
            {availableLocations.map(loc => {
              const isSelected = formData.locationIds.includes(loc.id);
              const reorderVal = formData.reorderLevels[loc.id] ?? 20;

              return (
                <div
                  key={loc.id}
                  className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isSelected 
                      ? 'bg-primary-light/30 border-primary/40' 
                      : 'bg-slate-50/50 border-[#E2E8F0] '
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleLocationToggle(loc.id)}
                      className="mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{loc.nameEn} ({loc.code})</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Site: {loc.site} • Type: {loc.locationType} • Condition: {loc.stockCondition}
                      </span>
                    </div>
                  </label>

                  {isSelected && (
                    <div className="flex items-center gap-2 ps-7 sm:ps-0">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reorder Level:</span>
                      <input
                        type="number"
                        min={0}
                        value={reorderVal}
                        onChange={e => handleReorderLevelChange(loc.id, parseInt(e.target.value) || 0)}
                        className="w-24 border border-[#E2E8F0] bg-white text-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{formData.uom}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ContainerCard>

        {/* Manufacturing & Standards */}
        <ContainerCard title="Manufacturer, Standards & Description">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g. MSA, 3M, Ansell"
            />

            <Input
              label="Model / Part No."
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. V-Gard 500, Aura 9332+"
            />

            <Input
              label="Standard / Certification"
              value={formData.standardCertification}
              onChange={e => setFormData({ ...formData, standardCertification: e.target.value })}
              placeholder="e.g. EN 397, ANSI Z89.1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <Textarea
              label="Description (English)"
              rows={3}
              value={formData.descriptionEn}
              onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })}
              placeholder="Technical specifications, dielectric ratings, or care instructions..."
            />

            <Textarea
              label="Description (Arabic)"
              rows={3}
              dir="rtl"
              value={formData.descriptionAr}
              onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder="المواصفات الفنية وتعليمات الاستخدام..."
              className="font-arabic"
            />
          </div>
        </ContainerCard>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] ">
          <Button type="button" variant="outline" color="secondary" onClick={() => navigate('/catalog')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Create PPE Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
