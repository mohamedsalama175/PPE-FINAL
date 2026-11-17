import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { FormSection, FormGroup } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { useToastStore } from '../store/toastStore';
import { generateId } from '../lib/utils';
import { UnitOfMeasure } from '../types';
import { Lock, AlertTriangle } from 'lucide-react';

type Errors = Partial<Record<'code' | 'name' | 'symbol' | 'active', string>>;

/** PPE-051 (add) and PPE-052 (edit) Unit of Measure form. */
export default function UnitForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { units, saveEntity, unitUsage } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const isEdit = Boolean(id);
  const existing = units.find(u => u.id === id);
  const [form, setForm] = React.useState({ code: '', name: '', symbol: '', active: true });
  const [errors, setErrors] = React.useState<Errors>({});

  React.useEffect(() => {
    if (existing) setForm({ code: existing.code, name: existing.name, symbol: existing.symbol, active: existing.active });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const usage = existing ? unitUsage(existing.id) : null;
  const usageTotal = usage ? usage.itemCount + usage.trashedItemCount : 0;
  const deactivationBlocked = isEdit && !!existing?.active && !form.active && usageTotal > 0;

  const validate = (): Errors => {
    const e: Errors = {};
    const code = form.code.trim();
    if (!isEdit) {
      if (!code) e.code = 'Code is required.';
      else if (!/^[A-Za-z0-9_-]+$/.test(code)) e.code = 'One word: letters, digits, dash or underscore.';
      else if (units.some(u => u.code.toUpperCase() === code.toUpperCase())) e.code = `Code ${code.toUpperCase()} already exists (including the Trash Bin).`;
    }
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.symbol.trim()) e.symbol = 'Symbol is required.';
    if (deactivationBlocked) e.active = `${usageTotal} item(s) use this unit. It cannot be deactivated. There is no override.`;
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return; // keep the user's input on a failed save

    const res = saveEntity('units', {
      ...(existing || {}),
      id: existing?.id || generateId(),
      code: form.code.trim(),
      name: form.name,
      symbol: form.symbol,
      active: form.active,
    } as UnitOfMeasure);

    if (!res.success) {
      addToast(res.message || 'Could not save the unit.', 'error');
      return;
    }
    addToast(isEdit ? 'Unit updated.' : 'Unit created.', 'success');
    navigate('/units');
  };

  if (isEdit && !existing) {
    return <div className="text-sm text-body">Unit not found. <Link className="text-accent underline" to="/units">{t('unitsOfMeasure')}</Link></div>;
  }

  return (
    <div className="max-w-3xl pb-16">
      <PageHeader
        title={isEdit ? `${t('editUnit')}: ${existing?.code}` : t('addUnit')}
        subtitle="Units count and issue catalog items. Names are stored in English."
        onBack={() => navigate('/units')}
      />

      <form onSubmit={handleSubmit} noValidate className="bg-surface border border-border rounded-lg px-4 sm:px-6 py-4">
        <FormSection title={t('unitOfMeasure')} description="Code is unique and cannot change after saving.">
          <FormGroup label={`${t('code')} *`} error={errors.code}>
            <div className="relative">
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className={`font-mono uppercase ${isEdit ? 'bg-canvas text-body cursor-not-allowed' : ''}`}
                placeholder="e.g. PCS"
                disabled={isEdit}
                aria-invalid={!!errors.code}
                maxLength={20}
              />
              {isEdit && <Lock className="w-4 h-4 text-safety-amber-signal absolute end-2.5 top-2.5" aria-label={t('codeLocked')} />}
            </div>
            {isEdit && <p className="text-[11px] text-body mt-1">{t('codeLocked')}</p>}
          </FormGroup>

          <FormGroup label={`${t('name')} *`} error={errors.name}>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Piece" aria-invalid={!!errors.name} />
          </FormGroup>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label={`${t('symbol')} *`} error={errors.symbol}>
              <Input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. pc" maxLength={10} aria-invalid={!!errors.symbol} />
            </FormGroup>
            <FormGroup label={t('symbolPreview')}>
              <div className="input-base bg-canvas font-semibold text-ink" aria-live="polite">
                12 <span className="text-body font-normal">{form.symbol.trim() || '…'}</span>
              </div>
            </FormGroup>
          </div>

          <FormGroup label={t('active')} error={errors.active}>
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={form.active} onChange={v => setForm({ ...form, active: v })} />
              <span className="text-xs text-body">{form.active ? t('active') : `${t('inactive')}: not offered on new items`}</span>
            </div>
            {deactivationBlocked && (
              <p className="text-xs text-safety-red mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <Link to={`/catalog?unit=${existing!.id}`} className="underline">{usage!.itemCount} item(s)</Link>
                {usage!.trashedItemCount > 0 && ` + ${usage!.trashedItemCount} in the Trash Bin`} use this unit. No override.
              </p>
            )}
          </FormGroup>
        </FormSection>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => navigate('/units')}>{t('cancel')}</Button>
          <Button type="submit">{t('save')}</Button>
        </div>
      </form>
    </div>
  );
}
