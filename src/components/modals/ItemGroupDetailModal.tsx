import * as React from 'react';
import { ItemGroup } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, Layers, Box, CheckCircle2, Shield } from 'lucide-react';

interface ItemGroupDetailModalProps {
  itemGroup: ItemGroup | null;
  onClose: () => void;
  onEdit?: (itemGroup: ItemGroup) => void;
}

export function ItemGroupDetailModal({ itemGroup, onClose, onEdit }: ItemGroupDetailModalProps) {
  const { language } = useTranslation();
  const { attributes, ppeItems } = usePPEStore();

  if (!itemGroup) return null;

  const linkedAttributes = attributes.filter(a => itemGroup.attributeIds.includes(a.id));
  const childItems = ppeItems.filter(p => p.itemGroupId === itemGroup.id && !p.deletedAt);

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-xl overflow-hidden border border-border flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-canvas">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-ink font-bold">
              {itemGroup.code}
            </span>
            <h3 className="font-bold text-ink text-sm">
              {itemGroup.name}
            </h3>
            <StatusBadge status={itemGroup.active ? 'success' : 'neutral'} label={itemGroup.active ? 'Active' : 'Inactive'} />
          </div>
          <button onClick={onClose} className="text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Rules Banner (G4) */}
          <div className="bg-canvas border border-border rounded p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-ink">Rule G4 Gender Matching Rule:</span>
            </div>
            {itemGroup.requiresGenderMatch ? (
              <span className="text-xs font-bold text-safety-green flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced (Requires Match)
              </span>
            ) : (
              <span className="text-xs text-body bg-gray-100 px-2 py-0.5 rounded">
                Not Enforced (Unisex Allowed)
              </span>
            )}
          </div>

          {/* Linked Attributes */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-accent" />
              Attached Attributes ({linkedAttributes.length})
            </div>
            {linkedAttributes.length === 0 ? (
              <p className="text-xs text-body italic">No attributes attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {linkedAttributes.map(attr => (
                  <div key={attr.id} className="p-2.5 rounded bg-canvas border border-border text-xs">
                    <div className="font-bold text-ink">{attr.name}</div>
                    <div className="text-[11px] text-body mt-1">
                      Values: {attr.values.map(v => v.value).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PPE Catalog Items under this group */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-accent" />
              Assigned Catalog Items ({childItems.length})
            </div>
            {childItems.length === 0 ? (
              <p className="text-xs text-body italic">No catalog items assigned to this group yet.</p>
            ) : (
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                    <tr>
                      <th className="p-2">Item Code</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Risk</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {childItems.map(item => (
                      <tr key={item.id} className="hover:bg-canvas/50">
                        <td className="p-2 font-mono font-bold text-ink">{item.itemCode}</td>
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2">Cat {item.riskCategory}</td>
                        <td className="p-2 text-right">
                          <StatusBadge status={item.active ? 'success' : 'neutral'} label={item.active ? 'Active' : 'Inactive'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-canvas flex justify-between items-center">
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(itemGroup)}>
              Edit Item Group
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

