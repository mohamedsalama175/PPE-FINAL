import * as React from 'react';
import { PenTool, RotateCcw, Check, UserCheck, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

interface SignaturePadProps {
  label: string;
  roleHint?: string;
  icon?: 'storekeeper' | 'employee';
  value?: string;
  onChange?: (base64Url: string) => void;
  onSave?: (base64Url: string) => void;
  required?: boolean;
}

export function SignaturePad({
  label,
  roleHint,
  icon = 'employee',
  value,
  onChange,
  onSave,
  required = false
}: SignaturePadProps) {
  const triggerChange = (url: string) => {
    if (onChange) onChange(url);
    if (onSave) onSave(url);
  };
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(Boolean(value));

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = icon === 'storekeeper' ? '#0f766e' : '#1e3a8a';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value, icon]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    triggerChange(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    triggerChange('');
  };

  const handleSimulateQuickSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    handleClear();
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(20, rect.height / 2 + 10);
    ctx.bezierCurveTo(rect.width * 0.3, 10, rect.width * 0.6, rect.height - 10, rect.width - 20, rect.height / 2);
    ctx.stroke();

    setHasSignature(true);
    triggerChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {icon === 'storekeeper' ? (
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          ) : (
            <UserCheck className="w-4 h-4 text-blue-600" />
          )}
          <div>
            <span className="font-bold text-slate-800">{label}</span>
            {required && <span className="text-red-500 ms-0.5">*</span>}
            {roleHint && <span className="text-[10px] text-slate-500 ms-2 font-mono">({roleHint})</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSimulateQuickSignature}
            className="text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            Auto-Sign
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-medium text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Signature Canvas Box */}
      <div className="relative w-full h-28 bg-white border border-slate-300 rounded overflow-hidden shadow-2xs touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 gap-1">
            <PenTool className="w-5 h-5 opacity-40" />
            <span className="text-[11px] font-mono tracking-wider opacity-60">
              Sign with mouse, stylus or touch
            </span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute bottom-1 end-2 pointer-events-none flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-1.5 py-0.5 rounded">
            <Check className="w-3 h-3 text-emerald-600" />
            Captured
          </div>
        )}
      </div>
    </div>
  );
}

export function DualSignatureSection({
  storeKeeperSig,
  receiverSig,
  onStoreKeeperSigChange,
  onReceiverSigChange,
  receiverLabel = "Recipient / Employee Signature",
  receiverRole = "Recipient"
}: {
  storeKeeperSig: string;
  receiverSig: string;
  onStoreKeeperSigChange: (val: string) => void;
  onReceiverSigChange: (val: string) => void;
  receiverLabel?: string;
  receiverRole?: string;
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-slate-600" />
          Mandatory Dual Digital Signatures (Rule 2)
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">
          Embedded into PDF audit timeline
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignaturePad
          label="Store Keeper Signature"
          roleHint="Issuing Officer"
          icon="storekeeper"
          value={storeKeeperSig}
          onChange={onStoreKeeperSigChange}
          required
        />
        <SignaturePad
          label={receiverLabel}
          roleHint={receiverRole}
          icon="employee"
          value={receiverSig}
          onChange={onReceiverSigChange}
          required
        />
      </div>
    </div>
  );
}
