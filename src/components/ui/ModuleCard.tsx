import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export type ModuleCardColor = 
  | 'blue' 
  | 'emerald' 
  | 'purple' 
  | 'indigo' 
  | 'rose' 
  | 'amber' 
  | 'teal' 
  | 'violet';

export interface ModuleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  to: string;
  color?: ModuleCardColor;
  badge?: string;
  className?: string;
}

const colorMap: Record<ModuleCardColor, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#eaf1ff]', text: 'text-[#2a78d6]' },
  emerald: { bg: 'bg-[#ddf5f0]', text: 'text-[#00ab55]' },
  purple: { bg: 'bg-[#ebe4f7]', text: 'text-[#805dca]' },
  indigo: { bg: 'bg-[#e0e7ff]', text: 'text-[#4f46e5]' },
  rose: { bg: 'bg-[#fff5f5]', text: 'text-[#e7515a]' },
  amber: { bg: 'bg-[#fff9ed]', text: 'text-[#e2a03f]' },
  teal: { bg: 'bg-[#e6fffa]', text: 'text-[#0d9488]' },
  violet: { bg: 'bg-[#ede9fe]', text: 'text-[#7c3aed]' },
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  subtitle,
  icon,
  to,
  color = 'blue',
  badge,
  className,
}) => {
  const c = colorMap[color] || colorMap.blue;

  return (
    <Link
      to={to}
      className={cn(
        'group relative flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      {badge && (
        <span className="absolute top-3.5 end-3.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
          {badge}
        </span>
      )}

      {/* Prometeon-style Soft Rounded Icon Square */}
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 mb-4 transition-transform duration-200 group-hover:scale-105',
          c.bg,
          c.text
        )}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: cn('w-7 h-7', (icon.props as any)?.className),
            })
          : icon}
      </div>

      {/* Card Label */}
      <h3 className="text-base font-bold text-[#1E293B] group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>

      {subtitle && (
        <p className="text-xs text-[#64748B] mt-1 leading-normal font-medium">
          {subtitle}
        </p>
      )}
    </Link>
  );
};

export default ModuleCard;

