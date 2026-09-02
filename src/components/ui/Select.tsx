import * as React from 'react';
import { Select as MantineSelect, ComboboxItem } from '@mantine/core';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  data?: (string | SelectOption)[];
  options?: (string | SelectOption)[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: ((value: string | null) => void) | ((e: React.ChangeEvent<HTMLSelectElement>) => void);
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  id?: string;
  name?: string;
  children?: React.ReactNode;
}

export function Select({
  label,
  required,
  withAsterisk,
  error,
  helperText,
  placeholder = 'Select an option',
  data,
  options,
  value,
  defaultValue,
  onChange,
  searchable = false,
  clearable = false,
  disabled = false,
  className,
  containerClassName,
  id,
  name,
  children,
  ...rest
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const showRequiredIndicator = required || withAsterisk;

  // Extract items if passed as options or data
  const rawData = data || options;

  // Dual compatibility: inspect <option> children if data is omitted
  const parsedData = React.useMemo(() => {
    if (rawData) {
      return rawData.map((item) =>
        typeof item === 'string' ? { value: item, label: item } : item
      );
    }
    if (children) {
      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any;
          if (child.type === 'option' || (childProps && childProps.value !== undefined)) {
            const val = childProps.value !== undefined ? String(childProps.value) : '';
            const lbl = String(childProps.children || val);
            extracted.push({
              value: val,
              label: lbl,
              disabled: childProps.disabled,
            });
          }
        }
      });
      return extracted;
    }
    return [];
  }, [rawData, children]);

  // Handle onChange normalization (supports both (val: string | null) and (e: ChangeEvent))
  const handleChange = (val: string | null, _option?: ComboboxItem) => {
    if (!onChange) return;
    try {
      (onChange as (val: string | null) => void)(val);
    } catch {
      const syntheticEvent = {
        target: { value: val || '', name: name || '' },
        currentTarget: { value: val || '', name: name || '' },
      } as React.ChangeEvent<HTMLSelectElement>;
      (onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void)(syntheticEvent);
    }
  };

  return (
    <div className={cn('w-full flex flex-col', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
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
        <MantineSelect
          id={selectId}
          name={name}
          data={parsedData}
          value={value ?? undefined}
          defaultValue={defaultValue ?? undefined}
          onChange={(val, opt) => handleChange(val, opt)}
          placeholder={placeholder}
          searchable={searchable}
          clearable={clearable}
          disabled={disabled}
          rightSection={<ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />}
          classNames={{
            root: 'w-full',
            wrapper: 'w-full',
            input: cn(
              '!h-[40px] !w-full !rounded-xl !border !bg-white !px-4 !py-2 !text-sm !text-[#1E293B]',
              '!placeholder:text-[#B0BEC5] !transition-all !duration-150',
              '!focus:border-primary !focus:ring-1 !focus:ring-primary/20 !outline-none',
              '!disabled:cursor-not-allowed !disabled:bg-[#F5F6FD] !disabled:text-slate-400',
              ' ',
              ' ',
              'ltr:text-left rtl:text-right',
              error
                ? '!border-danger !focus:border-danger'
                : '!border-[#E2E8F0]',
              className
            ),
            dropdown: cn(
              '!rounded-xl !border !border-[#E2E8F0] !bg-white !p-1.5 !shadow-popover',
              ' '
            ),
            option: cn(
              '!rounded-lg !px-3 !py-2 !text-sm !text-[#1E293B] !transition-colors',
              'hover:!bg-primary/10 hover:!text-primary',
              'data-[checked=true]:!bg-primary data-[checked=true]:!text-white',
              ' '
            ),
          }}
          {...rest}
        />
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

export default Select;
