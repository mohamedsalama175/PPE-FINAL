import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'success' | 'primary' | 'secondary';
  labelPosition?: 'start' | 'end';
  className?: string;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  color = 'success',
  labelPosition = 'end',
  className,
  id,
}: ToggleSwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  // Sizing definitions with absolute directional coordinates
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      thumbUnchecked: 'ltr:left-0.5 rtl:right-0.5',
      thumbChecked: 'ltr:left-[18px] rtl:right-[18px]',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      thumbUnchecked: 'ltr:left-0.5 rtl:right-0.5',
      thumbChecked: 'ltr:left-[22px] rtl:right-[22px]',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      thumbUnchecked: 'ltr:left-0.5 rtl:right-0.5',
      thumbChecked: 'ltr:left-[30px] rtl:right-[30px]',
    },
  }[size];

  const activeColorClass = {
    success: 'bg-success',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
  }[color];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const switchButton = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizeConfig.track,
        checked ? activeColorClass : 'bg-slate-300 ',
        className
      )}
    >
      <span className="sr-only">{typeof label === 'string' ? label : 'Toggle switch'}</span>
      {/* 
        CRITICAL RTL TRANSLATION FIX:
        Uses absolute directional positioning (ltr:left-... rtl:right-...)
        to guarantee the thumb always travels in the correct direction across languages.
      */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-0.5 rounded-full bg-white shadow-sm ring-0 transition-all duration-200 ease-in-out',
          sizeConfig.thumb,
          checked ? sizeConfig.thumbChecked : sizeConfig.thumbUnchecked
        )}
      />
    </button>
  );

  if (!label && !description) {
    return switchButton;
  }

  return (
    <div
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled ? 'cursor-not-allowed opacity-50' : ''
      )}
    >
      {labelPosition === 'start' && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-[#1E293B] ">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#64748B] ">
              {description}
            </span>
          )}
        </div>
      )}

      {switchButton}

      {labelPosition === 'end' && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-[#1E293B] ">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#64748B] ">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ToggleSwitch;
