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
import { Attribute, AttributeValue } from '../types';
import { Plus, Trash2 } from 'lucide-react';

export default function AttributeForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { attributes, itemGroups, ppeItems, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEdit = Boolean(id);
  const [formData, setFormData] = React.useState<Partial<Attribute>>({
    code: '',
    nameEn: '',
    nameAr: '',
    values: [],
    active: true
  });

  React.useEffect(() => {
    if (isEdit && id) {
      const attr = attributes.find(a => a.id === id);
      if (attr) setFormData(attr);
    }
  }, [id, isEdit, attributes]);

  const addValue = () => {
    setFormData(prev => ({
      ...prev,
      values: [
        ...(prev.values || []),
        { id: generateId(), value: '', sortOrder: (prev.values?.length || 0) + 1 }
      ]
    }));
  };

  const updateValue = (index: number, val: string) => {
    setFormData(prev => {
      const newVals = [...(prev.values || [])];
      newVals[index].value = val;
      return { ...prev, values: newVals };
    });
  };

  const removeValue = (index: number) => {
    // Basic protection against removing in-use values (mock)
    if (isEdit && formData.values && formData.values[index].value) {
      const isUsed = ppeItems.some(i => i.variantAttributeValueIds?.includes(formData.values![index].id));
      if (isUsed && !window.confirm('This value might be in use by items. Are you sure you want to remove it?')) {
        return;
      }
    }

    setFormData(prev => {
      const newVals = [...(prev.values || [])];
      newVals.splice(index, 1);
      return { ...prev, values: newVals };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameEn) {
      addToast('Code and Name (EN) are required.', 'error');
      return;
    }

    if (!formData.values || formData.values.length === 0) {
      addToast('At least one value is required.', 'error');
      return;
    }
    
    if (formData.values.some(v => !v.value.trim())) {
      addToast('Attribute values cannot be empty.', 'error');
      return;
    }

    // Check duplicate code
    const duplicate = attributes.find(a => a.code.toLowerCase() === formData.code?.toLowerCase() && a.id !== id);
    if (duplicate) {
      addToast('Attribute Code already exists.', 'error');
      return;
    }

    saveEntity('attributes', {
      ...formData,
      id: isEdit ? id : generateId()
    } as Attribute);
    
    addToast(isEdit ? 'Attribute updated.' : 'Attribute created.', 'success');
    navigate('/attributes');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Attribute' : 'New Attribute'} />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Attribute Code">
              <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="font-mono uppercase" required />
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
        </FormSection>

        <FormSection title="Attribute Values">
          <div className="space-y-3">
            {formData.values?.map((val, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 text-center text-sm font-medium text-body">{idx + 1}</div>
                <div className="flex-1">
                  <Input value={val.value} onChange={e => updateValue(idx, e.target.value)} placeholder="e.g. Red, XL, etc." required />
                </div>
                <Button type="button" variant="ghost" onClick={() => removeValue(idx)} className="text-safety-red hover:text-safety-red hover:bg-safety-red/10 px-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <Button type="button" variant="secondary" onClick={addValue}>
                <Plus className="w-4 h-4 mr-2" />
                Add Value
              </Button>
            </div>
          </div>
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/attributes')}>Cancel</Button>
          <Button type="submit">Save Attribute</Button>
        </div>
      </form>
    </div>
  )
}
