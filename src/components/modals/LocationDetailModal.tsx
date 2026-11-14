import * as React from 'react';
import { Location } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, MapPin, Users, Package, AlertTriangle, Lock } from 'lucide-react';

interface LocationDetailModalProps {
  location: Location | null;
  onClose: () => void;
  onEdit?: (location: Location) => void;
}

export function LocationDetailModal({ location, onClose, onEdit }: LocationDetailModalProps) {
  const { language } = useTranslation();
  const { employees, stockBalances, ppeItems } = usePPEStore();

  if (!location) return null;

  // Assigned Store Keepers
  const storeKeepers = employees.filter(e => location.assignedStoreKeeperIds.includes(e.id));

  // Items and total stock
  const locationBalances = stockBalances
    .filter(b => b.locationId === location.id && b.quantityOnHand > 0)
    .map(bal => {
      const item = ppeItems.find(p => p.id === bal.ppeItemId);
      return {
        bal,
        item
      };
    });

  const totalOnHand = locationBalances.reduce((sum, b) => sum + b.bal.quantityOnHand, 0);
  const totalQuarantined = locationBalances.reduce((sum, b) => sum + (b.bal.quarantinedOnHand || 0), 0);
  const capacity = location.capacityUnits || 1;
  const utilizationPct = Math.round((totalOnHand / capacity) * 100);

  const isNearCapacity = utilizationPct >= 90 && utilizationPct <= 100;
  const isOverCapacity = utilizationPct > 100;

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-border flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-canvas">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-ink font-bold">
              {location.code}
            </span>
            <h3 className="font-bold text-ink text-sm">
              {language === 'en' ? location.nameEn : location.nameAr}
            </h3>
            <StatusBadge status={location.active ? 'success' : 'neutral'} label={location.active ? 'Active' : 'Inactive'} />
          </div>
          <button onClick={onClose} className="text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-canvas/70 p-4 rounded border border-border">
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Site Campus</div>
              <div className="text-xs font-semibold text-ink mt-0.5">{location.site || '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Location Type</div>
              <div className="text-xs font-semibold text-ink mt-0.5">{location.locationType}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Stock Condition (G6)</div>
              <div className="text-xs font-semibold text-ink mt-0.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  location.stockCondition === 'Scrap' ? 'bg-red-100 text-safety-red' : location.stockCondition === 'Used' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-safety-green'
                }`}>
                  {location.stockCondition || 'New'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-body uppercase tracking-wider">Opening Balance (G1)</div>
              <div className="text-xs font-semibold text-ink mt-0.5 flex items-center gap-1">
                {location.openingBalanceClosed ? (
                  <span className="text-safety-red flex items-center gap-1"><Lock className="w-3 h-3" /> Closed</span>
                ) : (
                  <span className="text-safety-green">Open</span>
                )}
              </div>
            </div>
          </div>

          {/* Capacity Utilization Progress Bar (PPE-021) */}
          <div className="border border-border p-4 rounded bg-surface">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-body">Capacity Utilization</span>
              <span className={`text-xs font-bold ${isOverCapacity ? 'text-safety-red' : isNearCapacity ? 'text-safety-amber-signal' : 'text-ink'}`}>
                {totalOnHand} / {capacity} units ({utilizationPct}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all ${
                  isOverCapacity ? 'bg-safety-red' : isNearCapacity ? 'bg-safety-amber-signal' : 'bg-accent'
                }`}
                style={{ width: `${Math.min(100, utilizationPct)}%` }}
              />
            </div>
            {isOverCapacity && (
              <div className="mt-2 text-xs text-safety-red flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Location is over maximum storage capacity!
              </div>
            )}
            {isNearCapacity && !isOverCapacity && (
              <div className="mt-2 text-xs text-safety-amber-signal flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Warning: Location is near capacity (≥ 90%).
              </div>
            )}
          </div>

          {/* Assigned Store Keepers (PPE-023) */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" />
              Assigned Store Keepers (PPE-023)
            </div>
            {storeKeepers.length === 0 ? (
              <p className="text-xs text-body italic bg-canvas p-3 rounded border border-border">
                No dedicated store keepers assigned. Only Admins and HSE Supervisors have write access.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {storeKeepers.map(sk => (
                  <div key={sk.id} className="p-2.5 rounded bg-canvas border border-border text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-ink">{sk.name}</div>
                      <div className="text-[10px] text-body font-mono">{sk.employeeCode}</div>
                    </div>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">Store Keeper</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Stock Inventory */}
          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-accent" />
              Current Inventory on Hand ({locationBalances.length} lines)
            </div>
            {locationBalances.length === 0 ? (
              <p className="text-xs text-body italic bg-canvas p-3 rounded border border-border">
                No items currently stored at this location.
              </p>
            ) : (
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Code</th>
                      <th className="p-2 text-right">Available</th>
                      <th className="p-2 text-right">Quarantined</th>
                      <th className="p-2 text-right">Total On Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locationBalances.map(({ bal, item }) => (
                      <tr key={bal.id} className="hover:bg-canvas/50">
                        <td className="p-2 font-medium text-ink">{item ? (language === 'en' ? item.nameEn : item.nameAr) : bal.ppeItemId}</td>
                        <td className="p-2 font-mono text-body">{item?.itemCode || '-'}</td>
                        <td className="p-2 text-right font-bold text-safety-green">
                          {Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0))}
                        </td>
                        <td className="p-2 text-right text-safety-amber-signal">
                          {bal.quarantinedOnHand || 0}
                        </td>
                        <td className="p-2 text-right font-bold text-ink">
                          {bal.quantityOnHand}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-canvas flex justify-between items-center">
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(location)}>
              Edit Location
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

