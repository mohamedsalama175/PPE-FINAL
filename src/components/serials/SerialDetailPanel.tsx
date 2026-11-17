import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { SerialUnit } from '../../types';
import { SerialStatusBadge } from './SerialStatusBadge';
import { X } from 'lucide-react';
import { format } from 'date-fns';

/** PPE-059: read-only serial details with the full event timeline (append-only history). */
export function SerialDetailPanel({ unit, onClose }: { unit: SerialUnit; onClose: () => void }) {
  const { t } = useTranslation();
  const { ppeItems, locations, employees, serialEvents, issuances, describeSerialLocation } = usePPEStore();
  const item = ppeItems.find(p => p.id === unit.ppeItemId);
  const events = serialEvents
    .filter(e => e.serialUnitId === unit.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const loc = (id?: string) => locations.find(l => l.id === id)?.name || id;
  const who = (id: string) => employees.find(e => e.id === id)?.name || id;
  const fmt = (iso: string) => { try { return format(new Date(iso), 'yyyy-MM-dd HH:mm'); } catch { return iso; } };
  const holdingIssue = unit.status === 'Issued' ? issuances.find(i => i.id === unit.holderIssuanceId) : undefined;

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-canvas gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-ink">{unit.serial}</span>
          <SerialStatusBadge status={unit.status} />
        </div>
        <button onClick={onClose} className="text-body hover:text-ink" aria-label={t('cancel')}><X className="w-5 h-5" /></button>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-sm">
        <div><dt className="text-[11px] text-body uppercase">{t('item')}</dt><dd className="font-semibold">{item?.itemCode} · {item?.name}{item?.deletedAt ? ' (Trash Bin)' : ''}</dd></div>
        <div><dt className="text-[11px] text-body uppercase">{t('currentLocationOrHolder')}</dt><dd>{describeSerialLocation(unit)}
          {holdingIssue && <span className="text-body text-xs"> · {fmt(holdingIssue.issueDate).slice(0, 10)}</span>}</dd></div>
        <div><dt className="text-[11px] text-body uppercase">{t('entryDate')}</dt><dd>{fmt(unit.createdAt)}</dd></div>
        <div><dt className="text-[11px] text-body uppercase">{t('batch')}</dt><dd className="font-mono">{unit.batchNumber || '-'}</dd></div>
      </dl>

      <div className="px-4 pb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-3">{t('history')}</h4>
        <ol className="relative border-s-2 border-border ms-2 space-y-4">
          {events.map(e => (
            <li key={e.id} className="ms-4">
              <span className="absolute -start-[7px] mt-1 w-3 h-3 rounded-full bg-accent border-2 border-surface" aria-hidden />
              <div className="text-sm font-semibold text-ink">{e.type}</div>
              <div className="text-xs text-body">
                {fmt(e.date)} · {who(e.userId)}
                {e.fromLocationId && <> · {loc(e.fromLocationId)}</>}
                {e.toLocationId && <> → {loc(e.toLocationId)}</>}
                {(e.type === 'Issue' && e.holderEmployeeId) && <> · {who(e.holderEmployeeId)}</>}
                {(e.type === 'Loan' && e.holderName) && <> · {e.holderName}</>}
                {e.reference && <> · <span className="font-mono">{e.reference}</span></>}
                {e.note && <> · {e.note}</>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
