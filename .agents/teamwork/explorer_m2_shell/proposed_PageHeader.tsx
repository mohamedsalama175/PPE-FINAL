import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs,
  action,
  actions,
  onBack,
  className
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  const displayAction = action || actions;

  return (
    <div className={cn("mb-6 space-y-2 select-none", className)}>
      {/* Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#8A9AAF] flex-wrap">
          <Link 
            to="/" 
            className="hover:text-[#212B59] dark:hover:text-white transition-colors flex items-center gap-1 p-0.5 rounded"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-[#8A9AAF] rtl:rotate-180 shrink-0" />
                {crumb.href && !isLast ? (
                  <Link 
                    to={crumb.href} 
                    className="hover:text-[#212B59] dark:hover:text-white transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(
                    isLast 
                      ? "font-semibold text-[#212B59] dark:text-white" 
                      : "font-medium text-[#64748B] dark:text-[#888ea8]"
                  )}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Title, Subtitle and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title + Back Button Group */}
        <div className="flex items-start sm:items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-xl text-[#506690] dark:text-[#888ea8] hover:bg-white dark:hover:bg-[#1b2e4b] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#17263c] hover:text-[#212B59] dark:hover:text-white transition-all cursor-pointer shadow-2xs shrink-0"
              title="Back"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 shrink-0" />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E293B] dark:text-white font-sans">
              {title}
            </h1>
            {displaySubtitle && (
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#888ea8] mt-1 leading-relaxed">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right / Start Action Buttons */}
        {displayAction && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            {displayAction}
          </div>
        )}
      </div>
    </div>
  );
}
