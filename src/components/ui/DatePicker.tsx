import * as React from 'react';
import Flatpickr from 'react-flatpickr';
import { Arabic } from 'flatpickr/dist/l10n/ar.js';
import { Calendar, Clock, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DatePickerProps {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: Date | string | Date[] | [Date, Date] | null;
  onChange?: (dates: Date[], dateStr: string) => void;
  mode?: 'single' | 'range' | 'datetime' | 'time';
  minDate?: Date | string;
  maxDate?: Date | string;
  enableTime?: boolean;
  noCalendar?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  options?: Record<string, any>;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function DatePicker({
  label,
  required,
  withAsterisk,
  error,
  helperText,
  placeholder = 'Select date...',
  value,
  onChange,
  mode = 'single',
  minDate,
  maxDate,
  enableTime = false,
  noCalendar = false,
  clearable = true,
  disabled = false,
  locale,
  options = {},
  className,
  containerClassName,
  id,
}: DatePickerProps) {
  const generatedId = React.useId();
  const pickerId = id || generatedId;
  const showRequiredIndicator = required || withAsterisk;

  const isRtl = locale === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  const selectedLocale = isRtl ? Arabic : undefined;

  const isTimeOnly = mode === 'time' || noCalendar;
  const isDateTime = mode === 'datetime' || enableTime;
  const isRange = mode === 'range';

  const flatpickrOptions = React.useMemo(() => {
    return {
      mode: (isRange ? 'range' : 'single') as 'range' | 'single',
      enableTime: isTimeOnly || isDateTime,
      noCalendar: isTimeOnly,
      dateFormat: isTimeOnly ? 'H:i' : isDateTime ? 'Y-m-d H:i' : 'Y-m-d',
      minDate: minDate,
      maxDate: maxDate,
      locale: selectedLocale,
      disableMobile: true,
      ...options,
    };
  }, [isRange, isTimeOnly, isDateTime, minDate, maxDate, selectedLocale, options]);

  const hasValue = !!value && (Array.isArray(value) ? value.length > 0 : true);

  return (
    <div className={cn('w-full flex flex-col', containerClassName)}>
      {label && (
        <label
          htmlFor={pickerId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label}
          {showRequiredIndicator && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <Flatpickr
          id={pickerId}
          value={(value as any) ?? ''}
          onChange={(dates: Date[], dateStr: string) => onChange && onChange(dates, dateStr)}
          options={flatpickrOptions}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex h-[40px] w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#1E293B]',
            'placeholder:text-[#B0BEC5] transition-all duration-150',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-[#F5F6FD] disabled:text-slate-400',
            ' ',
            ' ',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-[#E2E8F0]',
            'ltr:pr-10 rtl:pl-10',
            className
          )}
        />

        {/* Trailing Icon (Clear Button & Calendar Adornment) */}
        <div className="absolute ltr:right-3 rtl:left-3 flex items-center gap-1.5 z-10 pointer-events-none">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onChange) onChange([], '');
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 pointer-events-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isTimeOnly ? (
            <Clock className="w-4 h-4 text-slate-400 " />
          ) : (
            <Calendar className="w-4 h-4 text-slate-400 " />
          )}
        </div>
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

export default DatePicker;
