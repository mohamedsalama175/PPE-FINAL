import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toastStore';
import { ShieldCheck, User, Warehouse, AlertTriangle, Check, CheckCircle2 } from 'lucide-react';

export default function StoreKeeperMatrix() {
  const { t } = useTranslation();
  const { employees, locations, updateStoreKeeperAssignments } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const storeKeepers = React.useMemo(() => {
    return employees.filter(e => e.role === 'Store Keeper' && e.active);
  }, [employees]);

  const activeLocations = React.useMemo(() => {
    return locations.filter(l => l.active && !l.deletedAt);
  }, [locations]);

  // Local pending matrix state
  const [matrixState, setMatrixState] = React.useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    employees.filter(e => e.role === 'Store Keeper').forEach(k => {
      initial[k.id] = locations.filter(l => l.assignedStoreKeeperIds.includes(k.id)).map(l => l.id);
    });
    return initial;
  });

  const handleToggle = (keeperId: string, locId: string) => {
    const currentLocs = matrixState[keeperId] || [];
    const isAssigned = currentLocs.includes(locId);

    const nextLocs = isAssigned
      ? currentLocs.filter(id => id !== locId)
      : [...currentLocs, locId];

    setMatrixState({
      ...matrixState,
      [keeperId]: nextLocs
    });
  };

  const handleSaveAll = () => {
    Object.entries(matrixState).forEach(([keeperId, locIds]) => {
      updateStoreKeeperAssignments(keeperId, locIds);
    });
    addToast('Store Keeper access matrix updated and logged to Immutable Audit Log (NEW-05).', 'success');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Store Keeper Access Matrix (BD-I462)"
        subtitle="Manage authorization boundaries per warehouse. Keepers with 0 locations are immediately blocked from warehouse operations."
        action={
          <Button size="sm" onClick={handleSaveAll}>
            <Check className="w-4 h-4 me-1.5" /> Save Matrix Changes
          </Button>
        }
      />

      <ContainerCard 
        title="Store Keeper Authorization Matrix" 
        subtitle="Keepers with 0 locations are immediately blocked from warehouse operations."
        noPadding
        className="overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F6FD] border-b border-[#E2E8F0] text-slate-700 font-mono text-[11px] uppercase">
                <th className="py-3 px-4 w-64">Store Keeper</th>
                {activeLocations.map(loc => (
                  <th key={loc.id} className="py-3 px-4 text-center">
                    <span className="font-bold text-slate-900 block">{loc.nameEn}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {loc.code} ({loc.stockCondition})
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-center w-36">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/80 ">
              {storeKeepers.map(keeper => {
                const assigned = matrixState[keeper.id] || [];
                const isBlocked = assigned.length === 0;

                return (
                  <tr key={keeper.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono">
                          {keeper.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{keeper.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {keeper.employeeCode}</span>
                        </div>
                      </div>
                    </td>

                    {activeLocations.map(loc => {
                      const isChecked = assigned.includes(loc.id);

                      return (
                        <td key={loc.id} className="py-3 px-4 text-center">
                          <label className="inline-flex items-center justify-center p-2 rounded hover:bg-slate-100 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggle(keeper.id, loc.id)}
                              className="rounded text-primary focus:ring-primary cursor-pointer w-4 h-4"
                            />
                          </label>
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-center">
                      {isBlocked ? (
                        <StatusBadge status="danger" label="Blocked (0 Locs)" />
                      ) : (
                        <StatusBadge 
                          status="success" 
                          label={`${assigned.length} ${assigned.length === 1 ? 'Location' : 'Locations'}`} 
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ContainerCard>
    </div>
  );
}
