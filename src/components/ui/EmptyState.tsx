import * as React from "react"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-lg border-dashed">
      <div className="text-body mb-3 bg-canvas p-3 rounded-full">{icon}</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="text-xs text-body mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
