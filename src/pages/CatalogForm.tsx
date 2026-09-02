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

export default function CatalogForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { ppeItems, itemGroups, locations, attributes, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<PPEItem>>({
    itemCode: '',
    nameEn: '',
    nameAr: '',
    category: '',
    itemGroupId: itemGroups[0]?.id || '',
    riskCategory: 'I',
    reorderLevel: 10,
    lifespanValue: 1,
    lifespanType: 'Years',
    hasSize: false,
    gender: 'Unisex',
    descriptionEn: '',
    descriptionAr: '',
    manufacturer: '',
    model: '',
    standardCertification: '',
    locationIds: [],
    variantAttributeValueIds: [],
    active: true
  });

  React.useEffect(() => {
    if (isEdit && id) {
      const item = ppeItems.find(p => p.id === id);
      if (item) setFormData(item);
    }
  }, [id, isEdit, ppeItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.nameEn) {
      addToast('Code and Name (EN) are required.', 'error');
      return;
    }
    if (!formData.uom) {
      addToast('Unit of Measure is required.', 'error');
      return;
    }
    if (formData.locationIds?.length === 0) {
      addToast('At least one Location is required.', 'error');
      return;
    }
    
    // Validate Gender for Clothing / Footwear (optional depending on exact needs, but standard logic applies)
    if (['Body Protection', 'Foot Protection'].includes(formData.category || '') && !formData.gender) {
      addToast('Gender is required for this category.', 'error');
      return;
    }
    
    // Check duplicate item code
    const duplicate = ppeItems.find(p => p.itemCode.toLowerCase() === formData.itemCode?.toLowerCase() && p.id !== id);
    if (duplicate) {
      addToast('Item Code already exists.', 'error');
      return;
    }
    
    saveEntity('ppeItems', {
      ...formData,
      id: isEdit ? id : generateId()
    } as PPEItem);
    
    addToast(isEdit ? 'Item updated.' : 'Item created.', 'success');
    navigate('/catalog');
  };

  const toggleLocation = (locId: string) => {
    setFormData(prev => {
      const ids = prev.locationIds || [];
      if (ids.includes(locId)) {
        return { ...prev, locationIds: ids.filter(i => i !== locId) };
      }
      return { ...prev, locationIds: [...ids, locId] };
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

  // Derive relevant attributes based on selected ItemGroup
  const selectedGroup = React.useMemo(() => {
    return itemGroups.find(ig => ig.id === formData.itemGroupId);
  }, [itemGroups, formData.itemGroupId]);

  const groupAttributes = React.useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.attributeIds
      .map(attrId => attributes.find(a => a.id === attrId))
      .filter(Boolean) as Attribute[];
  }, [selectedGroup, attributes]);

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'Edit PPE Item' : 'New PPE Item'} />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Item Code">
              <Input value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} className="font-mono max-w-xs" required />
            </FormGroup>
            <FormGroup label="Category">
              <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                <option value="">Select Category...</option>
                <option value="Head Protection">Head Protection</option>
                <option value="Eye Protection">Eye Protection</option>
                <option value="Hearing Protection">Hearing Protection</option>
                <option value="Hand Protection">Hand Protection</option>
                <option value="Foot Protection">Foot Protection</option>
                <option value="Body Protection">Body Protection</option>
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Name (EN)">
              <Input value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} required />
            </FormGroup>
            <FormGroup label="Name (AR)" dir="rtl">
              <Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} dir="rtl" />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Description (EN)">
              <Input value={formData.descriptionEn} onChange={e => setFormData({...formData, descriptionEn: e.target.value})} />
            </FormGroup>
            <FormGroup label="Description (AR)" dir="rtl">
              <Input value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} dir="rtl" />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Classification">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Item Group">
              <Select value={formData.itemGroupId} onChange={e => setFormData({...formData, itemGroupId: e.target.value})} required>
                <option value="">Select Group...</option>
                {itemGroups.map(ig => <option key={ig.id} value={ig.id}>{ig.nameEn}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Risk Category">
              <Select value={formData.riskCategory} onChange={e => setFormData({...formData, riskCategory: e.target.value as any})} required>
                <option value="I">Category I (Low Risk)</option>
                <option value="II">Category II (Medium Risk)</option>
                <option value="III">Category III (High Risk)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Unit of Measure">
              <Select value={formData.uom || ''} onChange={e => setFormData({...formData, uom: e.target.value})} required>
                <option value="">Select UoM...</option>
                <option value="Piece">Piece</option>
                <option value="Pair">Pair</option>
                <option value="Box">Box</option>
                <option value="Set">Set</option>
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        {formData.itemGroupId && (
          <FormSection title="Variants & Options">
            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Gender">
                <Select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                  <option value="Unisex">Unisex / Both</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
              </FormGroup>
              <FormGroup label="Has Dynamic Size">
                <div className="flex items-center h-9">
                  <input type="checkbox" checked={formData.hasSize} onChange={e => setFormData({...formData, hasSize: e.target.checked})} className="mr-2" />
                  <span className="text-sm">Item requires size selection at issuance</span>
                </div>
              </FormGroup>
            </div>
            
            {groupAttributes.length > 0 && (
              <div className="mt-4 space-y-4">
                <p className="text-sm font-medium text-ink">Applicable Attributes from {selectedGroup?.nameEn}</p>
                {groupAttributes.map(attr => (
                  <div key={attr.id}>
                    <FormGroup label={attr.nameEn}>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {attr.values.map(val => (
                          <label key={val.id} className={`flex items-center px-3 py-1.5 border rounded cursor-pointer transition-colors ${
                            (formData.variantAttributeValueIds || []).includes(val.id) ? 'bg-accent-subtle/20 border-accent/50' : 'bg-surface border-border hover:bg-canvas'
                          }`}>
                            <input 
                              type="checkbox" 
                              className="mr-2"
                              checked={(formData.variantAttributeValueIds || []).includes(val.id)} 
                              onChange={() => toggleVariantValue(val.id)} 
                            />
                            <span className="text-sm">{val.value}</span>
                          </label>
                        ))}
                      </div>
                    </FormGroup>
                  </div>
                ))}
              </div>
            )}
            {groupAttributes.length === 0 && (
              <p className="text-sm text-body italic mt-2">No variant attributes configured for this Item Group.</p>
            )}
          </FormSection>
        )}

        <FormSection title="Lifespan">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Lifespan Value">
              <Input type="number" min="1" value={formData.lifespanValue} onChange={e => setFormData({...formData, lifespanValue: parseInt(e.target.value) || 0})} required />
            </FormGroup>
            <FormGroup label="Lifespan Type">
              <Select value={formData.lifespanType} onChange={e => setFormData({...formData, lifespanType: e.target.value as any})} required>
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </Select>
            </FormGroup>
          </div>
        </FormSection>
        
        <FormSection title="Manufacturer & Compliance">
          <div className="grid grid-cols-3 gap-4">
            <FormGroup label="Manufacturer">
              <Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </FormGroup>
            <FormGroup label="Model">
              <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </FormGroup>
            <FormGroup label="Standard / Certification">
              <Input value={formData.standardCertification} onChange={e => setFormData({...formData, standardCertification: e.target.value})} />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Inventory Rules">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Reorder Level">
              <Input type="number" min="0" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value) || 0})} />
            </FormGroup>
            <FormGroup label="Assigned Locations">
              <div className="flex flex-wrap gap-2 mt-1">
                {locations.map(loc => (
                  <label key={loc.id} className={`flex items-center px-3 py-1.5 border rounded cursor-pointer transition-colors ${
                    (formData.locationIds || []).includes(loc.id) ? 'bg-accent-subtle/20 border-accent/50' : 'bg-surface border-border hover:bg-canvas'
                  }`}>
                    <input type="checkbox" className="mr-2" checked={(formData.locationIds || []).includes(loc.id)} onChange={() => toggleLocation(loc.id)} />
                    <span className="text-sm">{loc.nameEn}</span>
                  </label>
                ))}
              </div>
              {locations.length === 0 && <p className="text-xs text-body italic mt-1">No locations found.</p>}
            </FormGroup>
          </div>
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/catalog')}>Cancel</Button>
          <Button type="submit">Save Item</Button>
        </div>
      </form>
    </div>
  )
}
