import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KpiTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export type KpiColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subvalue?: string;
  icon: React.ReactNode;
  color?: KpiColor;
  trend?: KpiTrend;
  chart?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subvalue,
  icon,
  color = 'primary',
  trend,
  chart,
  badge,
  loading = false,
  onClick,
  className,
}) => {
  const iconBgClasses: Record<KpiColor, string> = {
    primary: "bg-primary-light text-primary ",
    secondary: "bg-secondary-light text-secondary ",
    success: "bg-success-light text-success ",
    danger: "bg-danger-light text-danger ",
    warning: "bg-warning-light text-warning ",
    info: "bg-info-light text-info ",
  };

  if (loading) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm animate-pulse", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-black text-[#1E293B] tracking-tight mt-1.5 truncate">
            {value}
          </h3>
        </div>

        {/* 48x48px Icon Badge */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105",
            iconBgClasses[color]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Sub-row with Trend or Subvalue or Badge */}
      {(trend || subvalue || badge) && (
        <div className="mt-3.5 flex items-center flex-wrap gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[11px]",
                trend.isPositive !== false
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 "
                  : "bg-red-50 text-red-700 border border-red-200 "
              )}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="w-3.5 h-3.5 ltr:mr-0.5 rtl:ml-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 ltr:mr-0.5 rtl:ml-0.5" />
              )}
              {typeof trend.value === 'number' && trend.value > 0 ? `+${trend.value}%` : `${trend.value}`}
            </span>
          )}

          {subvalue && (
            <span className="text-[#64748B] font-medium">
              {subvalue}
            </span>
          )}

          {badge && <div className="ltr:ml-auto rtl:mr-auto">{badge}</div>}
        </div>
      )}

      {/* Sparkline / Chart Slot */}
      {chart && <div className="mt-4">{chart}</div>}
    </div>
  );
};

export default KpiCard;
