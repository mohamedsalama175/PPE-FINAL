import * as React from "react"
import { cn } from "../../lib/utils"

export function PageHeader({ title, subtitle, description, action, actions, onBack }: { title: string, subtitle?: string, description?: string, action?: React.ReactNode, actions?: React.ReactNode, onBack?: () => void }) {
  const displaySubtitle = subtitle || description;
  const displayAction = action || actions;
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-canvas text-body">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          {displaySubtitle && <p className="text-sm text-body mt-1">{displaySubtitle}</p>}
        </div>
      </div>
      {displayAction && <div>{displayAction}</div>}
    </div>
  )
}
