import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { generateId } from '../lib/utils';
import { ItemGroup } from '../types';
import { Lock, AlertCircle, CheckSquare, Layers } from 'lucide-react';

export default function ItemGroupForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { itemGroups, attributes, ppeItems, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEdit = Boolean(id);
  const [formData, setFormData] = React.useState<Partial<ItemGroup>>({
    code: '',
    nameEn: '',
    nameAr: '',
    attributeIds: [],
    requiresGenderMatch: false,
    active: true
  });

  const [initialAttributeIds, setInitialAttributeIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (isEdit && id) {
      const group = itemGroups.find(g => g.id === id);
      if (group) {
        setFormData(group);
        setInitialAttributeIds(group.attributeIds || []);
      }
    }
  }, [id, isEdit, itemGroups]);

  // Find GENDER attribute ID
  const genderAttr = React.useMemo(() => {
    return attributes.find(a => a.code.toUpperCase() === 'GENDER' || a.nameEn.toLowerCase().includes('gender'));
  }, [attributes]);

  const toggleAttribute = (attrId: string) => {
    const currentIds = formData.attributeIds || [];
    const isRemoving = currentIds.includes(attrId);

    if (isRemoving) {
      // PPE-014: If Admin removes an Attribute that items already have values for, prompt with item count and ask for reason
      if (isEdit && id) {
        const affectedItems = ppeItems.filter(p => {
          if (p.itemGroupId !== id || !p.active || p.deletedAt) return false;
          const attr = attributes.find(a => a.id === attrId);
          const valIds = attr?.values.map(v => v.id) || [];
          return p.variantAttributeValueIds?.some(v => valIds.includes(v));
        });

        if (affectedItems.length > 0) {
          const reason = window.prompt(
            `Removing this attribute will clear configured variant values on ${affectedItems.length} active item(s). Please enter a justification reason (minimum 10 characters):`
          );
          if (!reason || reason.trim().length < 10) {
            addToast('Attribute removal cancelled. A justification reason (at least 10 characters) is required when items are affected.', 'error');
            return;
          }
        }
      }

      // If user is removing GENDER while requiresGenderMatch is ticked, alert
      if (genderAttr && attrId === genderAttr.id && formData.requiresGenderMatch) {
        addToast('Warning: "Requires gender match" is enabled. GENDER attribute is required when this setting is active.', 'info');
      }

      setFormData(prev => ({
        ...prev,
        attributeIds: (prev.attributeIds || []).filter(i => i !== attrId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        attributeIds: [...(prev.attributeIds || []), attrId]
      }));
    }
  };

  const handleGenderMatchToggle = (checked: boolean) => {
    setFormData(prev => {
      const currentAttrIds = prev.attributeIds || [];
      // Auto-assign GENDER attribute if checked and not already present
      if (checked && genderAttr && !currentAttrIds.includes(genderAttr.id)) {
        return {
          ...prev,
          requiresGenderMatch: checked,
          attributeIds: [...currentAttrIds, genderAttr.id]
        };
      }
      return {
        ...prev,
        requiresGenderMatch: checked
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const code = (formData.code || '').trim().toUpperCase();
    if (!code || !formData.nameEn?.trim()) {
      addToast('Group Code and Name (EN) are required.', 'error');
      return;
    }

    // Check duplicate code
    const duplicate = itemGroups.find(g => g.code.toLowerCase() === code.toLowerCase() && g.id !== id && !g.deletedAt);
    if (duplicate) {
      addToast(`Item Group Code "${code}" already exists.`, 'error');
      return;
    }

    // PPE-013 & PPE-014 Business Rule: Gender match without GENDER -> Save blocked
    if (formData.requiresGenderMatch) {
      const hasGender = genderAttr && (formData.attributeIds || []).includes(genderAttr.id);
      if (!hasGender) {
        addToast('Save blocked: "Requires gender match" is checked, but the GENDER Attribute is not assigned. Please assign the GENDER attribute.', 'error');
        return;
      }
    }

    saveEntity('itemGroups', {
      ...formData,
      code,
      id: isEdit ? id : generateId()
    } as ItemGroup);

    addToast(isEdit ? 'Item Group updated successfully.' : 'Item Group created successfully.', 'success');
    navigate('/item-groups');
  };

  return (
    <div className="max-w-3xl pb-16">
      <PageHeader 
        title={isEdit ? `Edit Item Group: ${formData.code}` : 'Add New Item Group (PPE-013)'} 
        subtitle="Group PPE items (e.g. Helmets, Gloves, Clothing) and assign applicable variant attributes"
        onBack={() => navigate('/item-groups')}
      />

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-4 space-y-6">
        <FormSection title="Identity" description="Unique group identifier and bilingual names">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Group Code">
              <div className="relative">
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  className={`font-mono uppercase ${isEdit ? 'bg-canvas text-body cursor-not-allowed pr-8' : ''}`}
                  placeholder="e.g. GLOVES, HELMETS, CLOTHING"
                  disabled={isEdit}
                  required 
                />
                {isEdit && (
                  <div className="absolute right-2.5 top-2.5 text-body" title="Group code cannot be changed once created (PPE-014)">
                    <Lock className="w-4 h-4 text-safety-amber-signal" />
                  </div>
                )}
              </div>
              {isEdit && (
                <p className="text-[11px] text-body mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-safety-amber-signal" /> Code cannot be modified after creation (Rule PPE-014)
                </p>
              )}
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Name (English)">
              <Input 
                value={formData.nameEn} 
                onChange={e => setFormData({...formData, nameEn: e.target.value})} 
                placeholder="e.g. Gloves"
                required 
              />
            </FormGroup>
            <FormGroup label="Name (Arabic)">
              <Input 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})} 
                dir="rtl" 
                placeholder="مثال: قفازات"
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* Assigned Attributes & Gender Matching Rule (Rule G4 & PPE-013) */}
        <FormSection 
          title="Assigned Variant Attributes" 
          description="Items belonging to this group will inherit these variant pickers (e.g. Size, Color, Gender)."
        >
          <div className="p-4 bg-canvas/60 border border-border rounded-lg mb-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-0.5" 
                checked={!!formData.requiresGenderMatch} 
                onChange={e => handleGenderMatchToggle(e.target.checked)} 
              />
              <div>
                <span className="block text-sm font-bold text-ink">Requires Gender Match (Rule G4)</span>
                <span className="block text-xs text-body">
                  For clothing and footwear groups. When enabled, issued items must match the recipient employee's gender (or be Unisex). The GENDER attribute is automatically required.
                </span>
              </div>
            </label>
          </div>

          <p className="text-xs font-bold text-body uppercase tracking-wider mb-2">
            Select Attributes Available for this Group:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributes.filter(a => a.active && !a.deletedAt).map(attr => {
              const isChecked = (formData.attributeIds || []).includes(attr.id);
              const isGender = genderAttr && attr.id === genderAttr.id;
              const isRequiredGender = formData.requiresGenderMatch && isGender;

              return (
                <label 
                  key={attr.id} 
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-accent/10 border-accent/40 shadow-xs' : 'bg-surface border-border hover:bg-canvas'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="mr-3 mt-1" 
                    checked={isChecked} 
                    disabled={isRequiredGender}
                    onChange={() => toggleAttribute(attr.id)} 
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">{attr.nameEn}</span>
                      {isRequiredGender && (
                        <span className="text-[10px] font-bold text-safety-amber-signal uppercase">Required</span>
                      )}
                    </div>
                    <span className="text-xs text-body">{attr.code} &middot; {attr.values.length} value(s) ({attr.values.map(v => v.value).slice(0, 3).join(', ')}{attr.values.length > 3 ? '...' : ''})</span>
                  </div>
                </label>
              );
            })}
          </div>

          {attributes.length === 0 && (
            <p className="text-xs text-body italic p-3 bg-canvas rounded border border-border">
              No active attributes found. Create attributes first under Attributes Management.
            </p>
          )}
        </FormSection>

        <div className="py-4 flex justify-end gap-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/item-groups')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Item Group' : 'Save Item Group'}
          </Button>
        </div>
      </form>
    </div>
  );
}
