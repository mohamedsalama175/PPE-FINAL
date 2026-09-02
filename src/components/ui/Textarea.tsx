import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      required,
      withAsterisk,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      disabled,
      rows = 4,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const showRequiredIndicator = required || withAsterisk;

    const currentLength = typeof value === 'string'
      ? value.length
      : typeof defaultValue === 'string'
      ? defaultValue.length
      : 0;

    return (
      <div className={cn('w-full flex flex-col', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
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

        <div className="relative w-full">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
            className={cn(
              'w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#1E293B]',
              'placeholder:text-[#8A9AAF] transition-all duration-150 resize-y min-h-[90px]',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:bg-[#F5F6FD] disabled:text-slate-400',
              // Dark mode surfaces
              ' ',
              ' ',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-[#E2E8F0]',
              className
            )}
            {...props}
          />
        </div>

        {/* Footer row: Error / Helper text on start, character count on end */}
        <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
          <div className="flex-1">
            {error ? (
              <p
                id={`${textareaId}-error`}
                role="alert"
                className="text-danger font-medium flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            ) : helperText ? (
              <p
                id={`${textareaId}-helper`}
                className="text-[#8A9AAF] font-normal"
              >
                {helperText}
              </p>
            ) : null}
          </div>

          {showCount && (
            <span
              className={cn(
                'font-mono text-[11px] shrink-0 text-slate-400 ',
                maxLength && currentLength >= maxLength ? 'text-danger font-semibold' : ''
              )}
            >
              {currentLength}{maxLength ? ` / ${maxLength}` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
