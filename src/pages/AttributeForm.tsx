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
import { Plus, Trash2, Lock, AlertCircle } from 'lucide-react';

export default function AttributeForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { attributes, itemGroups, ppeItems, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEdit = Boolean(id);
  const [formData, setFormData] = React.useState<Partial<Attribute>>({
    code: '',
    name: '',
    values: [
      { id: generateId(), value: '', sortOrder: 1 }
    ],
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
    const currentValues = formData.values || [];
    // PPE-009 rule: Remove the last Value -> Only one Value left -> Blocked
    if (currentValues.length <= 1) {
      addToast('Cannot remove the last remaining value. An attribute must have at least one value.', 'error');
      return;
    }

    const valToRemove = currentValues[index];
    if (isEdit && valToRemove?.id) {
      // Check if value is used by active items (PPE-009)
      const usedByItems = ppeItems.filter(i => i.active && !i.deletedAt && i.variantAttributeValueIds?.includes(valToRemove.id));
      if (usedByItems.length > 0) {
        const reason = window.prompt(
          `This value "${valToRemove.value}" is currently used by ${usedByItems.length} active item(s). Removing it requires an override reason (minimum 10 characters):`
        );
        if (!reason || reason.trim().length < 10) {
          addToast('Value removal cancelled. An override reason (at least 10 characters) is required for in-use values.', 'error');
          return;
        }
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

    const code = (formData.code || '').trim().toUpperCase();
    if (!code || !formData.name?.trim()) {
      addToast('Attribute Code and Name are required.', 'error');
      return;
    }

    const values = formData.values || [];
    // Check at least one value
    if (values.length === 0) {
      addToast('At least one Attribute Value is required.', 'error');
      return;
    }

    // Check non-empty values
    if (values.some(v => !v.value.trim())) {
      addToast('Attribute values cannot be empty.', 'error');
      return;
    }

    // Check duplicate values under this attribute (PPE-008: 'Red' added twice under Color -> blocked)
    const normalizedVals = values.map(v => v.value.trim().toLowerCase());
    const hasDuplicates = new Set(normalizedVals).size !== normalizedVals.length;
    if (hasDuplicates) {
      addToast('Duplicate attribute values detected. Each value must be unique under this attribute.', 'error');
      return;
    }

    // Check duplicate attribute code across system
    const duplicate = attributes.find(a => a.code.toLowerCase() === code.toLowerCase() && a.id !== id && !a.deletedAt);
    if (duplicate) {
      addToast(`Attribute Code "${code}" already exists.`, 'error');
      return;
    }

    saveEntity('attributes', {
      ...formData,
      code,
      id: isEdit ? id : generateId()
    } as Attribute);

    addToast(isEdit ? 'Attribute updated successfully.' : 'Attribute created successfully.', 'success');
    navigate('/attributes');
  };

  return (
    <div className="max-w-3xl pb-16">
      <PageHeader 
        title={isEdit ? `Edit Attribute: ${formData.code}` : 'Add New Attribute (PPE-008)'} 
        subtitle="Manage global variant options (such as Size, Color, or Gender) reused across Item Groups"
        onBack={() => navigate('/attributes')}
      />

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-4 space-y-6">
        <FormSection title="Identity" description="Unique attribute identifier and multilingual display names">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Attribute Code">
              <div className="relative">
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  className={`font-mono uppercase ${isEdit ? 'bg-canvas text-body cursor-not-allowed pr-8' : ''}`}
                  placeholder="e.g. SIZE"
                  disabled={isEdit}
                  required 
                />
                {isEdit && (
                  <div className="absolute right-2.5 top-2.5 text-body" title="Attribute code cannot be changed once created (PPE-009)">
                    <Lock className="w-4 h-4 text-safety-amber-signal" />
                  </div>
                )}
              </div>
              {isEdit && (
                <p className="text-[11px] text-body mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-safety-amber-signal" /> Code cannot be modified after creation (Rule PPE-009)
                </p>
              )}
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup label="Name">
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Size"
                required 
              />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection 
          title="Attribute Values (PPE-008)" 
          description="Repeatable list of options. Added one by one. Duplicates are blocked. At least one value must remain."
        >
          <div className="space-y-3">
            {formData.values?.map((val, idx) => (
              <div key={val.id || idx} className="flex items-center gap-3 p-2 bg-canvas/40 border border-border rounded-lg">
                <div className="w-8 text-center text-xs font-mono font-bold text-body">#{idx + 1}</div>
                <div className="flex-1">
                  <Input 
                    value={val.value} 
                    onChange={e => updateValue(idx, e.target.value)} 
                    placeholder="e.g. Red, Blue, XL, 42..." 
                    required 
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeValue(idx)} 
                  className="text-safety-red hover:bg-safety-red/10"
                  title="Remove value"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <Button type="button" variant="secondary" onClick={addValue}>
                <Plus className="w-4 h-4 mr-2" /> Add Value
              </Button>
            </div>
          </div>
        </FormSection>

        <div className="py-4 flex justify-end gap-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/attributes')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Attribute' : 'Save Attribute'}
          </Button>
        </div>
      </form>
    </div>
  );
}
