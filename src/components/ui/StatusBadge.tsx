import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusBadgeCategory = 
  | 'generic' 
  | 'inventory' 
  | 'inspection' 
  | 'approval' 
  | 'risk' 
  | 'condition';

export type SemanticStatus =
  | 'success'
  | 'error'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'neutral'
  // Inventory status
  | 'Active'
  | 'Inactive'
  | 'Discontinued'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Overdue'
  // Risk Categories
  | 'Category I'
  | 'Category II'
  | 'Category III'
  // Condition Pools
  | 'New'
  | 'Used'
  | 'Scrap'
  | 'Quarantine'
  // Approvals & Workflows
  | 'Approved'
  | 'Pending'
  | 'Under Review'
  | 'Rejected'
  | 'Draft'
  | 'Closed'
  | 'Open';

export type StatusType = 'success' | 'warning' | 'error' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status?: SemanticStatus | StatusType | string;
  category?: StatusBadgeCategory;
  label?: string;
  children?: React.ReactNode;
  icon?: boolean | React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface BadgeStyleConfig {
  classes: string;
  defaultIcon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'neutral',
  category,
  label,
  children,
  icon = false,
  dot = false,
  pulse = false,
  size = 'md',
  className,
}) => {
  const textLabel = label || children || status;

  // 1. Resolve Style Configurations
  const getBadgeStyle = (): BadgeStyleConfig => {
    const s = String(status).toLowerCase();

    // Risk Categories
    if (s.includes('category i') && !s.includes('category ii') && !s.includes('category iii')) {
      return {
        classes: "bg-blue-50 text-blue-700 border-blue-200 ",
        defaultIcon: <ShieldCheck className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('category ii') && !s.includes('category iii')) {
      return {
        classes: "bg-amber-50 text-amber-700 border-amber-200 ",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('category iii')) {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 ",
        defaultIcon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }

    // Condition Pools
    if (s === 'new') {
      return {
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200 ",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'used') {
      return {
        classes: "bg-blue-50 text-blue-700 border-blue-200 ",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'scrap') {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 ",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'quarantine') {
      return {
        classes: "bg-orange-50 text-orange-700 border-orange-200 ",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }

    // Approvals / Inspection
    if (s === 'approved' || s === 'passed' || s === 'active' || s === 'open') {
      return {
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200 ",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'pending' || s === 'under review' || s === 'low stock' || s === 'transferred') {
      return {
        classes: "bg-amber-50 text-amber-700 border-amber-200 ",
        defaultIcon: <Clock className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'rejected' || s === 'failed' || s === 'out of stock' || s === 'overdue' || s === 'terminated') {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 ",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'draft' || s === 'discontinued' || s === 'closed') {
      return {
        classes: "bg-slate-100 text-slate-700 border-slate-200 ",
        defaultIcon: <Clock className="w-3.5 h-3.5" />,
      };
    }

    // Semantic colors
    if (s === 'success') {
      return {
        classes: "bg-success-light text-success border border-success/20 ",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'error' || s === 'danger') {
      return {
        classes: "bg-danger-light text-danger border border-danger/20 ",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'warning') {
      return {
        classes: "bg-warning-light text-warning border border-warning/20 ",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'info') {
      return {
        classes: "bg-info-light text-info border border-info/20 ",
        defaultIcon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'primary') {
      return {
        classes: "bg-primary-light text-primary border border-primary/20 ",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'secondary') {
      return {
        classes: "bg-secondary-light text-secondary border border-secondary/20 ",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }

    // Default neutral
    return {
      classes: "bg-slate-100 text-slate-700 border-slate-200 ",
      defaultIcon: <Clock className="w-3.5 h-3.5" />,
    };
  };

  const styleConfig = getBadgeStyle();

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const renderedIcon = React.isValidElement(icon)
    ? icon
    : icon === true
    ? styleConfig.defaultIcon
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full border whitespace-nowrap tracking-wide transition-colors",
        sizeClasses[size],
        styleConfig.classes,
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 ltr:mr-1.5 rtl:ml-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {!pulse && dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current ltr:mr-1.5 rtl:ml-1.5 shrink-0" />
      )}
      {!dot && !pulse && renderedIcon && (
        <span className="inline-flex items-center shrink-0 ltr:mr-1.5 rtl:ml-1.5">
          {renderedIcon}
        </span>
      )}
      <span>{textLabel}</span>
    </span>
  );
};

export default StatusBadge;
