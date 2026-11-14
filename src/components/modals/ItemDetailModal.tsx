import * as React from 'react';
import { PPEItem } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, AlertTriangle, ShieldCheck, Clock, MapPin, Users, History } from 'lucide-react';
import { format } from 'date-fns';

interface ItemDetailModalProps {
  item: PPEItem | null;
  onClose: () => void;
  onEdit?: (item: PPEItem) => void;
}

export function ItemDetailModal({ item, onClose, onEdit }: ItemDetailModalProps) {
  const { language } = useTranslation();
  const { locations, stockBalances, issuances, itemGroups, employees, auditLogs } = usePPEStore();

  if (!item) return null;

  const group = itemGroups.find(g => g.id === item.itemGroupId);

  // Stock per location with low stock check (PPE-006)
  const locationStockList = locations
    .filter(l => item.locationIds.includes(l.id))
    .map(loc => {
      const bal = stockBalances.find(b => b.ppeItemId === item.id && b.locationId === loc.id);
      const onHand = bal ? bal.quantityOnHand : 0;
      const isLow = onHand <= item.reorderLevel;
      const isOut = onHand === 0;
      return {
        loc,
        onHand,
        isLow,
        isOut
      };
    });

  // Active issuances
  const activeHoldings = issuances
    .filter(i => i.ppeItemId === item.id && i.status === 'issued')
    .map(iss => {
      const emp = employees.find(e => e.id === iss.employeeId);
      return {
        iss,
        empName: emp ? emp.name : (iss.holderName || 'External Holder')
      };
    });

  // Audit history
  const itemLogs = auditLogs.filter(l => l.objectReference === item.id || l.objectReference === item.itemCode);

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-canvas">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-ink font-bold">
              {item.itemCode}
            </span>
            <h2 className="text-base font-bold text-ink">
              {language === 'en' ? item.nameEn : item.nameAr}
            </h2>
            <StatusBadge 
              status={item.active ? 'success' : 'neutral'} 
              label={item.active ? 'Active' : 'Inactive'} 
            />
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                Edit Item
              </Button>
            )}
            <button onClick={onClose} className="text-body hover:text-ink p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-canvas/60 p-4 rounded-md border border-border">
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Category</div>
              <div className="text-sm font-semibold text-ink mt-0.5">{item.category}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Item Group</div>
              <div className="text-sm font-semibold text-ink mt-0.5">{group ? (language === 'en' ? group.nameEn : group.nameAr) : '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Risk Category</div>
              <div className="text-sm font-semibold text-ink mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${item.riskCategory === 'III' ? 'bg-safety-red' : item.riskCategory === 'II' ? 'bg-safety-amber-signal' : 'bg-safety-green'}`} />
                Category {item.riskCategory}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Lifespan (G5)</div>
              <div className="text-sm font-semibold text-ink mt-0.5">{item.lifespanValue} {item.lifespanType}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Manufacturer & Model</div>
              <div className="text-xs text-ink mt-0.5">{item.manufacturer || '-'} &middot; {item.model || '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Standard & Certification</div>
              <div className="text-xs text-ink mt-0.5">{item.standardCertification || '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Reorder Level</div>
              <div className="text-xs font-semibold text-ink mt-0.5">{item.reorderLevel} {item.uom}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Target Gender</div>
              <div className="text-xs text-ink mt-0.5">{item.gender}</div>
            </div>
          </div>

          {/* PPE-006: Low Stock Indicator per Location */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Stock Levels Across Valid Locations (PPE-006)
              </h3>
              <span className="text-[11px] text-body">
                Reorder Threshold: <strong className="text-ink">{item.reorderLevel} {item.uom}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {locationStockList.map(({ loc, onHand, isLow, isOut }) => (
                <div 
                  key={loc.id} 
                  className={`p-3.5 rounded border transition-colors ${
                    isOut 
                      ? 'bg-red-50 border-safety-red/30' 
                      : isLow 
                        ? 'bg-amber-50 border-safety-amber-signal/30' 
                        : 'bg-surface border-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm text-ink">{loc.nameEn}</div>
                      <div className="text-[11px] text-body">{loc.site} &middot; {loc.locationType}</div>
                    </div>
                    {isOut ? (
                      <span className="text-[10px] font-bold bg-safety-red text-white px-1.5 py-0.5 rounded uppercase">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold bg-safety-amber-signal text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-safety-green bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        Sufficient
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xs text-body">On Hand:</span>
                    <span className={`text-lg font-bold ${isOut ? 'text-safety-red' : isLow ? 'text-safety-amber-signal' : 'text-ink'}`}>
                      {onHand} <span className="text-xs font-normal text-body">{item.uom}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Custody & Employee Holdings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" />
              Active Custody & Holdings ({activeHoldings.length})
            </h3>
            {activeHoldings.length === 0 ? (
              <div className="p-4 rounded border border-border bg-canvas/40 text-xs text-body text-center">
                No active issuances currently held by employees for this item.
              </div>
            ) : (
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Holder</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Issued Date</th>
                      <th className="p-2.5">Replacement Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeHoldings.map(({ iss, empName }) => (
                      <tr key={iss.id} className="hover:bg-canvas/50">
                        <td className="p-2.5 font-medium text-ink">{empName}</td>
                        <td className="p-2.5 font-mono">{iss.quantity}</td>
                        <td className="p-2.5">{format(new Date(iss.issueDate), 'yyyy-MM-dd')}</td>
                        <td className="p-2.5">
                          {iss.expectedReplacementDate ? format(new Date(iss.expectedReplacementDate), 'yyyy-MM-dd') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit History */}
          {itemLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-accent" />
                Audit Trail (G1)
              </h3>
              <div className="space-y-2">
                {itemLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-2.5 bg-canvas rounded border border-border text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-ink mr-2">{log.action}</span>
                      <span className="text-body">{log.details || log.reason || ''}</span>
                    </div>
                    <div className="text-[11px] text-body">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')} &middot; {log.user || log.performedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-canvas flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

