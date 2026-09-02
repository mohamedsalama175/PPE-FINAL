import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white shadow-sm",
        compact ? "p-6" : "p-8 md:p-12",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm shrink-0">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-[#1E293B] leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex items-center justify-center gap-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
