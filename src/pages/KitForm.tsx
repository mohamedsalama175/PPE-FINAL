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
import { Kit, KitItem } from '../types';
import { Trash2, Plus } from 'lucide-react';

export default function KitForm() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { kits, jobPositions, ppeItems, attributes, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<Kit>>({
    nameEn: '',
    nameAr: '',
    jobPositionId: '',
    items: [],
    active: true
  });

  React.useEffect(() => {
    if (isEdit && id) {
      const kit = kits.find(k => k.id === id);
      if (kit) setFormData(kit);
    }
  }, [id, isEdit, kits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn || !formData.jobPositionId) {
      addToast('Name (EN) and Job Position are required.', 'error');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      addToast('At least one item is required in the kit.', 'error');
      return;
    }
    
    saveEntity('kits', {
      ...formData,
      id: isEdit ? id : generateId()
    } as Kit);
    
    addToast(isEdit ? 'Kit updated.' : 'Kit created.', 'success');
    navigate('/kits');
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []), 
        { id: generateId(), ppeItemId: '', qty: 1 }
      ]
    }));
  };

  const removeItem = (idx: number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(idx, 1);
      return { ...prev, items: newItems };
    });
  };

  const updateItem = (idx: number, field: keyof KitItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[idx] = { ...newItems[idx], [field]: value };
      
      // If changing item, reset variant key
      if (field === 'ppeItemId') {
        newItems[idx].variantKey = undefined;
      }
      return { ...prev, items: newItems };
    });
  };

  const getVariantString = (item: KitItem) => {
    const ppe = ppeItems.find(p => p.id === item.ppeItemId);
    if (!ppe) return null;
    
    const parts = [];
    if (ppe.gender !== 'Unisex') parts.push(ppe.gender);
    if (item.variantKey) {
      const vIds = item.variantKey.split('|');
      const valStrings = vIds.map(vId => {
        let vStr = vId;
        attributes.forEach(a => {
          const v = a.values.find(val => val.id === vId);
          if (v) vStr = v.value;
        });
        return vStr;
      });
      parts.push(...valStrings);
    }
    
    return parts.length > 0 ? parts.join(' - ') : null;
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'Edit Kit' : 'New Kit'} />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Kit Details">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Name (EN)">
              <Input value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} required />
            </FormGroup>
            <FormGroup label="Name (AR)" dir="rtl">
              <Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} dir="rtl" />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Target Job Position">
              <Select value={formData.jobPositionId} onChange={e => setFormData({...formData, jobPositionId: e.target.value})} required>
                <option value="">Select Job Position...</option>
                {jobPositions.map(jp => <option key={jp.id} value={jp.id}>{jp.nameEn}</option>)}
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Kit Items">
          <p className="text-xs text-body mb-4">Define the standard items and default quantities included in this kit.</p>
          
          <div className="space-y-3 mb-4">
            {(formData.items || []).map((ki, idx) => {
              const ppe = ppeItems.find(p => p.id === ki.ppeItemId);
              const variantStr = getVariantString(ki);
              
              return (
                <div key={ki.id || idx} className="flex items-center gap-3 p-3 border border-border bg-canvas rounded">
                  <div className="flex-1">
                    <Select value={ki.ppeItemId} onChange={e => updateItem(idx, 'ppeItemId', e.target.value)} required>
                      <option value="">Select Item...</option>
                      {ppeItems.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.itemCode} - {language === 'en' ? p.nameEn : p.nameAr}</option>
                      ))}
                    </Select>
                  </div>
                  
                  {ppe && (ppe.variantAttributeValueIds.length > 0 || ppe.hasSize) && (
                    <div className="w-1/3">
                      <Input 
                        placeholder="Default Size/Variant (Optional)" 
                        value={ki.variantKey || ''} 
                        onChange={e => updateItem(idx, 'variantKey', e.target.value)}
                        title="Enter variant key like val-1|val-2 for now"
                      />
                    </div>
                  )}
                  
                  <div className="w-24">
                    <Input type="number" min="1" value={ki.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 1)} required />
                  </div>
                  
                  <Button type="button" variant="ghost" onClick={() => removeItem(idx)} className="text-safety-red px-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          <Button type="button" variant="secondary" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/kits')}>Cancel</Button>
          <Button type="submit">Save Kit</Button>
        </div>
      </form>
    </div>
  )
}
