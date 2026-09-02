import * as React from "react"

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="py-5 border-b border-border last:border-0">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-body mt-1">{description}</p>}
        </div>
        <div className="md:w-2/3 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export function FormGroup({ label, children, htmlFor, dir, error }: { label: string, children: React.ReactNode, htmlFor?: string, dir?: 'rtl' | 'ltr', error?: string }) {
  return (
    <div className="space-y-1" dir={dir}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-body">{label}</label>
      {children}
      {error && <p className="text-xs text-safety-red mt-1">{error}</p>}
    </div>
  )
}
