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
import { Location, LocationType } from '../types';

export default function LocationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { locations, employees, saveEntity } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = Boolean(id);

  const [formData, setFormData] = React.useState<Partial<Location>>({
    code: '',
    nameEn: '',
    nameAr: '',
    site: '',
    locationType: 'General',
    description: '',
    capacityUnits: 0,
    address: '',
    assignedStoreKeeperIds: [],
    active: true
  });

  React.useEffect(() => {
    if (isEdit && id) {
      const loc = locations.find(l => l.id === id);
      if (loc) setFormData(loc);
    }
  }, [id, isEdit, locations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameEn || !formData.site) {
      addToast('Code, Name (EN), and Site are required.', 'error');
      return;
    }
    
    // Check duplicate code
    const duplicate = locations.find(l => l.code.toLowerCase() === formData.code?.toLowerCase() && l.id !== id);
    if (duplicate) {
      addToast('Location Code already exists.', 'error');
      return;
    }
    
    saveEntity('locations', {
      ...formData,
      id: isEdit ? id : generateId()
    } as Location);
    
    addToast(isEdit ? 'Location updated.' : 'Location created.', 'success');
    navigate('/locations');
  };

  const storeKeepers = React.useMemo(() => employees.filter(e => e.role === 'Store Keeper' && e.active), [employees]);

  const toggleStoreKeeper = (empId: string) => {
    setFormData(prev => {
      const ids = prev.assignedStoreKeeperIds || [];
      if (ids.includes(empId)) {
        return { ...prev, assignedStoreKeeperIds: ids.filter(i => i !== empId) };
      }
      return { ...prev, assignedStoreKeeperIds: [...ids, empId] };
    });
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'Edit Location' : 'New Location'} />
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg px-6 py-2">
        <FormSection title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Location Code">
              <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="font-mono uppercase" required />
            </FormGroup>
            <FormGroup label="Site">
              <Select value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} required>
                <option value="">Select Site...</option>
                <option value="Main Campus">Main Campus</option>
                <option value="North Field">North Field</option>
                <option value="South Field">South Field</option>
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
        </FormSection>
        
        <FormSection title="Details">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Location Type">
              <Select value={formData.locationType} onChange={e => setFormData({...formData, locationType: e.target.value as LocationType})} required>
                <option value="General">General</option>
                <option value="Central Warehouse">Central Warehouse</option>
                <option value="Site Store">Site Store</option>
                <option value="Department Store">Department Store</option>
                <option value="Scrap">Scrap</option>
                <option value="Used">Used</option>
              </Select>
            </FormGroup>
            <FormGroup label="Capacity Units">
              <Input type="number" min="0" value={formData.capacityUnits} onChange={e => setFormData({...formData, capacityUnits: parseInt(e.target.value) || 0})} />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Address">
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </FormGroup>
            <FormGroup label="Description">
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection title="Responsible Store Keeper(s)">
          <p className="text-xs text-body mb-4">Select which Store Keepers are responsible for managing stock and issuances at this location.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {storeKeepers.map(sk => (
              <label key={sk.id} className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                (formData.assignedStoreKeeperIds || []).includes(sk.id) ? 'bg-accent-subtle/20 border-accent/50' : 'bg-surface border-border hover:bg-canvas'
              }`}>
                <input 
                  type="checkbox" 
                  className="mr-3" 
                  checked={(formData.assignedStoreKeeperIds || []).includes(sk.id)} 
                  onChange={() => toggleStoreKeeper(sk.id)} 
                />
                <div>
                  <span className="block text-sm font-medium leading-none">{sk.name}</span>
                  <span className="text-xs text-body">{sk.employeeCode}</span>
                </div>
              </label>
            ))}
          </div>
          {storeKeepers.length === 0 && (
            <div className="text-sm text-body p-4 bg-canvas rounded border border-border">
              No active Store Keepers found.
            </div>
          )}
        </FormSection>
        
        <div className="py-4 flex justify-end gap-3 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/locations')}>Cancel</Button>
          <Button type="submit">Save Location</Button>
        </div>
      </form>
    </div>
  )
}
