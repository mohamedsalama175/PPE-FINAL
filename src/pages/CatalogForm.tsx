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
import { PPEItem, Attribute } from '../types';
import { Lock, AlertCircle, Building2, Layers } from 'lucide-react';

const CATEGORIES = [
  'Head',
  'Eye & Face',
  'Hearing',
  'Respiratory',
  'Hand',
  'Foot',
  'Body',
  'Fall Protection'
];

export default function CatalogForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { ppeItems, itemGroups, locations, attributes, saveEntity, itemHasTransactions } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<PPEItem>>({
    itemCode: '',
    nameEn: '',
    nameAr: '',
    category: '',
    itemGroupId: itemGroups[0]?.id || '',
    riskCategory: 'I',
    reorderLevel: 20,
    uom: 'Piece',
    lifespanValue: 6,
    lifespanType: 'Months',
    descriptionEn: '',
    descriptionAr: '',
    manufacturer: '',
    model: '',
    standardCertification: '',
    locationIds: [],
    locationReorderLevels: [],
    variantAttributeValueIds: [],
    active: true
  });

  // Check if item code is locked due to transactions (PPE-002)
  const isCodeLocked = React.useMemo(() => {
    if (!isEdit || !id) return false;
    return itemHasTransactions(id);
  }, [isEdit, id, itemHasTransactions]);

  React.useEffect(() => {
    if (isEdit && id) {
      const item = ppeItems.find(p => p.id === id);
      if (item) setFormData(item);
    }
  }, [id, isEdit, ppeItems]);

  // Derive relevant attributes based on selected ItemGroup
  const selectedGroup = React.useMemo(() => {
    return itemGroups.find(ig => ig.id === formData.itemGroupId);
  }, [itemGroups, formData.itemGroupId]);

  const groupAttributes = React.useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.attributeIds
      .map(attrId => attributes.find(a => a.id === attrId && a.active && !a.deletedAt))
      .filter(Boolean) as Attribute[];
  }, [selectedGroup, attributes]);

  // Eligible locations: Active and not Scrap (PPE-001)
  const eligibleLocations = React.useMemo(() => {
    return locations.filter(l => l.active && !l.deletedAt && l.stockCondition !== 'Scrap' && l.locationType !== 'Scrap');
  }, [locations]);

  const toggleLocation = (locId: string) => {
    setFormData(prev => {
      const ids = prev.locationIds || [];
      const currentReorders = prev.locationReorderLevels || [];
      if (ids.includes(locId)) {
        return { 
          ...prev, 
          locationIds: ids.filter(i => i !== locId),
          locationReorderLevels: currentReorders.filter(r => r.locationId !== locId)
        };
      }
      return { 
        ...prev, 
        locationIds: [...ids, locId],
        locationReorderLevels: [...currentReorders, { locationId: locId, reorderLevel: prev.reorderLevel || 20 }]
      };
    });
  };

  const handleLocationReorderChange = (locId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setFormData(prev => {
      const current = prev.locationReorderLevels || [];
      const existingIdx = current.findIndex(r => r.locationId === locId);
      if (existingIdx >= 0) {
        const updated = [...current];
        updated[existingIdx] = { locationId: locId, reorderLevel: num };
        return { ...prev, locationReorderLevels: updated };
      }
      return { ...prev, locationReorderLevels: [...current, { locationId: locId, reorderLevel: num }] };
    });
  };

  const toggleVariantValue = (valId: string) => {
    setFormData(prev => {
      const ids = prev.variantAttributeValueIds || [];
      if (ids.includes(valId)) {
        return { ...prev, variantAttributeValueIds: ids.filter(i => i !== valId) };
      }
      return { ...prev, variantAttributeValueIds: [...ids, valId] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Code Validation
    const code = (formData.itemCode || '').trim();
    if (!code) {
      addToast('Item Code is required.', 'error');
      return;
    }
    if (/\s/.test(code)) {
      addToast('Item Code must be a single word with no spaces (e.g. HLM-001).', 'error');
      return;
    }

    // Check duplicate code
    const duplicate = ppeItems.find(p => p.itemCode.toLowerCase() === code.toLowerCase() && p.id !== id && !p.deletedAt);
    if (duplicate) {
      addToast(`Item Code "${code}" is already in use. Please choose a unique code.`, 'error');
      return;
    }

    // 2. Name validation (both EN and AR required)
    if (!formData.nameEn?.trim() || !formData.nameAr?.trim()) {
      addToast('Item Name is required in both English and Arabic.', 'error');
      return;
    }

    // 3. Category & Item Group
    if (!formData.category) {
      addToast('Category is required. Please select one.', 'error');
      return;
    }
    if (!formData.itemGroupId) {
      addToast('Item Group is required.', 'error');
      return;
    }

    // 4. Variant values per Attribute (PPE-001: at least one value for every Attribute of the group)
    const selectedVals = formData.variantAttributeValueIds || [];
    for (const attr of groupAttributes) {
      const hasValueForAttr = attr.values.some(v => selectedVals.includes(v.id));
      if (!hasValueForAttr) {
        addToast(`Please select at least one variant value for attribute: ${attr.nameEn}.`, 'error');
        return;
      }
    }

    // 5. Gender match rule validation (PPE-001: if Item Group requires gender match, gender attribute must have values chosen)
    if (selectedGroup?.requiresGenderMatch) {
      const genderAttr = groupAttributes.find(a => a.code.toUpperCase() === 'GENDER' || a.nameEn.toLowerCase().includes('gender'));
      if (genderAttr) {
        const hasGenderValue = genderAttr.values.some(v => selectedVals.includes(v.id));
        if (!hasGenderValue) {
          addToast('This Item Group requires a gender match. Please select at least one Gender variant value.', 'error');
          return;
        }
      }
    }

    // 6. Unit of Measure
    if (!formData.uom) {
      addToast('Unit of Measure is required.', 'error');
      return;
    }

    // 7. Lifespan
    if (!formData.lifespanValue || formData.lifespanValue <= 0) {
      addToast('Lifespan value must be greater than zero.', 'error');
      return;
    }

    // 8. Locations (at least one required, active and not scrap)
    if (!formData.locationIds || formData.locationIds.length === 0) {
      addToast('At least one active Location is required.', 'error');
      return;
    }

    // 9. Risk Category
    if (!formData.riskCategory) {
      addToast('Risk Category is required.', 'error');
      return;
    }

    saveEntity('ppeItems', {
      ...formData,
      itemCode: code,
      id: isEdit ? id : generateId()
    } as PPEItem);

    addToast(isEdit ? 'PPE Item updated successfully.' : 'PPE Item created successfully.', 'success');
    navigate('/catalog');
  };

  return (
    <div className="max-w-4xl pb-16">
      <PageHeader 
        title={isEdit ? `Edit PPE Item: ${formData.itemCode}` : 'Add New PPE Item (PPE-001)'} 
        subtitle="Configure master catalog equipment, item group variants, lifespan, and location rules"
        onBack={() => navigate('/catalog')}
      />

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-4 space-y-6">
        
        {/* Basic Info */}
        <FormSection title="Basic Information" description="Item identity, standardized categorization, and bilingual names">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Item Code">
              <div className="relative">
                <Input 
                  value={formData.itemCode} 
                  onChange={e => setFormData({...formData, itemCode: e.target.value})} 
                  className={`font-mono ${isCodeLocked ? 'bg-canvas text-body cursor-not-allowed pr-8' : ''}`}
                  placeholder="e.g. HLM-001"
                  disabled={isCodeLocked}
                  required 
                />
                {isCodeLocked && (
                  <div className="absolute right-2.5 top-2.5 text-body" title="Item Code is locked after the first transaction (PPE-002)">
                    <Lock className="w-4 h-4 text-safety-amber-signal" />
                  </div>
                )}
              </div>
              {isCodeLocked && (
                <p className="text-[11px] text-safety-amber-signal mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked: item has recorded transactions (Rule PPE-002)
                </p>
              )}
            </FormGroup>

            <FormGroup label="Category">
              <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                <option value="">Select Category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Item Name (English)">
              <Input 
                value={formData.nameEn} 
                onChange={e => setFormData({...formData, nameEn: e.target.value})} 
                placeholder="e.g. Safety Helmet"
                required 
              />
            </FormGroup>
            <FormGroup label="Item Name (Arabic)">
              <Input 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})} 
                dir="rtl" 
                placeholder="مثال: خوذة أمان"
                required 
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Description (English)">
              <Input 
                value={formData.descriptionEn} 
                onChange={e => setFormData({...formData, descriptionEn: e.target.value})} 
                placeholder="Certified impact-resistant hard hat"
              />
            </FormGroup>
            <FormGroup label="Description (Arabic)">
              <Input 
                value={formData.descriptionAr} 
                onChange={e => setFormData({...formData, descriptionAr: e.target.value})} 
                dir="rtl" 
                placeholder="خوذة سلامة معتمدة مقاومة للصدمات"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Item Group & Variants (Rule G3 & G4) */}
        <FormSection 
          title="Item Group & Variant Options (Rule G3)" 
          description="Variants (Size, Color, Gender) exist only as attributes attached to the Item Group. No fixed fields."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Item Group">
              <Select 
                value={formData.itemGroupId} 
                onChange={e => setFormData({
                  ...formData, 
                  itemGroupId: e.target.value,
                  variantAttributeValueIds: [] // reset when changing group
                })} 
                required
              >
                <option value="">Select Item Group...</option>
                {itemGroups.filter(g => g.active && !g.deletedAt).map(ig => (
                  <option key={ig.id} value={ig.id}>
                    {ig.nameEn} {ig.requiresGenderMatch ? ' (Requires Gender Match)' : ''}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Unit of Measure (UoM)">
              <Select value={formData.uom || 'Piece'} onChange={e => setFormData({...formData, uom: e.target.value})} required>
                <option value="Piece">Piece</option>
                <option value="Pair">Pair</option>
                <option value="Set">Set</option>
                <option value="Box">Box</option>
              </Select>
            </FormGroup>
          </div>

          {selectedGroup?.requiresGenderMatch && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-safety-amber-signal shrink-0" />
              <span>This Item Group requires a <strong>gender match</strong> (Rule G4). Ensure you choose appropriate gender variants below.</span>
            </div>
          )}

          {groupAttributes.length > 0 ? (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-bold text-body uppercase tracking-wider">
                Variant Values (At least one value required per attribute):
              </p>
              {groupAttributes.map(attr => {
                const selectedForAttr = attr.values.filter(v => (formData.variantAttributeValueIds || []).includes(v.id));
                const hasSelection = selectedForAttr.length > 0;
                return (
                  <div key={attr.id} className={`p-3.5 border rounded-lg transition-colors ${hasSelection ? 'bg-surface border-border' : 'bg-red-50/40 border-safety-red/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-ink">{attr.nameEn} ({attr.nameAr || attr.code})</span>
                      <span className={`text-[11px] font-medium ${hasSelection ? 'text-safety-green' : 'text-safety-red'}`}>
                        {hasSelection ? `${selectedForAttr.length} selected` : 'At least 1 required *'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map(val => {
                        const isChecked = (formData.variantAttributeValueIds || []).includes(val.id);
                        return (
                          <label key={val.id} className={`flex items-center px-3 py-1.5 border rounded cursor-pointer text-xs font-medium transition-colors ${
                            isChecked ? 'bg-accent/15 border-accent text-accent font-bold' : 'bg-surface border-border hover:bg-canvas text-ink'
                          }`}>
                            <input 
                              type="checkbox" 
                              className="mr-2"
                              checked={isChecked} 
                              onChange={() => toggleVariantValue(val.id)} 
                            />
                            <span>{val.value}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-body italic p-3 bg-canvas rounded border border-border">
              No variant attributes assigned to this Item Group. Items in this group have no variant selections.
            </p>
          )}
        </FormSection>

        {/* Lifespan & Compliance */}
        <FormSection 
          title="Lifespan & Risk Classification" 
          description="Lifespan starts on issue date (Rule G5). Risk Category III items require strict adjustment approvals."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormGroup label="Lifespan Value">
              <Input 
                type="number" 
                min="1" 
                value={formData.lifespanValue} 
                onChange={e => setFormData({...formData, lifespanValue: parseInt(e.target.value, 10) || 0})} 
                required 
              />
            </FormGroup>
            <FormGroup label="Lifespan Unit">
              <Select value={formData.lifespanType} onChange={e => setFormData({...formData, lifespanType: e.target.value as any})} required>
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </Select>
            </FormGroup>
            <FormGroup label="Risk Category">
              <Select value={formData.riskCategory} onChange={e => setFormData({...formData, riskCategory: e.target.value as any})} required>
                <option value="I">Category I (Minor Risk)</option>
                <option value="II">Category II (Intermediate)</option>
                <option value="III">Category III (Irreversible or Lethal)</option>
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormGroup label="Manufacturer">
              <Input 
                value={formData.manufacturer} 
                onChange={e => setFormData({...formData, manufacturer: e.target.value})} 
                placeholder="e.g. 3M"
              />
            </FormGroup>
            <FormGroup label="Model">
              <Input 
                value={formData.model} 
                onChange={e => setFormData({...formData, model: e.target.value})} 
                placeholder="e.g. H-700"
              />
            </FormGroup>
            <FormGroup label="Standard / Certification">
              <Input 
                value={formData.standardCertification} 
                onChange={e => setFormData({...formData, standardCertification: e.target.value})} 
                placeholder="e.g. ANSI Z89.1 / EN 397"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Locations & Per-Location Reorder Levels */}
        <FormSection 
          title="Locations & Per-Location Reorder Levels (PPE-001)" 
          description="At least one location required. Scrapped or inactive locations are excluded. Set specific reorder levels per store."
        >
          <div className="mb-3">
            <FormGroup label="Default Global Reorder Level">
              <Input 
                type="number" 
                min="0" 
                value={formData.reorderLevel} 
                onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value, 10) || 0})} 
                className="w-36"
              />
            </FormGroup>
          </div>

          <p className="text-xs font-bold text-body uppercase tracking-wider mb-2">
            Assigned Locations & Stock Thresholds:
          </p>

          <div className="space-y-2">
            {eligibleLocations.map(loc => {
              const isSelected = (formData.locationIds || []).includes(loc.id);
              const locReorder = formData.locationReorderLevels?.find(r => r.locationId === loc.id)?.reorderLevel ?? formData.reorderLevel ?? 20;

              return (
                <div 
                  key={loc.id} 
                  className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-surface border-accent/40 shadow-xs' : 'bg-canvas/50 border-border opacity-70'
                  }`}
                >
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-3" 
                      checked={isSelected} 
                      onChange={() => toggleLocation(loc.id)} 
                    />
                    <div>
                      <span className="block text-sm font-semibold text-ink">{loc.nameEn}</span>
                      <span className="text-xs text-body">{loc.code} &middot; {loc.site} &middot; Condition: {loc.stockCondition}</span>
                    </div>
                  </label>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-body whitespace-nowrap">Reorder Level:</span>
                      <Input 
                        type="number" 
                        min="0"
                        value={locReorder} 
                        onChange={e => handleLocationReorderChange(loc.id, e.target.value)} 
                        className="w-24 text-center font-mono text-xs" 
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {eligibleLocations.length === 0 && (
              <p className="text-xs text-safety-red p-3 bg-red-50 border border-red-200 rounded">
                No active storage locations available. Please create a location before adding items.
              </p>
            )}
          </div>
        </FormSection>

        <div className="py-4 flex justify-end gap-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/catalog')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Item' : 'Save Item to Catalog'}
          </Button>
        </div>
      </form>
    </div>
  );
}
