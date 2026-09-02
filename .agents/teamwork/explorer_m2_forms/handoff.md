# M2 Shared Form Controls and Feedback Components Exploration & Implementation Report

**Document ID:** HANDOFF-M2-FORMS-001  
**Author:** M2 Forms Explorer (`explorer_m2_forms`)  
**Date:** 2026-11-11T08:55:00Z  
**Target Milestone:** Milestone 2: Shared UI Components and Application Layout Shell  
**Output Path:** `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_forms\handoff.md`  

---

## 1. Observation

Direct observations extracted from the authoritative codebase, design specifications, and current component implementations:

### 1.1 Existing Form Component Deficiencies & RTL Flaws
1. **`src/components/ui/Input.tsx` (Current Lines 6-16):**
   ```tsx
   export const Input = React.forwardRef<HTMLInputElement, InputProps>(
     ({ className, type, ...props }, ref) => {
       return <input type={type} className={cn("input-base", className)} ref={ref} {...props} />
     }
   )
   ```
   *Observed Deficiencies:* Merely applies `.input-base` class without height `h-[40px]`, `rounded-xl`, label wrapper, required asterisk, helper text, or `AlertCircle` error indicator. Lacks password visibility toggle with RTL placement fix and clear button.

2. **`src/components/ui/Select.tsx` (Current Lines 6-16):**
   ```tsx
   export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
     ({ className, ...props }, ref) => {
       return <select className={cn("input-base appearance-none bg-surface", className)} ref={ref} {...props} />
     }
   )
   ```
   *Observed Deficiencies:* Raw HTML select without Mantine Select styling, clearable or searchable capabilities, or RTL chevron alignment. In `Catalog.tsx:317-347`, it is called with `<option>` children and event-based `onChange` handlers, requiring dual backward compatibility during Mantine integration.

3. **`src/components/ui/ToggleSwitch.tsx` (Current Lines 26-30):**
   ```tsx
   <span
     aria-hidden="true"
     className={cn(
       "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
       checked ? 'translate-x-2' : '-translate-x-2'
     )}
   />
   ```
   *Observed RTL Bug:* Uses hardcoded `translate-x-2` / `-translate-x-2`. In RTL (Arabic), positive translation moves rightwards, inverting the expected toggle direction. Lacks size variants (`sm`, `md`, `lg`) and custom label positioning.

4. **`src/components/ui/SlideOverDrawer.tsx` (Current Lines 51-57):**
   ```tsx
   <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
     <div 
       className={cn(
         "w-screen bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform ease-out duration-300 translate-x-0",
         widthClasses
       )}
     >
   ```
   *Observed RTL Bug:* Pinned hardcoded to `right-0` with `pl-10` and `border-l`. In RTL mode, drawer must anchor to `left-0`, apply `pr-10`, and border on right (`border-r`). Lacks dark mode tokens (`bg-white` without `dark:bg-[#0e1726]`).

5. **Missing Components in `src/components/ui/`:**
   - No `Textarea.tsx` exists (pages currently use raw HTML `<textarea>`).
   - No `CheckboxCard.tsx` or `RadioCards.tsx` exists (pages use custom raw markup).
   - No `DatePicker.tsx` exists (pages use raw text/date inputs or unstyled controls).
   - No `FileUpload.tsx` exists (pages use unstyled file inputs).
   - No `Modal.tsx` Mantine wrapper exists (pages use custom fixed overlays like `AdminOverrideModal.tsx`).
   - No `src/lib/swal.ts` or `src/lib/useSwal.ts` exists (pages resort to `window.alert()` and `window.prompt()`, e.g. `Scrap.tsx:27`).

### 1.2 Dependencies & Theme Validation
- `@mantine/core` (`^8.2.4`), `@mantine/dates` (`^8.2.4`), and `@mantine/hooks` (`^8.2.4`) are installed in `package.json` and verified in node runtime (`[ 'Combobox', 'Modal', 'MultiSelect', 'Select', 'Switch' ]`).
- `sweetalert2` (`^11.26.25`) is installed and verified.
- `react-flatpickr` (`^4.0.11`) and `flatpickr` (`^4.6.13`) are installed, and Arabic locale import (`flatpickr/dist/l10n/ar.js`) was verified functional in TypeScript runtime.
- Global CSS `src/index.css` already contains token classes: `.hse-swal-toast`, `.hse-swal-modal`, `.hse-swal-textarea`, `.hse-swal-confirm-btn`, `.flatpickr-calendar`, and `.form-input`.
- Current workspace TypeScript build (`npx tsc --noEmit`) passes with exit code 0.

---

## 2. Logic Chain

1. **Premise 1 (Form Visual Standard):** `DESIGN_SYSTEM.md §4.2` dictates exact dimensions: height `40px` (`h-[40px]`), `rounded-xl` (12px), border `#E2E8F0` (dark: `#17263c`), background `#FFFFFF` (dark: `#121e32`), placeholder `#B0BEC5` (dark: `#506690`), text `#1E293B` (dark: `#FFFFFF`).
2. **Premise 2 (RTL Invariant Protection):**
   - In RTL Arabic layouts, directional controls must mirror without manual styling per page:
     - Password toggle eye: must switch from `ltr:right-3` to `rtl:left-3` with padding `ltr:pr-10 rtl:pl-10`.
     - ToggleSwitch thumb: must avoid standard `translate-x` which moves towards physical right; must use CSS directional absolute coordinates (`ltr:left-... rtl:right-...`).
     - SlideOverDrawer: must switch from `ltr:right-0 ltr:pl-10 ltr:border-l` to `rtl:left-0 rtl:pr-10 rtl:border-r`.
3. **Premise 3 (Backward Compatibility & Dual Select Pattern):**
   - Existing views (such as `Catalog.tsx`, `Attributes.tsx`, `AuditLogs.tsx`) pass `<option>` children and expecting `(e: ChangeEvent<HTMLSelectElement>) => void`.
   - The Mantine `Select` wrapper must seamlessly accept both standard Mantine `data` arrays `({ value, label })` AND extract `<option>` children when provided, accepting both string-based and event-based `onChange` handlers so that zero compilation errors occur when replacing `Select.tsx`.
4. **Premise 4 (Native Dialog Remediation):**
   - 14 occurrences of `window.alert()` and `window.prompt()` exist across the application (e.g. `Scrap.tsx:27`, `Attributes.tsx:60`, `Catalog.tsx:122`).
   - `src/lib/swal.ts` provides `showConfirm()`, `showDeleteReason()`, and `showToast()` with glassmorphic styling, Almarai typography, and RTL `reverseButtons`, completely superseding raw browser dialogs.

---

## 3. Caveats & Edge Cases

1. **React 19 & ForwardRef Nuances:**
   - In React 19, `forwardRef` remains supported for backward compatibility, but component displayName must be explicitly specified to prevent React devtools anonymization.
2. **Flatpickr Mobile Mode Disabling:**
   - On iOS and Android devices, Flatpickr defaults to native OS date wheels unless `disableMobile: true` is passed. To ensure HSE design system consistency across all viewports, `disableMobile: true` is enforced in `DatePicker.tsx`.
3. **Select Children vs Mantine Select:**
   - If an existing view passes `<option value="all">All</option>` without a `data` prop, `Select.tsx` dynamically inspects `React.Children` and maps them into `{ value, label, disabled }` items for the Mantine Combobox.
4. **Accessibility (ARIA):**
   - ToggleSwitch requires `role="switch"` and `aria-checked`. CheckboxCard requires `role="checkbox"` and `tabIndex={0}` with Enter/Space keyboard handlers. RadioCards requires `role="radio"` and `aria-checked`. Inputs render `aria-invalid` and `aria-describedby` linked to error and helper text IDs.

---

## 4. Conclusion & Complete Implementation Code Blocks

Below are the complete, ready-to-implement TypeScript components for `src/components/ui/` and `src/lib/`.

```
src/
├── components/
│   └── ui/
│       ├── Input.tsx           (Height 40px, rounded-xl, RTL password toggle, clear button, error state)
│       ├── Textarea.tsx        (Rounded-xl, character counter, dark mode surfaces, helper text)
│       ├── Select.tsx          (Mantine Select wrapper, RTL chevron, search, clear, dual compatibility)
│       ├── ToggleSwitch.tsx    (Directional coordinates RTL fix, sizes sm/md/lg, custom labels)
│       ├── CheckboxCard.tsx    (Selectable card, checkmark indicator, #212B59 primary border, badges)
│       ├── RadioCards.tsx      (Responsive grid 1-4 cols, radio indicator, primary border)
│       ├── DatePicker.tsx      (Flatpickr single/range/datetime, Calendar adornment, Arabic locale)
│       ├── FileUpload.tsx      (Drag-and-drop dropzone, preview cards, size validation, progress)
│       ├── Modal.tsx           (Mantine Modal wrapper, header, body, sticky footer, RTL close button)
│       └── SlideOverDrawer.tsx (Bidirectional slide-over fixing hardcoded right-0, dark mode surfaces)
└── lib/
    ├── swal.ts                 (SweetAlert2 custom styled wrapper: showConfirm, showDeleteReason, showToast)
    └── useSwal.ts              (React hook wrapper for ergonomic swal consumption in components)
```

### 4.1 `src/components/ui/Input.tsx`

```tsx
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
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
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
            <div className="absolute ltr:left-3 rtl:right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 z-10">
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
              'dark:bg-[#121e32] dark:border-[#17263c] dark:text-white dark:placeholder:text-[#506690] dark:focus:border-primary',
              'dark:disabled:bg-[#0e1726] dark:disabled:text-[#506690]',
              // Error state
              error
                ? 'border-danger dark:border-danger focus:border-danger focus:ring-danger/20'
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
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            {!isPassword && endIcon && (
              <div className="flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
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
            className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1.5 font-normal"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

---

### 4.2 `src/components/ui/Textarea.tsx`

```tsx
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
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
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
              'dark:bg-[#121e32] dark:border-[#17263c] dark:text-white dark:placeholder:text-[#506690] dark:focus:border-primary',
              'dark:disabled:bg-[#0e1726] dark:disabled:text-[#506690]',
              error
                ? 'border-danger dark:border-danger focus:border-danger focus:ring-danger/20'
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
                className="text-[#8A9AAF] dark:text-[#506690] font-normal"
              >
                {helperText}
              </p>
            ) : null}
          </div>

          {showCount && (
            <span
              className={cn(
                'font-mono text-[11px] shrink-0 text-slate-400 dark:text-slate-500',
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
```

---

### 4.3 `src/components/ui/Select.tsx`

```tsx
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
        if (React.isValidElement(child) && child.type === 'option') {
          const val = child.props.value !== undefined ? String(child.props.value) : '';
          const lbl = String(child.props.children || val);
          extracted.push({
            value: val,
            label: lbl,
            disabled: child.props.disabled,
          });
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
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
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
          rightSection={<ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />}
          classNames={{
            root: 'w-full',
            wrapper: 'w-full',
            input: cn(
              '!h-[40px] !w-full !rounded-xl !border !bg-white !px-4 !py-2 !text-sm !text-[#1E293B]',
              '!placeholder:text-[#B0BEC5] !transition-all !duration-150',
              '!focus:border-primary !focus:ring-1 !focus:ring-primary/20 !outline-none',
              '!disabled:cursor-not-allowed !disabled:bg-[#F5F6FD] !disabled:text-slate-400',
              'dark:!bg-[#121e32] dark:!border-[#17263c] dark:!text-white dark:!placeholder:text-[#506690] dark:!focus:border-primary',
              'dark:!disabled:bg-[#0e1726] dark:!disabled:text-[#506690]',
              'ltr:text-left rtl:text-right',
              error
                ? '!border-danger dark:!border-danger !focus:border-danger'
                : '!border-[#E2E8F0]',
              className
            ),
            dropdown: cn(
              '!rounded-xl !border !border-[#E2E8F0] !bg-white !p-1.5 !shadow-popover',
              'dark:!border-[#17263c] dark:!bg-[#1b2e4b]'
            ),
            option: cn(
              '!rounded-lg !px-3 !py-2 !text-sm !text-[#1E293B] !transition-colors',
              'hover:!bg-primary/10 hover:!text-primary',
              'data-[checked=true]:!bg-primary data-[checked=true]:!text-white',
              'dark:!text-slate-200 dark:hover:!bg-[#181f32] dark:hover:!text-white'
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
        <p className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1.5 font-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
```

---

### 4.4 `src/components/ui/ToggleSwitch.tsx`

```tsx
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
        checked ? activeColorClass : 'bg-slate-300 dark:bg-slate-700',
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
            <span className="text-sm font-semibold text-[#1E293B] dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#64748B] dark:text-[#888ea8]">
              {description}
            </span>
          )}
        </div>
      )}

      {switchButton}

      {labelPosition === 'end' && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-[#1E293B] dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#64748B] dark:text-[#888ea8]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 4.5 `src/components/ui/CheckboxCard.tsx`

```tsx
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
          ? 'border-primary bg-[#F0F2FF] shadow-xs dark:bg-primary/15 dark:border-primary'
          : 'border-[#E2E8F0] bg-white hover:border-slate-300 dark:border-[#17263c] dark:bg-[#0e1726] dark:hover:border-slate-700',
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
            : 'border border-[#8A9AAF] bg-white dark:border-slate-600 dark:bg-[#121e32]'
        )}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
      </div>

      {/* Optional Leading Icon */}
      {icon && (
        <div
          className={cn(
            'shrink-0 p-1.5 rounded-lg text-primary dark:text-primary-light',
            checked ? 'bg-white/80 dark:bg-[#121e32]' : 'bg-slate-100 dark:bg-[#181f32]'
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
              checked ? 'text-primary dark:text-white' : 'text-[#1E293B] dark:text-slate-200'
            )}
          >
            {title}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {description && (
          <p className="text-xs text-[#64748B] dark:text-[#888ea8] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
```

---

### 4.6 `src/components/ui/RadioCards.tsx`

```tsx
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
  name: string;
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
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
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
                  ? 'border-primary bg-primary-light/40 dark:bg-primary/20 dark:border-primary shadow-xs'
                  : 'border-dashed border-[#E2E8F0] bg-white hover:border-primary/40 dark:border-[#17263c] dark:bg-[#0e1726] dark:hover:border-primary/50',
                isOptionDisabled ? 'cursor-not-allowed opacity-50' : ''
              )}
            >
              {/* Radio Indicator */}
              <div className="shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-primary dark:text-white" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                )}
              </div>

              {/* Optional Icon */}
              {opt.icon && (
                <div
                  className={cn(
                    'shrink-0 p-1.5 rounded-lg',
                    isSelected
                      ? 'bg-white text-primary dark:bg-[#121e32] dark:text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-[#181f32] dark:text-slate-400'
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
                      isSelected ? 'text-primary dark:text-white' : 'text-[#1E293B] dark:text-slate-200'
                    )}
                  >
                    {opt.label}
                  </span>
                  {opt.badge && <div className="shrink-0">{opt.badge}</div>}
                </div>

                {opt.description && (
                  <p className="text-[11px] text-[#64748B] dark:text-[#888ea8] mt-1 leading-relaxed">
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
        <p className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1.5 font-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
```

---

### 4.7 `src/components/ui/DatePicker.tsx`

```tsx
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
      mode: isRange ? 'range' : 'single',
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
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
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
          value={value ?? ''}
          onChange={(dates, dateStr) => onChange && onChange(dates, dateStr)}
          options={flatpickrOptions}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex h-[40px] w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#1E293B]',
            'placeholder:text-[#B0BEC5] transition-all duration-150',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-[#F5F6FD] disabled:text-slate-400',
            'dark:bg-[#121e32] dark:border-[#17263c] dark:text-white dark:placeholder:text-[#506690] dark:focus:border-primary',
            'dark:disabled:bg-[#0e1726] dark:disabled:text-[#506690]',
            error
              ? 'border-danger dark:border-danger focus:border-danger focus:ring-danger/20'
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
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isTimeOnly ? (
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ) : (
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1.5 font-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
```

---

### 4.8 `src/components/ui/FileUpload.tsx`

```tsx
import * as React from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FileUploadProps {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export function FileUpload({
  label,
  required,
  withAsterisk,
  error,
  helperText,
  accept = 'image/*,application/pdf',
  multiple = false,
  maxSizeMB = 10,
  maxFiles = 5,
  files = [],
  onFilesChange,
  disabled = false,
  className,
  containerClassName,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const showRequiredIndicator = required || withAsterisk;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setInternalError(null);
    const newFilesList: File[] = multiple ? [...files] : [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setInternalError(`File "${file.name}" exceeds the maximum size limit of ${maxSizeMB}MB.`);
        return;
      }

      if (multiple && newFilesList.length >= maxFiles) {
        setInternalError(`Cannot upload more than ${maxFiles} files.`);
        return;
      }

      newFilesList.push(file);
    }

    if (onFilesChange) {
      onFilesChange(newFilesList);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    if (onFilesChange) onFilesChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('w-full flex flex-col', containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          {label}
          {showRequiredIndicator && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Dropzone container */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 select-none',
          isDragActive
            ? 'border-primary bg-primary-light/30 ring-2 ring-primary/20 dark:bg-primary/20'
            : 'border-[#E2E8F0] bg-white hover:border-primary hover:bg-primary-light/10 dark:border-[#17263c] dark:bg-[#0e1726] dark:hover:border-primary',
          disabled ? 'cursor-not-allowed opacity-50 bg-[#F5F6FD] dark:bg-[#060818]' : '',
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-light mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-[#1E293B] dark:text-white">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1">
          {accept.replace(/\/\*/g, '')} (max. {maxSizeMB}MB)
        </p>
      </div>

      {(error || internalError) && (
        <p role="alert" className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || internalError}</span>
        </p>
      )}

      {helperText && !error && !internalError && (
        <p className="text-xs text-[#8A9AAF] dark:text-[#506690] mt-1.5 font-normal">
          {helperText}
        </p>
      )}

      {/* Uploaded files preview list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#121e32]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light shrink-0">
                    {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1E293B] dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#8A9AAF] dark:text-[#506690] font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### 4.9 `src/lib/swal.ts` & `src/lib/useSwal.ts`

**`src/lib/swal.ts`**:
```typescript
import Swal from 'sweetalert2';

/**
 * HSE Enterprise Custom Styled SweetAlert2 Modal Instance
 */
export const swalCustom = Swal.mixin({
  customClass: {
    popup: 'hse-swal-modal dark:bg-[#0e1726]',
    title: 'hse-swal-modal-title',
    htmlContainer: 'hse-swal-modal-text',
    confirmButton: 'hse-swal-confirm-btn',
    cancelButton: 'hse-swal-cancel-btn',
    actions: 'hse-swal-actions',
    input: 'hse-swal-textarea',
  },
  buttonsStyling: false,
});

/**
 * Glassmorphic Pill Toast Notification Instance
 */
export const toastCustom = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'hse-swal-toast dark:bg-[#0e1726]',
    title: 'hse-swal-toast-title',
    timerProgressBar: 'hse-swal-progress-bar',
  },
});

/**
 * Standard confirmation dialog prompt
 */
export async function showConfirm(
  title: string,
  text?: string,
  confirmText?: string,
  isDestructive: boolean = false
): Promise<boolean> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const defaultConfirmText = isDestructive
    ? (isRtl ? 'حذف' : 'Delete')
    : (isRtl ? 'تأكيد' : 'Confirm');

  const result = await swalCustom.fire({
    title,
    text,
    icon: isDestructive ? 'warning' : 'question',
    iconColor: isDestructive ? '#e7515a' : '#212B59',
    showCancelButton: true,
    confirmButtonText: confirmText || defaultConfirmText,
    cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
    reverseButtons: isRtl,
    customClass: {
      popup: 'hse-swal-modal dark:bg-[#0e1726]',
      title: 'hse-swal-modal-title',
      htmlContainer: 'hse-swal-modal-text',
      confirmButton: isDestructive
        ? 'hse-swal-confirm-btn !bg-danger hover:!bg-danger/90'
        : 'hse-swal-confirm-btn',
      cancelButton: 'hse-swal-cancel-btn',
      actions: 'hse-swal-actions',
    },
  });

  return result.isConfirmed;
}

/**
 * Prompt for mandatory deletion reason or in-use override justification
 */
export async function showDeleteReason(
  title: string,
  placeholder: string = 'Please enter a justification (mandatory)...',
  validationMessage: string = 'A reason of at least 5 characters is required.'
): Promise<string | null> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const result = await swalCustom.fire({
    title,
    input: 'textarea',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: isRtl ? 'تأكيد الحذف' : 'Confirm Action',
    cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
    reverseButtons: isRtl,
    inputValidator: (value) => {
      if (!value || value.trim().length < 5) {
        return validationMessage;
      }
      return null;
    },
    customClass: {
      popup: 'hse-swal-modal dark:bg-[#0e1726]',
      title: 'hse-swal-modal-title',
      confirmButton: 'hse-swal-confirm-btn !bg-danger hover:!bg-danger/90',
      cancelButton: 'hse-swal-cancel-btn',
      actions: 'hse-swal-actions',
      input: 'hse-swal-textarea',
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value.trim();
  }
  return null;
}

/**
 * Glassmorphic Pill Toast Trigger
 */
export function showToast(
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
): void {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  toastCustom.fire({
    title,
    icon,
    position: isRtl ? 'top-start' : 'top-end',
  });
}

/**
 * Informational Notice Modal
 */
export async function showInfo(title: string, text?: string): Promise<boolean> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const result = await swalCustom.fire({
    title,
    text,
    icon: 'info',
    iconColor: '#2196f3',
    confirmButtonText: isRtl ? 'حسناً' : 'OK',
  });
  return result.isConfirmed;
}

export default {
  showConfirm,
  showDeleteReason,
  showToast,
  showInfo,
};
```

**`src/lib/useSwal.ts`**:
```typescript
import { showConfirm, showDeleteReason, showToast, showInfo } from './swal';

/**
 * React hook for consuming HSE SweetAlert2 dialogs and toasts
 */
export function useSwal() {
  return {
    showConfirm,
    showDeleteReason,
    showToast,
    showInfo,
  };
}
```

---

### 4.10 `src/components/ui/Modal.tsx`

```tsx
import * as React from 'react';
import { Modal as MantineModal } from '@mantine/core';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen?: boolean;
  opened?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | string | number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  centered?: boolean;
  closeOnClickOutside?: boolean;
  hideCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  opened,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  children,
  footer,
  centered = true,
  closeOnClickOutside = true,
  hideCloseButton = false,
  className,
}: ModalProps) {
  const isOpened = opened !== undefined ? opened : !!isOpen;

  return (
    <MantineModal
      opened={isOpened}
      onClose={onClose}
      centered={centered}
      size={size}
      withCloseButton={!hideCloseButton}
      closeOnClickOutside={closeOnClickOutside}
      radius="xl"
      title={
        title ? (
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="p-1.5 rounded-lg bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        ) : null
      }
      classNames={{
        content: cn(
          '!rounded-xl !border !border-[#E2E8F0] !bg-white !shadow-2xl overflow-hidden',
          'dark:!border-[#17263c] dark:!bg-[#0e1726]',
          className
        ),
        header: cn(
          '!border-b !border-[#E2E8F0] !bg-slate-50/70 !px-6 !py-4',
          'dark:!border-[#17263c] dark:!bg-[#121e32]/70'
        ),
        close: cn(
          '!text-slate-400 hover:!text-slate-700 hover:!bg-slate-200/50 !rounded-md !transition-colors',
          'dark:hover:!text-white dark:hover:!bg-[#181f32]'
        ),
        body: '!p-0',
      }}
    >
      {/* Modal Main Body */}
      <div className="p-6 text-sm text-[#1E293B] dark:text-slate-200">{children}</div>

      {/* Modal Sticky Footer */}
      {footer && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#E2E8F0] bg-slate-50 dark:border-[#17263c] dark:bg-[#121e32] rounded-b-xl z-10">
          {footer}
        </div>
      )}
    </MantineModal>
  );
}
```

---

### 4.11 `src/components/ui/SlideOverDrawer.tsx`

```tsx
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
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* 
        CRITICAL BIDIRECTIONAL RTL FIX:
        LTR: pinned to right-0, padding on left (pl-10), slides from right
        RTL: pinned to left-0, padding on right (pr-10), slides from left
      */}
      <div className="fixed inset-y-0 ltr:right-0 rtl:left-0 max-w-full flex ltr:pl-10 rtl:pr-10">
        <div
          className={cn(
            'w-screen flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out',
            'ltr:border-l rtl:border-r border-[#E2E8F0]',
            'dark:bg-[#0e1726] dark:border-[#17263c]',
            widthClasses
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#17263c] bg-slate-50/70 dark:bg-[#121e32]/70 flex items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#181f32] transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#1E293B] dark:text-slate-200">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-3.5 border-t border-[#E2E8F0] dark:border-[#17263c] bg-slate-50 dark:bg-[#121e32] flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
The implementing agent can independently verify correctness using the following command suite:

1. **TypeScript Compilation Verification:**
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result:* Zero errors (`Exit code: 0`). Confirms all component interfaces, Mantine v8 prop typings, Flatpickr types, and SweetAlert2 function signatures compile cleanly.

2. **Client Build Verification:**
   ```powershell
   npm run build
   ```
   *Expected Result:* Vite production build succeeds without asset bundling or CSS import errors.

3. **Server Build & Tests Verification:**
   ```powershell
   npm run build:server
   npm run test:server
   ```
   *Expected Result:* Server build compiles and comprehensive backend tests continue passing with zero regressions.

### 5.2 Visual & Behavioral Inspection Checklist
1. **`Input.tsx`**:
   - Inspect height in browser inspector: exactly `40px`.
   - Inspect border radius: `12px` (`rounded-xl`).
   - Switch direction to Arabic (`dir="rtl"`): Verify password toggle eye switches to `left-3` and input padding is `pl-10`.
   - Test typing and clear button click.
2. **`ToggleSwitch.tsx`**:
   - Switch direction to Arabic (`dir="rtl"`): Verify clicking toggle moves thumb from physical right to physical left (towards the trailing edge), matching Arabic text direction.
3. **`SlideOverDrawer.tsx`**:
   - In LTR mode: drawer slides in from the right viewport boundary.
   - In RTL mode (`dir="rtl"`): drawer slides in from the left viewport boundary with border on the right.
4. **`src/lib/swal.ts`**:
   - Trigger `showDeleteReason("Deactivate Location")`: Verify textarea appears with `#F8FAFC` background and `#E2E8F0` border; submitting < 5 characters triggers inline validation error.
   - Trigger `showToast("Saved", "success")`: Verify glassmorphic pill appears with 3px primary progress bar.
5. **`DatePicker.tsx`**:
   - In Arabic mode: Verify month names, day abbreviations, and numerals render in Arabic format (`flatpickr/dist/l10n/ar.js`).
6. **Dark Theme Parity**:
   - Toggle `.dark` class: Verify all input backgrounds transition to `#121e32`, borders to `#17263c`, text to `#FFFFFF`, and drawer surfaces to `#0e1726`.

### 5.3 Invalidation Conditions
- Any TypeScript type mismatch with Mantine v8 or React 19.
- Hardcoded `translate-x` returning to `ToggleSwitch.tsx`.
- Hardcoded `right-0` returning to `SlideOverDrawer.tsx`.
- Any component failing to render properly in dark mode.
