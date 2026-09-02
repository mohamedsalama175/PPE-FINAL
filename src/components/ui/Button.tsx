import * as React from "react";
import { Loader2 } from "lucide-react";
import Tippy from "@tippyjs/react";
import { cn } from "../../lib/utils";

export type ButtonVariant = 
  | 'solid' 
  | 'outline' 
  | 'text' 
  | 'icon' 
  // Backward compatibility legacy variants
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'ghost' 
  | 'destructive';

export type ButtonColor = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'dark' 
  | 'white';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      color,
      size = 'md',
      loading = false,
      loadingText,
      icon,
      iconPosition = 'start',
      tooltip,
      tooltipPlacement = 'top',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // 1. Resolve variant and color with backward compatibility
    let resolvedVariant: 'solid' | 'outline' | 'text' | 'icon' = 'solid';
    let resolvedColor: ButtonColor = color || 'primary';

    if (variant === 'primary') {
      resolvedVariant = 'solid';
      resolvedColor = color || 'primary';
    } else if (variant === 'secondary') {
      resolvedVariant = 'outline';
      resolvedColor = color || 'secondary';
    } else if (variant === 'danger' || variant === 'destructive') {
      resolvedVariant = 'solid';
      resolvedColor = color || 'danger';
    } else if (variant === 'ghost') {
      resolvedVariant = 'text';
      resolvedColor = color || 'dark';
    } else {
      resolvedVariant = variant as 'solid' | 'outline' | 'text' | 'icon';
      resolvedColor = color || (resolvedVariant === 'icon' ? 'dark' : 'primary');
    }

    // 2. Base Styles
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100";

    // 3. Sizing Styles
    const sizeClasses: Record<ButtonSize, string> = {
      sm: resolvedVariant === 'icon' ? "h-8 w-8 text-xs p-0 shrink-0" : "h-8 px-3 text-xs gap-1.5",
      md: resolvedVariant === 'icon' ? "h-10 w-10 text-sm p-0 shrink-0" : "h-10 px-4 text-sm gap-2",
      lg: resolvedVariant === 'icon' ? "h-12 w-12 text-base p-0 shrink-0" : "h-12 px-6 text-base gap-2.5",
    };

    // 4. Variant & Color Matrix
    const colorStyles: Record<'solid' | 'outline' | 'text' | 'icon', Record<ButtonColor, string>> = {
      solid: {
        primary: "bg-primary text-white hover:bg-[#1a2247] shadow-sm focus-visible:ring-primary/40",
        secondary: "bg-secondary text-white hover:bg-[#6f4eb5] shadow-sm focus-visible:ring-secondary/40",
        danger: "bg-danger text-white hover:bg-[#d63d46] shadow-sm focus-visible:ring-danger/40",
        success: "bg-success text-white hover:bg-[#00964b] shadow-sm focus-visible:ring-success/40",
        warning: "bg-warning text-white hover:bg-[#cf8f30] shadow-sm focus-visible:ring-warning/40",
        info: "bg-info text-white hover:bg-[#1984d8] shadow-sm focus-visible:ring-info/40",
        dark: "bg-dark text-white hover:bg-[#2c3049] shadow-sm focus-visible:ring-dark/40 ",
        white: "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50 shadow-sm focus-visible:ring-slate-300 ",
      },
      outline: {
        primary: "border border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary/40",
        secondary: "border border-secondary text-secondary hover:bg-secondary hover:text-white focus-visible:ring-secondary/40",
        danger: "border border-danger text-danger hover:bg-danger hover:text-white focus-visible:ring-danger/40",
        success: "border border-success text-success hover:bg-success hover:text-white focus-visible:ring-success/40",
        warning: "border border-warning text-warning hover:bg-warning hover:text-white focus-visible:ring-warning/40",
        info: "border border-info text-info hover:bg-info hover:text-white focus-visible:ring-info/40",
        dark: "border border-dark text-dark hover:bg-dark hover:text-white focus-visible:ring-dark/40",
        white: "border border-white/60 text-white hover:bg-white hover:text-[#1E293B] focus-visible:ring-white/40",
      },
      text: {
        primary: "bg-transparent text-primary hover:bg-primary-light/50 focus-visible:ring-primary/40",
        secondary: "bg-transparent text-secondary hover:bg-secondary-light/50 focus-visible:ring-secondary/40",
        danger: "bg-transparent text-danger hover:bg-danger-light/50 focus-visible:ring-danger/40",
        success: "bg-transparent text-success hover:bg-success-light/50 focus-visible:ring-success/40",
        warning: "bg-transparent text-warning hover:bg-warning-light/50 focus-visible:ring-warning/40",
        info: "bg-transparent text-info hover:bg-info-light/50 focus-visible:ring-info/40",
        dark: "bg-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 focus-visible:ring-slate-300",
        white: "bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/40",
      },
      icon: {
        primary: "bg-transparent text-primary hover:bg-primary-light/60 ",
        secondary: "bg-transparent text-secondary hover:bg-secondary-light/60 ",
        danger: "bg-transparent text-danger hover:bg-danger-light/60 ",
        success: "bg-transparent text-success hover:bg-success-light/60 ",
        warning: "bg-transparent text-warning hover:bg-warning-light/60 ",
        info: "bg-transparent text-info hover:bg-info-light/60 ",
        dark: "bg-transparent text-[#64748B] hover:text-primary hover:bg-[#F5F6FD] ",
        white: "bg-transparent text-white hover:bg-white/10",
      },
    };

    const spinnerSize = size === 'sm' ? "w-3.5 h-3.5" : size === 'lg' ? "w-5 h-5" : "w-4 h-4";

    const content = (
      <>
        {loading ? (
          <Loader2 className={cn("animate-spin shrink-0", spinnerSize, (children || loadingText) ? "ltr:mr-2 rtl:ml-2" : "")} />
        ) : (
          icon && iconPosition === 'start' && (
            <span className={cn("inline-flex items-center shrink-0", children ? "ltr:mr-2 rtl:ml-2" : "")}>
              {icon}
            </span>
          )
        )}
        {loading && loadingText ? loadingText : children}
        {!loading && icon && iconPosition === 'end' && (
          <span className={cn("inline-flex items-center shrink-0", children ? "ltr:ml-2 rtl:mr-2" : "")}>
            {icon}
          </span>
        )}
      </>
    );

    const buttonNode = (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          sizeClasses[size],
          colorStyles[resolvedVariant][resolvedColor],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {content}
      </button>
    );

    if (tooltip) {
      return (
        <Tippy content={tooltip} placement={tooltipPlacement}>
          {buttonNode}
        </Tippy>
      );
    }

    return buttonNode;
  }
);

Button.displayName = "Button";
export default Button;
