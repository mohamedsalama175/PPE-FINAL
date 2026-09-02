import * as React from "react"
import { cn } from "../../lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn("input-base appearance-none bg-surface", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Select.displayName = "Select"
