import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';

export default function ExpirySettings() {
  const { t } = useTranslation();
  const { expirySettings, updateExpirySettings } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [settings, setSettings] = React.useState(expirySettings);

  const handleSave = () => {
    updateExpirySettings(settings);
    addToast('Expiry settings updated successfully.', 'success');
  };

  const updateOverride = (cat: 'I'|'II'|'III', val: string) => {
    const num = parseInt(val, 10) || 0;
    setSettings(prev => ({
      ...prev,
      categoryOverrides: prev.categoryOverrides.map(o => o.riskCategory === cat ? { ...o, leadTimeDays: num } : o)
    }));
  };

  return (
    <div className="max-w-3xl">
      <PageHeader 
        title={t('expirySettings')} 
        action={<Button onClick={handleSave}>{t('save')} Settings</Button>}
      />
      
      <div className="bg-surface border border-border rounded-lg px-6 py-2 mb-6">
        <FormSection title="General Settings" description="Global lead time for expiry warnings before the item's lifespan ends.">
          <FormGroup label="Default Lead Time (Days)">
            <Input 
              type="number" 
              value={settings.generalLeadTimeDays} 
              onChange={e => setSettings({...settings, generalLeadTimeDays: parseInt(e.target.value, 10) || 0})}
              className="w-32"
            />
          </FormGroup>
        </FormSection>

        <FormSection title="Risk Category Overrides" description="Specific lead times for high-risk equipment. Overrides the general setting.">
          <div className="grid grid-cols-3 gap-4">
            {settings.categoryOverrides.map(override => (
              <div key={override.riskCategory}>
                <FormGroup label={`Category ${override.riskCategory} (Days)`}>
                  <Input 
                    type="number" 
                    value={override.leadTimeDays} 
                    onChange={e => updateOverride(override.riskCategory, e.target.value)}
                  />
                </FormGroup>
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    </div>
  )
}
