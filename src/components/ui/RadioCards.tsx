import * as React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RadioCardOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioCardsProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioCardOption[];
  columns?: 1 | 2 | 3 | 4;
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioCards({
  name: _name,
  value,
  onChange,
  options,
  columns = 2,
  label,
  required,
  withAsterisk,
  error,
  helperText,
  disabled = false,
  className,
}: RadioCardsProps) {
  const showRequiredIndicator = required || withAsterisk;

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className="w-full flex flex-col">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {label}
          {showRequiredIndicator && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={cn('grid gap-3', gridColsClass, className)}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const isOptionDisabled = disabled || opt.disabled;

          return (
            <div
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isOptionDisabled ? -1 : 0}
              onClick={() => {
                if (!isOptionDisabled) {
                  onChange(opt.value);
                }
              }}
              onKeyDown={(e) => {
                if (!isOptionDisabled && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  onChange(opt.value);
                }
              }}
              className={cn(
                'relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all duration-150 select-none cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isSelected
                  ? 'border-primary bg-primary-light/40 shadow-xs'
                  : 'border-dashed border-[#E2E8F0] bg-white hover:border-primary/40 ',
                isOptionDisabled ? 'cursor-not-allowed opacity-50' : ''
              )}
            >
              {/* Radio Indicator */}
              <div className="shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-primary " />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 " />
                )}
              </div>

              {/* Optional Icon */}
              {opt.icon && (
                <div
                  className={cn(
                    'shrink-0 p-1.5 rounded-lg',
                    isSelected
                      ? 'bg-white text-primary '
                      : 'bg-slate-100 text-slate-600 '
                  )}
                >
                  {opt.icon}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      isSelected ? 'text-primary ' : 'text-[#1E293B] '
                    )}
                  >
                    {opt.label}
                  </span>
                  {opt.badge && <div className="shrink-0">{opt.badge}</div>}
                </div>

                {opt.description && (
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#8A9AAF] mt-1.5 font-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default RadioCards;
