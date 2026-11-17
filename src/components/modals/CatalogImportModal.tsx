import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { X, Upload, Download } from 'lucide-react';
import { downloadCsv, parseCsv } from '../../lib/excelService';
import { CATALOG_COLUMNS, ImportMode, ImportPreview, applyCatalogImport, previewCatalogImport } from '../../lib/catalogIO';

/** PPE-007 import: choose mode, upload, preview counts, confirm, download the error report. */
export function CatalogImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = usePPEStore();
  const addToast = useToastStore(s => s.addToast);
  const [mode, setMode] = React.useState<ImportMode>('add');
  const [fileName, setFileName] = React.useState('');
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);

  React.useEffect(() => { if (!open) { setPreview(null); setFileName(''); } }, [open]);
  if (!open) return null;

  const downloadTemplate = () => {
    downloadCsv('ppe_catalog_template', [...CATALOG_COLUMNS], [[
      'HLM-001', 'Safety Helmet', 'Head', 'HEAD', 'PCS', '6', 'Months', 'II', 'HQ-WH-01;SITEB-01',
      'HQ-WH-01:20;SITEB-01:5', 'COLOR=Yellow|White', 'No', 'Certified hard hat', '3M', 'H-700', 'ANSI Z89.1', 'Yes',
    ]]);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows } = parseCsv(String(reader.result || '').replace(/^﻿/, ''));
      setPreview(previewCatalogImport(usePPEStore.getState(), rows, mode));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadErrors = (errors: ImportPreview['errors']) =>
    downloadCsv('ppe_catalog_import_errors', ['Row', 'Item Code', 'Reason'], errors.map(er => [er.row || '', er.code, er.reason]));

  const confirm = () => {
    if (!preview) return;
    const res = applyCatalogImport(state.saveEntity, preview);
    addToast(`Import done: ${res.added} added, ${res.updated} updated, ${res.errors.length} rejected.`, res.errors.length ? 'error' : 'success');
    if (res.errors.length) downloadErrors(res.errors);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg border border-border">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-canvas">
          <h3 className="font-bold text-ink text-sm">Import catalog (PPE-007)</h3>
          <button onClick={onClose} className="text-body hover:text-ink" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex-1 space-y-1">
              <span className="block text-xs font-medium text-body">Import mode *</span>
              <Select value={mode} onChange={e => { setMode(e.target.value as ImportMode); setPreview(null); setFileName(''); }}>
                <option value="add">Add New Only</option>
                <option value="upsert">Add New and Update Existing</option>
              </Select>
            </label>
            <Button variant="secondary" onClick={downloadTemplate}><Download className="w-4 h-4 me-2" /> Template</Button>
          </div>
          <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-canvas">
            <Upload className="w-4 h-4" />
            <span>{fileName || 'Choose a .csv file (Excel: Save As CSV UTF-8)'}</span>
            <input type="file" accept=".csv" onChange={onFile} className="hidden" />
          </label>
          <p className="text-[11px] text-body">The Unit of Measure column takes the unit Code (for example PCS). Names are English only.</p>

          {preview && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded border border-border"><div className="text-lg font-bold text-safety-green">{preview.toAdd.length}</div><div className="text-[11px]">New</div></div>
              <div className="p-2 rounded border border-border"><div className="text-lg font-bold text-accent">{preview.toUpdate.length}</div><div className="text-[11px]">Updated</div></div>
              <div className="p-2 rounded border border-border"><div className="text-lg font-bold text-safety-red">{preview.errors.length}</div><div className="text-[11px]">Errors</div></div>
            </div>
          )}
          {preview && preview.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto text-xs border border-border rounded p-2 space-y-1">
              {preview.errors.slice(0, 20).map((er, i) => <div key={i}>Row {er.row} {er.code && `(${er.code})`}: {er.reason}</div>)}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-border bg-canvas flex justify-end gap-2">
          {preview && preview.errors.length > 0 && <Button variant="ghost" onClick={() => downloadErrors(preview.errors)}>Error report</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!preview || preview.toAdd.length + preview.toUpdate.length === 0} onClick={confirm}>Confirm import</Button>
        </div>
      </div>
    </div>
  );
}
