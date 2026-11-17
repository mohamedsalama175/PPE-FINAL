import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { SerialStatus, SerialUnit } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { SerialStatusBadge, SERIAL_STATUSES, useSerialStatusLabel } from './SerialStatusBadge';
import { ScanBarcode, Search } from 'lucide-react';

interface Props {
  /** Fix the list to one item (item details screen, PPE-006). */
  ppeItemId?: string;
  onOpen: (unit: SerialUnit) => void;
  pageSize?: number;
}

/**
 * PPE-059 serial list: search by part of a serial, filter by item and status.
 * Scoped by role through visibleSerialUnits (Store Keepers see only their assigned locations).
 */
export function SerialList({ ppeItemId, onOpen, pageSize = 25 }: Props) {
  const { t } = useTranslation();
  const statusLabel = useSerialStatusLabel();
  const state = usePPEStore();
  const { ppeItems, serialUnits, currentUser, visibleSerialUnits, describeSerialLocation } = state;

  const [q, setQ] = React.useState('');
  const [itemFilter, setItemFilter] = React.useState(ppeItemId || '');
  const [statusFilter, setStatusFilter] = React.useState<SerialStatus | ''>('');
  const [limit, setLimit] = React.useState(pageSize);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visible = React.useMemo(() => visibleSerialUnits(currentUser), [serialUnits, currentUser, visibleSerialUnits]);
  const trackedItems = React.useMemo(
    () => ppeItems.filter(p => p.serialTracked).sort((a, b) => a.itemCode.localeCompare(b.itemCode)),
    [ppeItems]
  );

  const rows = React.useMemo(() => {
    const needle = q.trim().toUpperCase();
    const item = ppeItemId || itemFilter;
    return visible
      .filter(u => !item || u.ppeItemId === item)
      .filter(u => !statusFilter || u.status === statusFilter)
      .filter(u => !needle || u.serial.includes(needle))
      .sort((a, b) => a.serial.localeCompare(b.serial));
  }, [visible, q, itemFilter, statusFilter, ppeItemId]);

  React.useEffect(() => setLimit(pageSize), [q, itemFilter, statusFilter, pageSize]);

  const counts = React.useMemo(() => {
    const base = visible.filter(u => !(ppeItemId || itemFilter) || u.ppeItemId === (ppeItemId || itemFilter));
    return Object.fromEntries(SERIAL_STATUSES.map(s => [s, base.filter(u => u.status === s).length])) as Record<SerialStatus, number>;
  }, [visible, ppeItemId, itemFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-body" aria-hidden />
          <Input type="search" inputMode="search" className="ps-9 w-full font-mono" placeholder={t('scanOrSearchSerial')} value={q} onChange={e => setQ(e.target.value)} autoFocus={!ppeItemId} aria-label={t('scanOrSearchSerial')} />
        </div>
        {!ppeItemId && (
          <Select value={itemFilter} onChange={e => setItemFilter(e.target.value)} className="sm:w-56" aria-label={t('item')}>
            <option value="">{t('all')}: {t('item')}</option>
            {trackedItems.map(p => <option key={p.id} value={p.id}>{p.itemCode} - {p.name}{p.deletedAt ? ' (Trash)' : ''}</option>)}
          </Select>
        )}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('status')}>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusFilter === '' ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-body'}`}
        >{t('all')}</button>
        {SERIAL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusFilter === s ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-body'}`}
          >{statusLabel(s)} <span className="opacity-70">{counts[s]}</span></button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<ScanBarcode />} title={t('noSerialFound')} description={q ? `"${q}"` : undefined} />
      ) : (
        <div className="border border-border rounded overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-canvas border-b border-border text-body uppercase font-bold">
              <tr>
                <th className="p-2.5 text-start">{t('serialNumber')}</th>
                {!ppeItemId && <th className="p-2.5 text-start">{t('item')}</th>}
                <th className="p-2.5 text-start">{t('status')}</th>
                <th className="p-2.5 text-start">{t('currentLocationOrHolder')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, limit).map(u => {
                const item = ppeItems.find(p => p.id === u.ppeItemId);
                return (
                  <tr key={u.id} className="hover:bg-canvas/50 cursor-pointer" onClick={() => onOpen(u)}>
                    <td className="p-2.5 font-mono font-bold text-accent">{u.serial}</td>
                    {!ppeItemId && <td className="p-2.5">{item?.itemCode} <span className="text-body">{item?.name}</span></td>}
                    <td className="p-2.5"><SerialStatusBadge status={u.status} /></td>
                    <td className="p-2.5 text-body">{describeSerialLocation(u)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > limit && (
            <button className="w-full py-2 text-xs text-accent hover:bg-canvas" onClick={() => setLimit(limit + pageSize)}>
              {rows.length - limit} more…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
