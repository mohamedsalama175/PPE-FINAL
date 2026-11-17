import * as React from "react"
import { cn } from "../../lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, Clock, Trash } from "lucide-react"

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  icon?: boolean;
}

const statusConfig: Record<StatusType, { color: string, icon: React.ReactNode }> = {
  success: { color: 'bg-[#DCFCE7] text-safety-green', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
  error: { color: 'bg-[#FEE2E2] text-safety-red', icon: <XCircle className="w-3 h-3 mr-1" /> },
  warning: { color: 'bg-[#FEF3C7] text-safety-amber-signal', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
  info: { color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="w-3 h-3 mr-1" /> },
  neutral: { color: 'bg-gray-100 text-gray-600', icon: <Clock className="w-3 h-3 mr-1" /> },
}

export function StatusBadge({ status, label, icon = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", config.color)}>
      {icon && config.icon}
      {label}
    </span>
  )
}
