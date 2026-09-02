import * as React from "react";
import { cn } from "../../lib/utils";

export interface ContainerCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  subTitle?: React.ReactNode; // Backward compatibility alias
  btnCorner?: React.ReactNode; // Backward compatibility alias
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  title,
  subtitle,
  subTitle,
  btnCorner,
  actions,
  icon,
  badge,
  footer,
  noPadding = false,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  children,
}) => {
  const resolvedSubtitle = subtitle || subTitle;
  const resolvedActions = actions || btnCorner;
  const hasHeader = title || resolvedSubtitle || resolvedActions || icon || badge;

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-colors duration-200 overflow-hidden",
        className
      )}
    >
      {/* Card Header */}
      {hasHeader && (
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0] ",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="text-primary shrink-0">
                {icon}
              </span>
            )}
            <div className="truncate">
              {title && (
                <h3 className="text-primary font-bold text-lg leading-tight truncate">
                  {title}
                </h3>
              )}
              {resolvedSubtitle && (
                <p className="text-xs text-[#64748B] font-medium mt-0.5 truncate">
                  {resolvedSubtitle}
                </p>
              )}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {resolvedActions && (
            <div className="flex items-center gap-2 shrink-0">
              {resolvedActions}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={cn(noPadding ? "p-0" : "p-5 md:p-6", bodyClassName)}>
        {children}
      </div>

      {/* Optional Card Footer */}
      {footer && (
        <div
          className={cn(
            "border-t border-[#E2E8F0] px-5 py-3.5 bg-slate-50/60 rounded-b-xl",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContainerCard;
