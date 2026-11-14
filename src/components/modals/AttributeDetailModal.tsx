import * as React from 'react';
import { Attribute } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, Layers, Tags } from 'lucide-react';

interface AttributeDetailModalProps {
  attribute: Attribute | null;
  onClose: () => void;
  onEdit?: (attribute: Attribute) => void;
}

export function AttributeDetailModal({ attribute, onClose, onEdit }: AttributeDetailModalProps) {
  const { language } = useTranslation();
  const { itemGroups, ppeItems } = usePPEStore();

  if (!attribute) return null;

  const linkedGroups = itemGroups.filter(g => g.attributeIds.includes(attribute.id));
  const usageCount = ppeItems.filter(p => linkedGroups.some(g => g.id === p.itemGroupId)).length;

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-canvas">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-ink font-bold">
              {attribute.code}
            </span>
            <h3 className="font-bold text-ink text-sm">
              {language === 'en' ? attribute.nameEn : attribute.nameAr}
            </h3>
            <StatusBadge status={attribute.active ? 'success' : 'neutral'} label={attribute.active ? 'Active' : 'Inactive'} />
          </div>
          <button onClick={onClose} className="text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Values List */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-accent" />
              Predefined Ordered Values ({attribute.values.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {attribute.values
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((val) => (
                  <span key={val.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-canvas border border-border text-xs font-semibold text-ink">
                    <span className="text-[10px] text-body">#{val.sortOrder}</span> {val.value}
                  </span>
                ))}
            </div>
          </div>

          {/* Linked Item Groups */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-accent" />
              Assigned Item Groups ({linkedGroups.length})
            </div>
            {linkedGroups.length === 0 ? (
              <p className="text-xs text-body italic">Not currently attached to any Item Groups.</p>
            ) : (
              <div className="space-y-1.5">
                {linkedGroups.map(group => (
                  <div key={group.id} className="p-2.5 rounded bg-canvas border border-border text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-ink mr-2">{group.code}</span>
                      <span className="text-body">{language === 'en' ? group.nameEn : group.nameAr}</span>
                    </div>
                    <StatusBadge status={group.active ? 'success' : 'neutral'} label={group.active ? 'Active' : 'Inactive'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-canvas p-3 rounded border border-border text-xs text-body">
            Impact: This attribute governs variants across <strong className="text-ink">{usageCount} PPE catalog item(s)</strong>.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-canvas flex justify-between items-center">
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(attribute)}>
              Edit Attribute
            </Button>
          )}
          <Button size="sm" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

