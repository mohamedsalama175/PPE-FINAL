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
    active: true
  });

  React.useEffect(() => {
    if (isEdit && id) {
      const group = itemGroups.find(g => g.id === id);
      if (group) setFormData(group);
    }
  }, [id, isEdit, itemGroups]);

  const toggleAttribute = (attrId: string) => {
    setFormData(prev => {
      const ids = prev.attributeIds || [];
      if (ids.includes(attrId)) {
        // Warning if in use
        if (isEdit) {
          const isUsed = ppeItems.some(item => item.itemGroupId === id);
          if (isUsed && !window.confirm('Removing this attribute may clear existing values on items linked to this group. Proceed?')) {
            return prev;
          }
        }
        return { ...prev, attributeIds: ids.filter(i => i !== attrId) };
      }
      return { ...prev, attributeIds: [...ids, attrId] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameEn) {
      addToast('Code and Name (EN) are required.', 'error');
      return;
    }

    // Check duplicate code
    const duplicate = itemGroups.find(g => g.code.toLowerCase() === formData.code?.toLowerCase() && g.id !== id);
    if (duplicate) {
      addToast('Item Group Code already exists.', 'error');
      return;
    }

    saveEntity('itemGroups', {
      ...formData,
      id: isEdit ? id : generateId()
    } as ItemGroup);
    
    addToast(isEdit ? 'Item Group updated.' : 'Item Group created.', 'success');
    navigate('/item-groups');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Item Group' : 'New Item Group'} />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Group Code">
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

        <FormSection title="Assigned Attributes">
          <p className="text-xs text-body mb-4">Select which attributes should be available for items in this group.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attributes.filter(a => a.active).map(attr => (
              <label key={attr.id} className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                (formData.attributeIds || []).includes(attr.id) ? 'bg-accent-subtle/20 border-accent/50' : 'bg-surface border-border hover:bg-canvas'
              }`}>
                <input 
                  type="checkbox" 
                  className="mr-3" 
                  checked={(formData.attributeIds || []).includes(attr.id)} 
                  onChange={() => toggleAttribute(attr.id)} 
                />
                <span className="text-sm font-medium">{attr.nameEn}</span>
              </label>
            ))}
          </div>
          {attributes.filter(a => a.active).length === 0 && (
            <div className="text-sm text-body p-4 bg-canvas rounded border border-border">
              No active attributes found. Create attributes first.
            </div>
          )}
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/item-groups')}>Cancel</Button>
          <Button type="submit">Save Item Group</Button>
        </div>
      </form>
    </div>
  )
}
