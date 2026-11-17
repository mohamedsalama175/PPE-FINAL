import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { normalizeSerial, parseSerialInput, SerialEntryError } from '../../lib/serials';
import { ScanBarcode, XCircle } from 'lucide-react';

interface Props {
  ppeItemId: string;
  value: string[];
  onChange: (serials: string[]) => void;
  /** Serials already used by other lines of the same document, to catch repeats across lines. */
  otherLineSerials?: string[];
  id?: string;
}

/**
 * PPE-057 serial entry: replaces the quantity field for a tracked item.
 * Accepts typing, a barcode scanner (each scan ends with Enter = new line) and pasted lists.
 * Validates live: format, repeats in the entry, and serials already registered for the item.
 */
export function SerialEntryBox({ ppeItemId, value, onChange, otherLineSerials = [], id }: Props) {
  const { t } = useTranslation();
  const { validateNewSerials, serialUnits } = usePPEStore();
  const [text, setText] = React.useState(value.join('\n'));

  // keep the box in sync when the parent resets the line
  React.useEffect(() => {
    if (parseSerialInput(text).map(normalizeSerial).join('\n') !== value.join('\n')) setText(value.join('\n'));
  }, [value.join('\n')]); // eslint-disable-line react-hooks/exhaustive-deps

  const serials = React.useMemo(() => parseSerialInput(text), [text]);
  const errors = React.useMemo<SerialEntryError[]>(() => {
    const own = validateNewSerials(ppeItemId, serials);
    const others = new Set(otherLineSerials.map(normalizeSerial));
    const cross = serials
      .map((s, index) => ({ s: normalizeSerial(s), index }))
      .filter(x => others.has(x.s) && !own.some(e => e.index === x.index))
      .map(x => ({ index: x.index, serial: x.s, code: 'duplicate_in_entry' as const, message: `${x.s} is already on another line.` }));
    return [...own, ...cross];
    // serialUnits: re-validate when other users register serials
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serials, ppeItemId, otherLineSerials.join('|'), serialUnits]);
  const badIndex = new Set(errors.map(e => e.index));

  const update = (next: string) => {
    setText(next);
    onChange(parseSerialInput(next).map(normalizeSerial));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <ScanBarcode className="absolute start-2.5 top-2.5 w-4 h-4 text-body" aria-hidden />
        <textarea
          id={id}
          value={text}
          onChange={e => update(e.target.value)}
          rows={Math.min(10, Math.max(4, serials.length + 1))}
          className="input-base h-auto min-h-[7rem] w-full ps-9 py-2 font-mono uppercase text-sm leading-6"
          placeholder={'SN-100234\nSN-100235'}
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={errors.length > 0}
          aria-describedby={id ? `${id}-help` : undefined}
        />
      </div>
      <div id={id ? `${id}-help` : undefined} className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-body">{t('serialEntryHint')}</span>
        <span className={`font-semibold ${errors.length ? 'text-safety-red' : 'text-ink'}`} aria-live="polite">
          {t('serialsEntered')}: {serials.length}
        </span>
      </div>
      {serials.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('serialsEntered')}>
          {serials.map((s, i) => (
            <li key={`${s}-${i}`} className={`px-2 py-0.5 rounded font-mono text-[11px] border ${badIndex.has(i) ? 'bg-red-50 border-safety-red text-safety-red' : 'bg-canvas border-border text-ink'}`}>
              {normalizeSerial(s)}
            </li>
          ))}
        </ul>
      )}
      {errors.length > 0 && (
        <ul className="text-xs text-safety-red space-y-0.5" role="alert">
          {errors.slice(0, 8).map((e, i) => <li key={i} className="flex items-center gap-1"><XCircle className="w-3 h-3 shrink-0" /> {e.message}</li>)}
          {errors.length > 8 && <li>+{errors.length - 8} more</li>}
        </ul>
      )}
    </div>
  );
}

/** True when a serial list is ready to save for a tracked item. */
export function serialEntryValid(state: ReturnType<typeof usePPEStore.getState>, ppeItemId: string, serials: string[]): boolean {
  return serials.length > 0 && state.validateNewSerials(ppeItemId, serials).length === 0;
}
