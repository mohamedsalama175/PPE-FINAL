import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  width = 'xl',
  children,
  footer,
}: SlideOverDrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[width];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* 
        CRITICAL BIDIRECTIONAL RTL FIX:
        LTR: pinned to right-0, padding on left (pl-10), slides from right
        RTL: pinned to left-0, padding on right (pr-10), slides from left
      */}
      <div className="fixed inset-y-0 end-0 max-w-full flex ps-10">
        <div
          className={cn(
            'w-screen flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out',
            'border-s border-[#E2E8F0]',
            ' ',
            widthClasses
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 font-mono">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#1E293B] ">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideOverDrawer;
