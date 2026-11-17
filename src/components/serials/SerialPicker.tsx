import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { normalizeSerial } from '../../lib/serials';
import { SerialUnit } from '../../types';
import { Input } from '../ui/Input';
import { ScanBarcode, X } from 'lucide-react';

interface Props {
  ppeItemId: string;
  /** Units that may be picked. Defaults to the In Stock serials of locationId (and batch). */
  candidates?: SerialUnit[];
  locationId?: string;
  batchNumber?: string;
  value: string[]; // serial unit ids
  onChange: (ids: string[]) => void;
  /** Exact number of serials required (e.g. one per unit of a kit line). */
  required?: number;
  label?: string;
}

/**
 * PPE-058 serial picker shared by every movement screen. Search and scan (Enter adds an exact match);
 * a scanned serial that is not available shows where it is now. Quantity = serials picked.
 */
export function SerialPicker({ ppeItemId, candidates, locationId, batchNumber, value, onChange, required, label }: Props) {
  const { t } = useTranslation();
  const { serialUnits, inStockSerials, describeSerialLocation } = usePPEStore();
  const [q, setQ] = React.useState('');
  const [scanError, setScanError] = React.useState('');

  const options = React.useMemo(
    () => candidates ?? (locationId ? inStockSerials(ppeItemId, locationId, batchNumber) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, ppeItemId, locationId, batchNumber, serialUnits]
  );

  // Drop picks that are no longer available (location or batch changed, or taken by someone else).
  React.useEffect(() => {
    const allowed = new Set(options.map(o => o.id));
    if (value.some(id => !allowed.has(id))) onChange(value.filter(id => allowed.has(id)));
  }, [options]); // eslint-disable-line react-hooks/exhaustive-deps

  const picked = value.map(id => serialUnits.find(u => u.id === id)).filter(Boolean) as SerialUnit[];
  const needle = normalizeSerial(q);
  const shown = options.filter(o => !value.includes(o.id) && (!needle || o.serial.includes(needle))).slice(0, 50);
  const full = required !== undefined && value.length >= required;

  const add = (u: SerialUnit) => {
    if (value.includes(u.id) || full) return;
    onChange([...value, u.id]);
  };

  const onScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!needle) return;
    const match = options.find(o => o.serial === needle);
    if (match) {
      if (full) setScanError(`${required} ${t('serialsPicked').toLowerCase()}.`);
      else { add(match); setScanError(''); }
      setQ('');
      return;
    }
    const elsewhere = serialUnits.find(u => u.ppeItemId === ppeItemId && u.serial === needle);
    setScanError(elsewhere ? `${needle}: ${describeSerialLocation(elsewhere)}` : `${needle}: ${t('noSerialFound')}`);
  };

  return (
    <div className="space-y-2 border border-border rounded-lg p-3 bg-canvas/40">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-ink">{label || t('serialNumbers')}</span>
        <span className={`font-semibold ${required !== undefined && value.length !== required ? 'text-safety-amber-signal' : 'text-ink'}`} aria-live="polite">
          {t('serialsPicked')}: {value.length}{required !== undefined ? ` / ${required}` : ''}
        </span>
      </div>

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {picked.map(u => (
            <li key={u.id} className="inline-flex items-center gap-1 ps-2 pe-1 py-0.5 rounded bg-surface border border-accent text-accent font-mono text-[11px]">
              {u.serial}
              <button type="button" onClick={() => onChange(value.filter(id => id !== u.id))} aria-label={`${t('remove')} ${u.serial}`} className="hover:text-safety-red">
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <ScanBarcode className="absolute start-2.5 top-2.5 w-4 h-4 text-body" aria-hidden />
        <Input
          value={q}
          onChange={e => { setQ(e.target.value); setScanError(''); }}
          onKeyDown={onScan}
          placeholder={t('scanOrSearchSerial')}
          className="ps-9 w-full font-mono uppercase"
          autoComplete="off"
          disabled={full}
          aria-label={t('scanOrSearchSerial')}
        />
      </div>
      {scanError && <p className="text-xs text-safety-red" role="alert">{scanError}</p>}

      {options.length === 0 ? (
        <p className="text-xs text-body">{t('noSerialsAvailable')}</p>
      ) : !full && (
        <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
          {shown.map(u => (
            <button
              type="button"
              key={u.id}
              onClick={() => add(u)}
              className="px-2 py-1 rounded border border-border bg-surface hover:border-accent font-mono text-[11px] min-h-[32px]"
            >
              {u.serial}{u.batchNumber ? <span className="text-body"> · {u.batchNumber}</span> : null}
            </button>
          ))}
          {options.length - value.length > shown.length && <span className="text-[11px] text-body self-center">…</span>}
        </div>
      )}
    </div>
  );
}
