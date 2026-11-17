import * as React from 'react';
import { Link } from 'react-router-dom';
import { UnitOfMeasure } from '../../types';
import { usePPEStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { X, Box } from 'lucide-react';

interface Props {
  unit: UnitOfMeasure | null;
  onClose: () => void;
  onEdit?: (u: UnitOfMeasure) => void;
  onTrash?: (u: UnitOfMeasure) => void;
  onRestore?: (u: UnitOfMeasure) => void;
}

const PAGE = 10;

/** PPE-054: read-only unit details with the items that use it. */
export function UnitDetailModal({ unit, onClose, onEdit, onTrash, onRestore }: Props) {
  const { t } = useTranslation();
  const { ppeItems, employees, unitUsage, currentUser } = usePPEStore();
  const [page, setPage] = React.useState(0);
  React.useEffect(() => setPage(0), [unit?.id]);

  if (!unit) return null;
  const usage = unitUsage(unit.id);
  const items = ppeItems.filter(p => usage.itemIds.includes(p.id)).sort((a, b) => a.itemCode.localeCompare(b.itemCode));
  const inUse = usage.itemCount + usage.trashedItemCount > 0;
  const isAdmin = currentUser.role === 'Admin';
  const who = (id?: string) => (id === 'system' || id === 'migration') ? id : employees.find(e => e.id === id)?.name || id || '-';
  const when = (iso?: string) => iso ? new Date(iso).toLocaleString() : '-';
  const pageItems = items.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-canvas gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-ink font-bold">{unit.code}</span>
            <h3 className="font-bold text-ink text-sm">{unit.name}</h3>
            <StatusBadge status={unit.deletedAt ? 'error' : unit.active ? 'success' : 'neutral'} label={unit.deletedAt ? t('trashBin') : unit.active ? t('active') : t('inactive')} />
          </div>
          <button onClick={onClose} className="text-body hover:text-ink" aria-label={t('cancel')}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-[11px] text-body uppercase">{t('code')}</dt><dd className="font-mono font-semibold">{unit.code}</dd></div>
            <div><dt className="text-[11px] text-body uppercase">{t('symbol')}</dt><dd className="font-mono">{unit.symbol} <span className="text-body text-xs">(12 {unit.symbol})</span></dd></div>
            <div><dt className="text-[11px] text-body uppercase">Created</dt><dd className="text-xs">{who(unit.createdBy)}<br />{when(unit.createdAt)}</dd></div>
            <div><dt className="text-[11px] text-body uppercase">Last changed</dt><dd className="text-xs">{unit.updatedAt ? <>{who(unit.updatedBy)}<br />{when(unit.updatedAt)}</> : '-'}</dd></div>
          </dl>

          <div>
            <div className="text-xs font-bold text-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-accent" /> {t('itemsUsingIt')} ({usage.itemCount})
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-body">{t('notUsedYet')}</p>
            ) : (
              <ul className="divide-y divide-border border border-border rounded">
                {pageItems.map(p => (
                  <li key={p.id} className="px-3 py-2 flex justify-between gap-2">
                    <Link to={`/catalog?item=${p.id}`} onClick={onClose} className="text-accent hover:underline font-mono text-xs">{p.itemCode}</Link>
                    <span className="text-xs text-ink truncate">{p.name}{!p.active && ` (${t('inactive')})`}</span>
                  </li>
                ))}
              </ul>
            )}
            {items.length > PAGE && (
              <div className="flex justify-between items-center mt-2 text-xs">
                <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
                <span>{page + 1} / {Math.ceil(items.length / PAGE)}</span>
                <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE >= items.length} onClick={() => setPage(page + 1)}>›</Button>
              </div>
            )}
            {usage.trashedItemCount > 0 && (
              <p className="text-xs text-body mt-2">{t('trashedItemsUsingIt')}: <strong>{usage.trashedItemCount}</strong></p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="px-5 py-3 border-t border-border bg-canvas flex justify-end gap-2 flex-wrap">
            {unit.deletedAt ? (
              onRestore && <Button size="sm" onClick={() => onRestore(unit)}>{t('restore')}</Button>
            ) : (
              <>
                {onTrash && (
                  <Button variant="ghost" size="sm" className="text-safety-red" disabled={inUse} title={inUse ? t('unitInUseBlocked') : undefined} onClick={() => onTrash(unit)}>
                    {t('delete')}
                  </Button>
                )}
                {onEdit && <Button size="sm" onClick={() => onEdit(unit)}>{t('edit')}</Button>}
              </>
            )}
          </div>
        )}
        {isAdmin && !unit.deletedAt && inUse && (
          <p className="px-5 pb-3 text-[11px] text-body bg-canvas">{t('unitInUseBlocked')}</p>
        )}
      </div>
    </div>
  );
}
