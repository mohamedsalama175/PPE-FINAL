import * as React from 'react';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      required,
      withAsterisk,
      error,
      helperText,
      startIcon,
      endIcon,
      clearable = false,
      onClear,
      disabled,
      value,
      onChange,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasValue = value !== undefined && value !== null && value !== '';
    const showRequiredIndicator = required || withAsterisk;

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn('w-full flex flex-col', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
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
          {/* Leading Icon */}
          {startIcon && (
            <div className="absolute ltr:left-3 rtl:right-3 flex items-center pointer-events-none text-slate-400 z-10">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={computedType}
            disabled={disabled}
            value={value}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              'flex h-[40px] w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#1E293B]',
              'placeholder:text-[#B0BEC5] transition-all duration-150',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:bg-[#F5F6FD] disabled:text-slate-400',
              // Dark mode surfaces
              ' ',
              ' ',
              // Error state
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-[#E2E8F0]',
              // Directional icon paddings
              startIcon ? 'ltr:pl-10 rtl:pr-10' : '',
              (isPassword || clearable || endIcon) ? 'ltr:pr-10 rtl:pl-10' : '',
              className
            )}
            {...props}
          />

          {/* Trailing Controls (Clear Button, Password Toggle, End Icon) */}
          <div className="absolute ltr:right-3 rtl:left-3 flex items-center gap-1.5 z-10">
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear input"
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isPassword && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            {!isPassword && endIcon && (
              <div className="flex items-center text-slate-400 pointer-events-none">
                {endIcon}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-[#8A9AAF] mt-1.5 font-normal"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
