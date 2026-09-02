import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { ItemGroup } from '../types';
import { ArrowLeft, Layers, AlertCircle, ShieldAlert } from 'lucide-react';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';

export default function ItemGroupForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { itemGroups, attributes, ppeItems, saveItemGroup, writeAuditLog, currentUser } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEditing = Boolean(id);
  const existingGroup = isEditing ? itemGroups.find(g => g.id === id) : null;

  const [formData, setFormData] = React.useState<ItemGroup>(() => {
    if (existingGroup) return { ...existingGroup };
    return {
      id: '',
      code: '',
      nameEn: '',
      nameAr: '',
      assignedAttributeIds: [],
      requiresGenderMatch: false,
      active: true
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [overrideModal, setOverrideModal] = React.useState<{
    isOpen: boolean;
    title: string;
    warning: string;
    action: (reason: string) => void;
  }>({
    isOpen: false,
    title: '',
    warning: '',
    action: () => {}
  });

  // Find the global GENDER attribute
  const genderAttr = attributes.find(a => a.code === 'GENDER');

  const handleAttributeToggle = (attrId: string) => {
    const isSelected = formData.assignedAttributeIds.includes(attrId);

    if (isSelected) {
      // Unticking attribute check: check if active items in this group have values for it (BD-I453)
      const attr = attributes.find(a => a.id === attrId);
      const itemsInGroup = ppeItems.filter(p => p.itemGroupId === formData.id);

      if (isEditing && itemsInGroup.length > 0) {
        setOverrideModal({
          isOpen: true,
          title: `Untick Attribute: ${attr?.nameEn}`,
          warning: `Catalog items in this group currently utilize "${attr?.nameEn}". Unticking it requires an Admin Override reason. It will clear those values and log the cleared values in the Audit Log (NEW-05).`,
          action: (reason: string) => {
            setFormData({
              ...formData,
              assignedAttributeIds: formData.assignedAttributeIds.filter(id => id !== attrId)
            });
            writeAuditLog({
              user: currentUser.name,
              role: currentUser.role,
              objectType: 'ItemGroup',
              objectReference: formData.code,
              action: 'ATTRIBUTE_UNTICKED_VALUES_CLEARED',
              beforeValues: { attributeId: attrId, affectedItems: itemsInGroup.map(i => i.itemCode) },
              afterValues: { untickedAttribute: attr?.code },
              reason,
              source: 'Screen'
            });
          }
        });
        return;
      }

      setFormData({
        ...formData,
        assignedAttributeIds: formData.assignedAttributeIds.filter(id => id !== attrId)
      });
    } else {
      setFormData({
        ...formData,
        assignedAttributeIds: [...formData.assignedAttributeIds, attrId]
      });
    }
  };

  const handleGenderMatchToggle = (checked: boolean) => {
    if (checked && genderAttr && !formData.assignedAttributeIds.includes(genderAttr.id)) {
      // Force include GENDER attribute if Requires gender match is ticked (Rule 5 & BD-I452)
      setFormData({
        ...formData,
        requiresGenderMatch: true,
        assignedAttributeIds: [...formData.assignedAttributeIds, genderAttr.id]
      });
      addToast('Included the "GENDER" attribute automatically as it is required for Gender Matching.', 'info');
 } else {
 setFormData({
 ...formData,
 requiresGenderMatch: checked
 });
 }
 };

 const validate = () => {
 const errs: Record<string, string> = {};
 if (!formData.code.trim()) errs.code = 'Item Group Code is required.';
 else {
 const duplicateCode = itemGroups.find(g => g.code.toLowerCase() === formData.code.trim().toLowerCase() && g.id !== formData.id);
 if (duplicateCode) errs.code = 'An item group with this Code already exists.';
 }

 if (!formData.nameEn.trim()) errs.nameEn = 'English Name is required.';
 if (!formData.nameAr.trim()) errs.nameAr = 'Arabic Name is required.';

 // Rule 5: If requiresGenderMatch is true, GENDER attribute MUST be in assignedAttributeIds
 if (formData.requiresGenderMatch && genderAttr && !formData.assignedAttributeIds.includes(genderAttr.id)) {
 errs.genderMatch = 'The "GENDER" attribute must be checked when "Requires gender match" is active.';
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

 saveItemGroup({
 ...formData,
 code: formData.code.trim().toUpperCase()
 });

 addToast(isEditing ? 'Item Group updated successfully.' : 'New Item Group created.', 'success');
 navigate('/item-groups');
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="outline" color="secondary" size="sm" onClick={() => navigate('/item-groups')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Item Groups
        </Button>
      </div>

      <PageHeader
        title={isEditing ? `Edit Item Group: ${formData.code}` : 'Add New Item Group (BD-I452)'}
        subtitle="Configure group codes, assign dynamic attributes, and set mandatory gender match rules (Rule 5)"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContainerCard title="Group Identification">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Group Code"
              required
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="e.g. HELMETS, FOOTWEAR"
              error={errors.code}
              className="font-mono font-bold uppercase"
            />

            <Input
              label="Name (English)"
              required
              value={formData.nameEn}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="e.g. Safety Footwear"
              error={errors.nameEn}
            />

            <Input
              label="Name (Arabic)"
              required
              dir="rtl"
              value={formData.nameAr}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="مثال: أحذية السلامة"
              error={errors.nameAr}
              className="font-arabic"
            />
          </div>
        </ContainerCard>

        {/* Assigned Attributes Checklist (Rule 5) */}
        <ContainerCard
          title="Assigned Attributes (Rule 5)"
          subtitle="Equipment belonging to this group will dynamically generate variants from the checked attributes."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attributes.filter(a => a.active).map(attr => {
              const isChecked = formData.assignedAttributeIds.includes(attr.id);

              return (
                <div
                  key={attr.id}
                  onClick={() => handleAttributeToggle(attr.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${
                    isChecked 
                      ? 'bg-primary-light/40 border-primary/50' 
                      : 'bg-slate-50 border-[#E2E8F0] hover:border-slate-300 '
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{attr.nameEn}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Code: {attr.code}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div
                    className="rounded text-primary focus:ring-primary cursor-pointer pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </ContainerCard>

        {/* Gender Match Requirement (Rule 5 & BD-I452) */}
        <ContainerCard title="Gender Matching Rule (Rule 5)">
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="genderMatchCheckbox"
              checked={formData.requiresGenderMatch}
              onChange={e => handleGenderMatchToggle(e.target.checked)}
              className="mt-1 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div className="space-y-1">
              <label htmlFor="genderMatchCheckbox" className="font-bold text-xs text-amber-950 cursor-pointer">
                Requires Gender Match
              </label>
              <p className="text-xs text-amber-900 leading-relaxed">
                If ticked, the system forces inclusion of the <strong>GENDER</strong> attribute in this Item Group. 
                At Single Issuance (BD-I467) or Kit Issuance (BD-I468), the variant's Gender MUST equal the employee's gender OR be 'Unisex'; otherwise issuance is strictly blocked.
              </p>
            </div>
          </div>
          {errors.genderMatch && <p className="text-xs text-danger font-bold mt-2">{errors.genderMatch}</p>}
        </ContainerCard>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] ">
          <Button type="button" variant="outline" color="secondary" onClick={() => navigate('/item-groups')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Item Group' : 'Create Item Group'}
          </Button>
        </div>
      </form>

      {/* Admin Override Modal */}
      <AdminOverrideModal
        isOpen={overrideModal.isOpen}
        title={overrideModal.title}
        warningMessage={overrideModal.warning}
        onConfirm={(reason) => {
          overrideModal.action(reason);
          setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} });
        }}
        onCancel={() => setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} })}
      />
    </div>
  );
}
