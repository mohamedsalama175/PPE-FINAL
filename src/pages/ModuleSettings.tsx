import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { Settings, Shield, Clock, Trash2, MapPin, Check } from 'lucide-react';
import { ModuleSettings as IModuleSettings } from '../types';

export default function ModuleSettings() {
  const { moduleSettings, updateModuleSettings, locations } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [settings, setSettings] = React.useState<IModuleSettings>(moduleSettings);
  const [newSite, setNewSite] = React.useState('');
  const [newSiteDays, setNewSiteDays] = React.useState(30);

  const handleSave = () => {
    updateModuleSettings(settings);
    addToast('Module settings saved successfully (PPE-050).', 'success');
  };

  const updateCategoryOverride = (cat: 'I' | 'II' | 'III', val: string) => {
    const num = parseInt(val, 10) || 0;
    setSettings(prev => ({
      ...prev,
      categoryOverrides: prev.categoryOverrides.map(o => o.riskCategory === cat ? { ...o, leadTimeDays: num } : o)
    }));
  };

  const handleAddSiteOverride = () => {
    if (!newSite) return;
    if (settings.siteLeadTimes?.some(s => s.site === newSite)) {
      addToast('Override for this site already exists.', 'error');
      return;
    }
    setSettings(prev => ({
      ...prev,
      siteLeadTimes: [...(prev.siteLeadTimes || []), { site: newSite, leadTimeDays: newSiteDays }]
    }));
    setNewSite('');
  };

  const handleRemoveSiteOverride = (site: string) => {
    setSettings(prev => ({
      ...prev,
      siteLeadTimes: (prev.siteLeadTimes || []).filter(s => s.site !== site)
    }));
  };

  const uniqueSites = Array.from(new Set(locations.map(l => l.site).filter(Boolean)));

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <PageHeader 
        title="Module Settings & Governance (PPE-050)" 
        subtitle="Global lead times, site overrides, alert thresholds, and data retention"
        actions={
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" /> Save All Settings
          </Button>
        }
      />

      <div className="bg-surface border border-border rounded-lg px-6 py-3 divide-y divide-border">
        {/* General Expiry Lead Time */}
        <FormSection 
          title="General Expiry & Replacement Lead Times" 
          description="Default days before equipment lifespan ends to trigger reminders and appearance on Replacements Due."
        >
          <FormGroup label="Default Lead Time (Days)">
            <Input 
              type="number" 
              value={settings.generalLeadTimeDays} 
              onChange={e => setSettings({...settings, generalLeadTimeDays: parseInt(e.target.value, 10) || 0})}
              className="w-36"
            />
          </FormGroup>
        </FormSection>

        {/* Risk Category Overrides */}
        <FormSection 
          title="Risk Category Overrides" 
          description="Specific advance notice lead times based on PPE risk classification (Cat I / Cat II / Cat III)."
        >
          <div className="grid grid-cols-3 gap-4">
            {settings.categoryOverrides?.map(override => (
              <div key={override.riskCategory}>
                <FormGroup label={`Category ${override.riskCategory} Lead Time (Days)`}>
                  <Input 
                    type="number" 
                    value={override.leadTimeDays} 
                    onChange={e => updateCategoryOverride(override.riskCategory, e.target.value)}
                  />
                </FormGroup>
              </div>
            ))}
          </div>
        </FormSection>

        {/* Per-Site Lead Time Overrides */}
        <FormSection 
          title="Per-Site Lead Time Overrides" 
          description="Custom lead times for remote or offshore sites where delivery logistics require longer lead times."
        >
          <div className="space-y-3">
            {settings.siteLeadTimes && settings.siteLeadTimes.length > 0 ? (
              <div className="divide-y divide-border border border-border rounded">
                {settings.siteLeadTimes.map(s => (
                  <div key={s.site} className="p-3 flex justify-between items-center text-xs bg-canvas/40">
                    <div>
                      <span className="font-semibold text-ink">{s.site}</span>
                      <span className="text-body ml-2">({s.leadTimeDays} days lead time)</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-safety-red h-7"
                      onClick={() => handleRemoveSiteOverride(s.site)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-body italic">No site-specific lead times configured. General lead time applies.</p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <select 
                value={newSite} 
                onChange={e => setNewSite(e.target.value)}
                className="text-xs p-2 rounded border border-border bg-surface w-48"
              >
                <option value="">Select Site...</option>
                {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input 
                type="number" 
                placeholder="Days" 
                value={newSiteDays} 
                onChange={e => setNewSiteDays(parseInt(e.target.value, 10) || 30)}
                className="w-24"
              />
              <Button size="sm" variant="secondary" onClick={handleAddSiteOverride} disabled={!newSite}>
                Add Site Override
              </Button>
            </div>
          </div>
        </FormSection>

        {/* 90-Day Recent Issuance Window & Trash Retention */}
        <FormSection 
          title="Operational Windows & Retention Policy (G10)" 
          description="Configure the threshold for recent issuances and the retention auto-purge duration in the Trash Bin."
        >
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Recent Issuance Alert Window (Days)">
              <Input 
                type="number" 
                value={settings.recentIssuanceWindowDays} 
                onChange={e => setSettings({...settings, recentIssuanceWindowDays: parseInt(e.target.value, 10) || 90})}
              />
            </FormGroup>

            <FormGroup label="Trash Retention Purge Window (Days)">
              <Input 
                type="number" 
                value={settings.trashRetentionDays} 
                onChange={e => setSettings({...settings, trashRetentionDays: parseInt(e.target.value, 10) || 90})}
              />
            </FormGroup>
          </div>
          <p className="text-[11px] text-body mt-2">
            Per Rule G10, records with historical transactions are protected indefinitely (<span className="font-semibold text-ink">Retained - has history</span>) regardless of the purge window.
          </p>
        </FormSection>
      </div>
    </div>
  );
}

