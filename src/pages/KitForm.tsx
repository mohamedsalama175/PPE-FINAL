import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { OverrideModal } from '../components/ui/OverrideModal';
import { useToastStore } from '../store/toastStore';
import { generateId } from '../lib/utils';
import { Kit, KitItem } from '../types';
import { Trash2, Plus, AlertTriangle, AlertCircle } from 'lucide-react';

export default function KitForm() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { kits, jobPositions, ppeItems, attributes, issuances, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<Kit>>({
    name: '',
    jobPositionId: '',
    items: [],
    active: true
  });

  const [showOverrideModal, setShowOverrideModal] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState('');

  React.useEffect(() => {
    if (isEdit && id) {
      const kit = kits.find(k => k.id === id);
      if (kit) setFormData(kit);
    }
  }, [id, isEdit, kits]);

  const handleSubmit = (e?: React.FormEvent, confirmedReason?: string) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.jobPositionId) {
      addToast('Name and Job Position are required.', 'error');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      addToast('At least one item is required in the kit.', 'error');
      return;
    }

    // PPE-030 Business Rule: Changing Job Position of sole active kit with recent issuances
    if (isEdit && id) {
      const originalKit = kits.find(k => k.id === id);
      if (originalKit && originalKit.jobPositionId !== formData.jobPositionId) {
        const otherActiveKits = kits.filter(k => k.id !== id && k.jobPositionId === originalKit.jobPositionId && k.active && !k.deletedAt);
        if (otherActiveKits.length === 0) {
          const recentThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const hasRecent = issuances.some(i => i.kitId === id && new Date(i.issueDate) >= recentThreshold);
          const reasonToUse = confirmedReason || overrideReason;
          if (hasRecent && (!reasonToUse || reasonToUse.trim().length < 10)) {
            setShowOverrideModal(true);
            return;
          }
        }
      }
    }
    
    saveEntity('kits', {
      ...formData,
      id: isEdit ? id : generateId()
    } as Kit, confirmedReason || overrideReason);
    
    addToast(isEdit ? 'Kit updated successfully (PPE-030).' : 'Kit created successfully (PPE-029).', 'success');
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
    if ((formData.items?.length || 0) <= 1) {
      addToast('At least one item must remain in the kit (PPE-030).', 'error');
      return;
    }
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

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <PageHeader 
        title={isEdit ? 'Edit Job Kit (PPE-030)' : 'New Job-Specific Kit (PPE-029)'}
        subtitle="Standard equipment bundle issued in a single click for specific roles"
        onBack={() => navigate('/kits')}
      />

      <form onSubmit={e => handleSubmit(e)} className="bg-surface border border-border rounded-lg p-6 space-y-6 shadow-sm">
        <FormSection title="Kit Information">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Kit Name *">
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Electrical Engineer Kit"
                required 
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormGroup label="Target Job Position *">
              <Select 
                value={formData.jobPositionId} 
                onChange={e => setFormData({...formData, jobPositionId: e.target.value})} 
                required
              >
                <option value="">Select Job Position...</option>
                {jobPositions.map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection 
          title="Kit Line Items (PPE-030)" 
          description="Define the required catalog items, suggested variants, and quantities. Inactive or trashed items are flagged."
        >
          <div className="space-y-3 mb-4">
            {(formData.items || []).map((ki, idx) => {
              const ppe = ppeItems.find(p => p.id === ki.ppeItemId);
              const isInactiveOrTrashed = ppe && (!ppe.active || Boolean(ppe.deletedAt));
              
              return (
                <div 
                  key={ki.id || idx} 
                  className={`flex flex-col gap-2 p-3 border rounded ${
                    isInactiveOrTrashed ? 'border-red-300 bg-red-50/40' : 'border-border bg-canvas'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Select 
                        value={ki.ppeItemId} 
                        onChange={e => updateItem(idx, 'ppeItemId', e.target.value)} 
                        required
                      >
                        <option value="">Select Item...</option>
                        {ppeItems.filter(p => !p.deletedAt).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.itemCode} - {p.name} {!p.active ? '(Inactive)' : ''}
                          </option>
                        ))}
                      </Select>
                    </div>
                    
                    {ppe?.variantAttributeValueIds && ppe.variantAttributeValueIds.length > 0 ? (
                      <div className="w-1/3">
                        <Select
                          value={ki.variantKey || ''}
                          onChange={e => updateItem(idx, 'variantKey', e.target.value)}
                        >
                          <option value="">Suggested Variant...</option>
                          {ppe.variantAttributeValueIds.map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </Select>
                      </div>
                    ) : (
                      <div className="w-1/3 text-xs text-body italic px-2">No variants</div>
                    )}
                    
                    <div className="w-24">
                      <Input 
                        type="number" 
                        min="1" 
                        value={ki.qty} 
                        onChange={e => updateItem(idx, 'qty', parseInt(e.target.value, 10) || 1)} 
                        required 
                      />
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => removeItem(idx)} 
                      className="text-safety-red px-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Flag Inactive / Trashed Line Items (PPE-030) */}
                  {isInactiveOrTrashed && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-safety-red">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>This item is inactive or moved to trash in the Catalog. Please replace it before saving.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <Button type="button" variant="secondary" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" /> Add Line Item
          </Button>
        </FormSection>
        
        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => navigate('/kits')}>Cancel</Button>
          <Button type="submit">Save Kit Template</Button>
        </div>
      </form>

      {/* Override Modal for moving sole active kit with recent issuances (PPE-030) */}
      <OverrideModal 
        isOpen={showOverrideModal}
        title="Admin Override: Position Kit Change (PPE-030)"
        entityName="Job Kit"
        reasons={[
          "This is the only active Kit for this Job Position, which has had recent issuances within the last 90 days.",
          "Moving its Job Position will leave the role without a kit. An Admin override justification is required (minimum 10 characters)."
        ]}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={(reason) => {
          setOverrideReason(reason);
          setShowOverrideModal(false);
          handleSubmit(undefined, reason);
        }}
      />
    </div>
  );
}
