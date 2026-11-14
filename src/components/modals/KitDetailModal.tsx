import * as React from 'react';
import { Kit } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, Briefcase, Box, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KitDetailModalProps {
  kit: Kit | null;
  onClose: () => void;
  onEdit?: (kit: Kit) => void;
}

export function KitDetailModal({ kit, onClose, onEdit }: KitDetailModalProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { jobPositions, ppeItems, stockBalances, issuances, moduleSettings } = usePPEStore();

  if (!kit) return null;

  const jobPosition = jobPositions.find(j => j.id === kit.jobPositionId);

  // PPE-032: Count how many times the Kit was issued in the last 90 days
  const recentWindowDays = moduleSettings.recentIssuanceWindowDays || 90;
  const recentThreshold = new Date(Date.now() - recentWindowDays * 24 * 60 * 60 * 1000);
  const recentIssuancesCount = issuances.filter(i => i.kitId === kit.id && new Date(i.issueDate) >= recentThreshold).length;

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-xl overflow-hidden border border-border flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-canvas">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-ink text-sm">
              {language === 'en' ? kit.nameEn : kit.nameAr}
            </h3>
            <StatusBadge status={kit.active ? 'success' : 'neutral'} label={kit.active ? 'Active' : 'Inactive'} />
          </div>
          <button onClick={onClose} className="text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-canvas border border-border rounded p-3 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-body uppercase tracking-wider">Target Job Position</span>
              <span className="text-xs font-bold text-ink mt-1">
                {jobPosition ? (language === 'en' ? jobPosition.nameEn : jobPosition.nameAr) : 'Unassigned'}
              </span>
            </div>

            {/* PPE-032: 90-day Issuance Frequency */}
            <div className="bg-canvas border border-border rounded p-3 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-body uppercase tracking-wider">Last {recentWindowDays} Days Activity</span>
              <span className="text-xs font-bold text-accent mt-1">
                {recentIssuancesCount > 0 ? `Issued ${recentIssuancesCount} times` : 'Not yet issued'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-accent" />
              Items Included in Kit ({kit.items.length})
            </div>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5 text-center">Required Qty</th>
                    <th className="p-2.5 text-right">Total Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kit.items.map(ki => {
                    const item = ppeItems.find(p => p.id === ki.ppeItemId);
                    const isInactiveOrTrashed = !item || !item.active || Boolean(item.deletedAt);
                    const totalAvail = stockBalances
                      .filter(b => b.ppeItemId === ki.ppeItemId)
                      .reduce((sum, b) => sum + Math.max(0, b.quantityOnHand - (b.quarantinedOnHand || 0)), 0);

                    const isOut = totalAvail === 0;
                    const isLow = totalAvail < ki.qty;

                    return (
                      <tr key={ki.id} className={`hover:bg-canvas/50 ${isInactiveOrTrashed ? 'bg-red-50/40' : ''}`}>
                        <td className="p-2.5 font-medium text-ink">
                          <div>
                            {item ? (language === 'en' ? item.nameEn : item.nameAr) : ki.ppeItemId}
                            {isInactiveOrTrashed && (
                              <span className="ml-2 text-[10px] font-bold text-safety-red bg-red-100 px-1.5 py-0.2 rounded">
                                Inactive/Trashed (PPE-032)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-body">{item?.itemCode || '-'}</td>
                        <td className="p-2.5 text-center font-bold">{ki.qty} {item?.uom || ''}</td>
                        <td className="p-2.5 text-right font-semibold">
                          <span className={isOut ? 'text-safety-red' : isLow ? 'text-safety-amber-signal' : 'text-safety-green'}>
                            {totalAvail} units
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-canvas flex justify-between items-center">
          <Button 
            size="sm" 
            onClick={() => {
              onClose();
              navigate(`/issuances/new-kit?kitId=${kit.id}`);
            }}
          >
            Issue this Kit <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <div className="flex gap-2">
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={() => onEdit(kit)}>
                Edit Kit
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

