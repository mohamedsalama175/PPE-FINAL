import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToastStore } from '../store/toastStore';
import { useSwal } from '../lib/useSwal';
import { Kit, KitItem } from '../types';
import { Plus, Trash2, ArrowLeft, Briefcase, AlertTriangle, ShieldAlert } from 'lucide-react';
import { AdminOverrideModal } from '../components/ui/AdminOverrideModal';
import { subDays, isAfter } from 'date-fns';

export default function KitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { kits, jobPositions, ppeItems, issuances, settings, saveKit, currentUser } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const { showInfo } = useSwal();

  const isEditing = Boolean(id);
  const existingKit = isEditing ? kits.find(k => k.id === id) : null;

  const [formData, setFormData] = React.useState<Kit>(() => {
    if (existingKit) return { ...existingKit };
    return {
      id: '',
      nameEn: '',
      nameAr: '',
      jobPositionId: jobPositions[0]?.id || '',
      active: true,
      items: [
        { id: `ki-${Date.now()}-1`, ppeItemId: ppeItems[0]?.id || '', quantity: 1 }
      ]
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [overrideModal, setOverrideModal] = React.useState<{
    isOpen: boolean;
    title: string;
    warning: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    warning: '',
    action: () => {}
  });

  // Check if initial kit was sole active kit with recent issuances
  const wasSoleActive = React.useMemo(() => {
    if (!existingKit) return false;
    const otherActiveKits = kits.filter(k => k.jobPositionId === existingKit.jobPositionId && k.id !== existingKit.id && k.active && !k.deletedAt);
    if (otherActiveKits.length > 0) return false;

    const cutoff = subDays(new Date(), settings.recentIssuanceWindowDays || 90);
    return issuances.some(i => i.kitId === existingKit.id && isAfter(new Date(i.issueDate), cutoff));
  }, [existingKit, kits, issuances, settings]);

  const handleAddLine = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: `ki-${Date.now()}-${formData.items.length + 1}`, ppeItemId: ppeItems[0]?.id || '', quantity: 1 }
      ]
    });
  };

  const handleRemoveLine = (lineId: string) => {
    if (formData.items.length <= 1) {
      addToast('A job kit must contain at least one equipment item.', 'error');
      return;
    }
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.id !== lineId)
    });
  };

  const handleLineChange = (lineId: string, field: 'ppeItemId' | 'quantity', val: any) => {
    setFormData({
      ...formData,
      items: formData.items.map(i => i.id === lineId ? { ...i, [field]: val } : i)
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.nameEn.trim()) errs.nameEn = 'Kit English Name is required.';
    else {
      const duplicate = kits.find(k => k.nameEn.toLowerCase() === formData.nameEn.trim().toLowerCase() && k.id !== formData.id);
      if (duplicate) errs.nameEn = 'A kit with this name already exists.';
    }

    if (!formData.nameAr.trim()) errs.nameAr = 'Kit Arabic Name is required.';
    if (!formData.jobPositionId) errs.jobPosition = 'Job position is required.';
    if (formData.items.length === 0) errs.items = 'At least one item is required in the kit.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doSave = () => {
    saveKit(formData);
    addToast(isEditing ? 'Job Kit updated successfully.' : 'New Job Kit created.', 'success');
    navigate('/kits');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please resolve validation errors before saving.', 'error');
      return;
    }

    // Check if changing Job Position of the sole active kit (Rule 3 & BD-I477)
    if (existingKit && wasSoleActive && formData.jobPositionId !== existingKit.jobPositionId) {
      if (currentUser.role !== 'Admin') {
        showInfo('Sole Active Kit Protection', 'Cannot change job position on sole active kit with recent issuances. Only an Admin can override.');
        return;
      }

      const oldJobPos = jobPositions.find(j => j.id === existingKit.jobPositionId);
      const newJobPos = jobPositions.find(j => j.id === formData.jobPositionId);

      setOverrideModal({
        isOpen: true,
        title: `Change Job Position on Sole Active Kit`,
        warning: `This was the only active kit for "${oldJobPos?.nameEn}" and had issuances in the last 90 days. Reassigning it to "${newJobPos?.nameEn}" will leave "${oldJobPos?.nameEn}" without an active kit. Requires an Admin Override reason.`,
        action: doSave
      });
      return;
    }

    doSave();
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Button variant="secondary" size="sm" onClick={() => navigate('/kits')}>
          <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Kits
        </Button>
      </div>

      <PageHeader
        title={isEditing ? `Edit Job Kit: ${formData.nameEn}` : 'Add New Job Kit (BD-I469)'}
        subtitle="Define job-specific equipment bundles. Multiple kits per position are supported (e.g., Summer vs Winter)"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kit Header */}
        <ContainerCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 ">
            Kit Identification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Kit Name (English)"
                required
                value={formData.nameEn}
                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. Electrical Engineer Kit"
                error={errors.nameEn}
              />
            </div>

            <div>
              <Input
                label="Kit Name (Arabic)"
                required
                dir="rtl"
                value={formData.nameAr}
                onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: طقم مهندس الكهرباء"
                error={errors.nameAr}
                className="font-arabic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Job Position <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.jobPositionId}
                onChange={e => setFormData({ ...formData, jobPositionId: e.target.value })}
              >
                {jobPositions.filter(j => j.active).map(j => (
                  <option key={j.id} value={j.id}>{j.nameEn} ({j.code})</option>
                ))}
              </Select>
            </div>
          </div>
        </ContainerCard>

        {/* Repeatable Line Items */}
        <ContainerCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 ">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Kit Line Items ({formData.items.length})
              </h3>
              <p className="text-xs text-slate-500 ">
                Select equipment and default quantities. At issuance, employee's last received sizes will be pre-filled automatically.
              </p>
            </div>

            <Button type="button" size="sm" variant="secondary" onClick={handleAddLine}>
              <Plus className="w-3.5 h-3.5 me-1" /> Add Equipment Line
            </Button>
          </div>

          {errors.items && <p className="text-xs text-red-600 font-bold">{errors.items}</p>}

          <div className="space-y-3">
            {formData.items.map((line, idx) => {
              const currentItem = ppeItems.find(p => p.id === line.ppeItemId);
              const isInactiveOrTrashed = currentItem ? (!currentItem.active || Boolean(currentItem.deletedAt)) : true;

              return (
                <div 
                  key={line.id} 
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                    isInactiveOrTrashed 
                      ? 'bg-red-50/50 border-red-200 ' 
                      : 'bg-slate-50 border-slate-200 '
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>

                  <div className="flex-1">
                    <Select
                      value={line.ppeItemId}
                      onChange={e => handleLineChange(line.id, 'ppeItemId', e.target.value)}
                    >
                      {ppeItems.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.itemCode} — {p.nameEn} ({p.riskCategory})
                        </option>
                      ))}
                    </Select>

                    {/* Visually flag inactive or trashed line items (BD-I477, BD-I480) */}
                    {isInactiveOrTrashed && (
                      <span className="text-[10px] font-bold text-red-700 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-600 " />
                        Warning: This equipment item has since been deactivated or trashed.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">Qty:</span>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={e => handleLineChange(line.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 font-mono font-bold text-center"
                    />
                    <span className="text-xs text-slate-400 font-mono w-12">{currentItem?.uom || 'Piece'}</span>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors ms-2"
                      title="Remove Line Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ContainerCard>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ">
          <Button type="button" variant="secondary" onClick={() => navigate('/kits')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Job Kit' : 'Create Job Kit'}
          </Button>
        </div>
      </form>

      {/* Admin Override Modal */}
      <AdminOverrideModal
        isOpen={overrideModal.isOpen}
        title={overrideModal.title}
        warningMessage={overrideModal.warning}
        onConfirm={(reason) => {
          overrideModal.action();
          setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} });
        }}
        onCancel={() => setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} })}
      />
    </div>
  );
}
