import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { Attribute, AttributeValue } from '../types';
import { Plus, Trash2, ArrowLeft, GripVertical, AlertTriangle } from 'lucide-react';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';

export default function AttributeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { attributes, itemGroups, saveAttribute } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEditing = Boolean(id);
  const existingAttr = isEditing ? attributes.find(a => a.id === id) : null;

  const [formData, setFormData] = React.useState<Attribute>(() => {
    if (existingAttr) return { ...existingAttr };
    return {
      id: '',
      code: '',
      nameEn: '',
      nameAr: '',
      active: true,
      values: [
        { id: `val-${Date.now()}-1`, valueEn: '', valueAr: '', sortOrder: 1, active: true }
      ]
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const handleAddValue = () => {
    const nextOrder = formData.values.length + 1;
    setFormData({
      ...formData,
      values: [
        ...formData.values,
        { id: `val-${Date.now()}-${nextOrder}`, valueEn: '', valueAr: '', sortOrder: nextOrder, active: true }
      ]
    });
  };

  const handleRemoveValue = (valId: string) => {
    if (formData.values.length <= 1) {
      addToast('An attribute must have at least one value.', 'error');
      return;
    }

    const valToRemove = formData.values.find(v => v.id === valId);

    // If editing and value was already saved, prompt with override modal
    if (isEditing && valToRemove) {
      setOverrideModal({
        isOpen: true,
        title: `Remove Attribute Value: ${valToRemove.valueEn}`,
        warning: `Removing this attribute value will prevent it from being chosen in new issuances. Historical records retaining this value will preserve it as a read-only string.`,
        action: () => {
          setFormData({
            ...formData,
            values: formData.values.filter(v => v.id !== valId)
          });
        }
      });
      return;
    }

    setFormData({
      ...formData,
      values: formData.values.filter(v => v.id !== valId)
    });
  };

  const handleValueChange = (valId: string, field: 'valueEn' | 'valueAr' | 'sortOrder' | 'active', val: any) => {
    setFormData({
      ...formData,
      values: formData.values.map(v => v.id === valId ? { ...v, [field]: val } : v)
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) errs.code = 'Attribute Code is required.';
    else {
      const duplicateCode = attributes.find(a => a.code.toLowerCase() === formData.code.trim().toLowerCase() && a.id !== formData.id);
      if (duplicateCode) errs.code = 'An attribute with this Code already exists.';
    }

    if (!formData.nameEn.trim()) errs.nameEn = 'English Name is required.';
    if (!formData.nameAr.trim()) errs.nameAr = 'Arabic Name is required.';

    if (formData.values.length === 0) {
      errs.values = 'At least one attribute value is required.';
    } else {
      // Check duplicate values inside the attribute
      const enSet = new Set<string>();
      for (const v of formData.values) {
        if (!v.valueEn.trim()) {
          errs.values = 'All value labels in English are required.';
          break;
        }
        if (enSet.has(v.valueEn.trim().toLowerCase())) {
          errs.values = `Duplicate value "${v.valueEn}" detected. Values must be unique within an attribute.`;
          break;
        }
        enSet.add(v.valueEn.trim().toLowerCase());
      }
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

    saveAttribute({
      ...formData,
      code: formData.code.trim().toUpperCase()
    });

    addToast(isEditing ? 'Attribute updated successfully.' : 'New Attribute created.', 'success');
    navigate('/attributes');
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="outline" color="secondary" size="sm" onClick={() => navigate('/attributes')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Attributes
        </Button>
      </div>

      <PageHeader
        title={isEditing ? `Edit Attribute: ${formData.code}` : 'Add New Attribute (BD-I447)'}
        subtitle="Attributes define specifications like Size, Color, or Material for equipment groups"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContainerCard title="Attribute Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Attribute Code"
              required
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="e.g. SIZE, COLOR, GENDER"
              error={errors.code}
              className="font-mono font-bold uppercase"
            />

            <Input
              label="Name (English)"
              required
              value={formData.nameEn}
              onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="e.g. Shoe Size"
              error={errors.nameEn}
            />

            <Input
              label="Name (Arabic)"
              required
              dir="rtl"
              value={formData.nameAr}
              onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="مثال: مقاس الحذاء"
              error={errors.nameAr}
              className="font-arabic"
            />
          </div>
        </ContainerCard>

        {/* Repeatable Values Builder */}
        <ContainerCard
          title={`Configured Values (${formData.values.length})`}
          subtitle="Provide bilingual values. Duplicates are strictly prevented."
          actions={
            <Button type="button" size="sm" variant="outline" color="secondary" onClick={handleAddValue}>
              <Plus className="w-3.5 h-3.5 me-1" /> Add Value
            </Button>
          }
        >
          {errors.values && <p className="text-xs text-danger font-bold mb-3">{errors.values}</p>}

          <div className="space-y-2">
            {formData.values.map((val, idx) => (
              <div 
                key={val.id} 
                className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center gap-3"
              >
                <span className="text-xs font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>

                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Value EN (e.g. XL, 42, Yellow)"
                    value={val.valueEn}
                    onChange={e => handleValueChange(val.id, 'valueEn', e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="القيمة بالعربية (مثال: كبير جداً)"
                    value={val.valueAr}
                    onChange={e => handleValueChange(val.id, 'valueAr', e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs font-arabic text-slate-900 bg-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    title="Sort Order"
                    value={val.sortOrder}
                    onChange={e => handleValueChange(val.id, 'sortOrder', parseInt(e.target.value) || 1)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-xs font-mono text-center bg-white text-slate-900 focus:outline-none focus:border-primary"
                  />
                </div>

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={val.active}
                    onChange={e => handleValueChange(val.id, 'active', e.target.checked)}
                    className="rounded text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>Active</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleRemoveValue(val.id)}
                  className="p-1.5 text-slate-400 hover:text-danger rounded-lg hover:bg-danger-light/30 transition-colors cursor-pointer"
                  title="Remove Value"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ContainerCard>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] ">
          <Button type="button" variant="outline" color="secondary" onClick={() => navigate('/attributes')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Attribute' : 'Create Attribute'}
          </Button>
        </div>
      </form>

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
