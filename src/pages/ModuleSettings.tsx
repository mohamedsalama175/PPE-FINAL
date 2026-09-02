import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ContainerCard } from '../components/ui/ContainerCard';
import { useSwal } from '../lib/useSwal';
import { 
  Settings, Clock, Trash2, ShieldAlert, CheckCircle2, 
  MapPin, AlertTriangle, Save, RefreshCw, Calendar 
} from 'lucide-react';
import { ModuleSettings } from '../types';

export default function ModuleSettingsPage() {
  const { t, language } = useTranslation();
  const { showToast } = useSwal();
  const { settings, updateSettings, currentUser, locations } = usePPEStore();

  const isAdmin = currentUser.role === 'Admin';

  const [formSettings, setFormSettings] = React.useState<ModuleSettings>(settings);
  const [changeReason, setChangeReason] = React.useState('');

  React.useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Extract all sites from locations
  const sites = React.useMemo(() => {
    const set = new Set<string>(['Main Campus', 'Cairo Site', 'Alexandria Site']);
    locations.forEach(l => { if (l.site) set.add(l.site); });
    return Array.from(set).sort();
  }, [locations]);

  const handleLeadTimeChange = (site: string, value: number) => {
    const clamped = Math.max(1, Math.min(90, value || 1));
    setFormSettings(prev => ({
      ...prev,
      reminderLeadTimePerSite: {
        ...prev.reminderLeadTimePerSite,
        [site]: clamped
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formSettings.trashRetentionDays < 30) {
      showToast('Trash retention period must be at least 30 days.', 'error');
      return;
    }

    if (formSettings.recentIssuanceWindowDays < 1) {
      showToast('Recent issuance window must be at least 1 day.', 'error');
      return;
    }

    const reason = changeReason.trim() || 'Module configuration updated by Administrator';
    updateSettings(formSettings, reason);
    showToast('Module settings saved and applied immediately.', 'success');
    setChangeReason('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Module Settings (NEW-06)"
        subtitle="Configure per-site reminder lead times, job kit issuance protection window, and trash retention periods"
      />

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 ">
            <span className="font-bold">Admin Permission Notice:</span> You are viewing the module configuration in read-only mode. Only users with the <span className="font-semibold">Admin</span> role can save changes.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Reminder Lead Time per Site */}
        <ContainerCard className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              1. Reminder Lead Time per Site (Days)
            </h3>
            <p className="text-xs text-slate-500 ">
              Configures how many days before an item's Expected Replacement Date the nightly reminder is triggered and appears as 'Upcoming' in Replacements Due (allowed: 1–90 days).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 ">
                <tr>
                  <th className="p-3">Operating Site</th>
                  <th className="p-3 w-48">Lead Time (1–90 Days)</th>
                  <th className="p-3">Status / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {sites.map(site => {
                  const currentVal = formSettings.reminderLeadTimePerSite[site] ?? 14;
                  return (
                    <tr key={site} className="hover:bg-slate-50 ">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 " />
                        {site}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={currentVal}
                            onChange={e => handleLeadTimeChange(site, parseInt(e.target.value) || 14)}
                            disabled={!isAdmin}
                            className="w-24 font-mono font-bold text-slate-800 "
                          />
                          <span className="text-slate-500 text-xs">days</span>
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 ">
                        Reminders fire {currentVal} day(s) prior to expiry
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ContainerCard>

        {/* Section 2: Recent Issuance Window & Trash Retention */}
        <ContainerCard className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 " />
              2. Kit Protection & Trash Retention Windows
            </h3>
            <p className="text-xs text-slate-500 ">
              System governance parameters enforcing sole active kit protection and trash auto-purge countdowns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="block text-xs font-bold text-slate-800 ">
                'Recent Issuance' Window (Days)
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Used by Rule 3: Deactivating, trashing, or reassigning the sole active Kit for a position that had issuances within this window requires Admin Override with a logged reason.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  value={formSettings.recentIssuanceWindowDays}
                  onChange={e => setFormSettings(prev => ({ ...prev, recentIssuanceWindowDays: parseInt(e.target.value) || 90 }))}
                  disabled={!isAdmin}
                  className="w-28 font-mono font-bold text-slate-800 "
                />
                <span className="text-xs text-slate-600 ">days (Default: 90)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="block text-xs font-bold text-slate-800 ">
                Trash Retention Period (Days)
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Records in Trash Bin without historical transactions count down from this value before automatic purge (Minimum: 30 days, Default: 90 days).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={30}
                  value={formSettings.trashRetentionDays}
                  onChange={e => setFormSettings(prev => ({ ...prev, trashRetentionDays: parseInt(e.target.value) || 90 }))}
                  disabled={!isAdmin}
                  className="w-28 font-mono font-bold text-slate-800 "
                />
                <span className="text-xs text-slate-600 ">days (Min: 30)</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 ">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Configuration Change (Logged to Immutable Audit Log)
              </label>
              <Input
                placeholder="e.g. Standardized Alexandria Site lead times to 21 days for logistics..."
                value={changeReason}
                onChange={e => setChangeReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormSettings(settings)}
              disabled={!isAdmin}
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isAdmin}
            >
              <Save className="w-4 h-4 me-1.5" /> Save Configuration
            </Button>
          </div>
        </ContainerCard>
      </form>
    </div>
  );
}
