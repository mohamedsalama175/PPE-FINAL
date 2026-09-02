import * as React from "react";
import { Eye, Edit2, Trash2, Copy } from "lucide-react";
import Tippy from "@tippyjs/react";
import { cn } from "../../lib/utils";

export interface CustomAction {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  color?: string;
  className?: string;
}

export interface TableActionsButtonsProps {
  id?: string | number;
  onView?: () => void;
  onShow?: () => void; // Alias for onView
  onEdit?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onDuplicate?: () => void; // Alias for onClone
  viewTooltip?: string;
  editTooltip?: string;
  deleteTooltip?: string;
  cloneTooltip?: string;
  customActions?: CustomAction[];
  size?: 'sm' | 'md';
  className?: string;
}

export const TableActionsButtons: React.FC<TableActionsButtonsProps> = ({
  id,
  onView,
  onShow,
  onEdit,
  onDelete,
  onClone,
  onDuplicate,
  viewTooltip = "View",
  editTooltip = "Edit",
  deleteTooltip = "Delete",
  cloneTooltip = "Clone",
  customActions = [],
  size = 'md',
  className,
}) => {
  const handleView = onView || onShow;
  const handleClone = onClone || onDuplicate;

  const iconSize = size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnPadding = size === 'sm' ? "p-1 rounded-md" : "p-1.5 rounded-lg";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {/* View Action */}
      {handleView && (
        <Tippy content={viewTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            aria-label={viewTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-primary hover:bg-primary-light/50 transition-colors duration-150 active:scale-95 cursor-pointer"
            )}
          >
            <Eye className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Edit Action */}
      {onEdit && (
        <Tippy content={editTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={editTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-warning hover:bg-warning-light/50 transition-colors duration-150 active:scale-95 cursor-pointer"
            )}
          >
            <Edit2 className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Clone / Duplicate Action */}
      {handleClone && (
        <Tippy content={cloneTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClone();
            }}
            aria-label={cloneTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-info hover:bg-info-light/50 transition-colors duration-150 active:scale-95 cursor-pointer"
            )}
          >
            <Copy className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Custom Actions */}
      {customActions.map((action, idx) => (
        <Tippy key={idx} content={action.tooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            aria-label={action.tooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-[#1E293B] hover:bg-slate-100 transition-colors duration-150 active:scale-95 cursor-pointer",
              action.className
            )}
          >
            {action.icon}
          </button>
        </Tippy>
      ))}

      {/* Delete Action */}
      {onDelete && (
        <Tippy content={deleteTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={deleteTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors duration-150 active:scale-95 cursor-pointer"
            )}
          >
            <Trash2 className={iconSize} />
          </button>
        </Tippy>
      )}
    </div>
  );
};

export default TableActionsButtons;
