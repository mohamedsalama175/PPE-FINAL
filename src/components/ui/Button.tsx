import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none",
          {
            'bg-accent text-white hover:bg-accent/90 shadow-sm': variant === 'primary',
            'bg-surface text-ink border border-border hover:bg-canvas shadow-sm': variant === 'secondary',
            'bg-safety-red text-white hover:bg-safety-red/90 shadow-sm': variant === 'danger',
            'bg-transparent text-body hover:bg-canvas': variant === 'ghost',
            'h-8 px-3 text-xs': size === 'sm',
            'h-9 px-4 py-2 text-sm': size === 'md',
            'h-10 px-8 text-sm': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
