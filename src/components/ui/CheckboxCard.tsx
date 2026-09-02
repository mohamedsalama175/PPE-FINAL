import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CheckboxCard({
  checked,
  onChange,
  title,
  description,
  badge,
  icon,
  disabled = false,
  className,
  id,
}: CheckboxCardProps) {
  const generatedId = React.useId();
  const cardId = id || generatedId;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      id={cardId}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={cn(
        'relative flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
        checked
          ? 'border-primary bg-[#F0F2FF] shadow-xs '
          : 'border-[#E2E8F0] bg-white hover:border-slate-300 ',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className
      )}
    >
      {/* Checkbox indicator */}
      <div
        className={cn(
          'w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors',
          checked
            ? 'bg-primary text-white border-0'
            : 'border border-[#8A9AAF] bg-white '
        )}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
      </div>

      {/* Optional Leading Icon */}
      {icon && (
        <div
          className={cn(
            'shrink-0 p-1.5 rounded-lg text-primary ',
            checked ? 'bg-white/80 ' : 'bg-slate-100 '
          )}
        >
          {icon}
        </div>
      )}

      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm font-semibold truncate',
              checked ? 'text-primary ' : 'text-[#1E293B] '
            )}
          >
            {title}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {description && (
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default CheckboxCard;
