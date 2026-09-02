import * as React from 'react';
import { 
  PackageSearch, ArrowRightLeft, ClipboardList, Layers, 
  MapPin, ShieldCheck, Warehouse, Box
} from 'lucide-react';
import { ModuleCard } from '../components/ui/ModuleCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useTranslation } from '../i18n/useTranslation';

export default function StockHub() {
  const { language } = useTranslation();
  const isRtl = language === 'ar';

  const stockModules = [
    {
      title: isRtl ? 'مستويات المخزون والتنبيهات' : 'Stock Levels & Alerts',
      subtitle: isRtl ? 'عرض كميات المستودعات والحد الأدنى' : 'Live warehouse balances and min-level alerts',
      icon: <PackageSearch />,
      to: '/stock/levels',
      color: 'blue' as const,
    },
    {
      title: isRtl ? 'مناقلات المخزون' : 'Stock Transfers',
      subtitle: isRtl ? 'نقل المواد بين المستودعات والمواقع' : 'Inter-warehouse transfers and approvals',
      icon: <ArrowRightLeft />,
      to: '/stock/transfers',
      color: 'purple' as const,
    },
    {
      title: isRtl ? 'تعديلات المخزون' : 'Stock Adjustments',
      subtitle: isRtl ? 'تسويات الجرد والعجز والزيادة' : 'Manual adjustments, write-offs, and reconciliations',
      icon: <ClipboardList />,
      to: '/stock/adjustments',
      color: 'amber' as const,
    },
    {
      title: isRtl ? 'الأرصدة الافتتاحية' : 'Opening Balances',
      subtitle: isRtl ? 'إدخال وتثبيت أرصدة أول المدة' : 'Initial inventory baseline entries',
      icon: <Layers />,
      to: '/stock/opening-balances',
      color: 'emerald' as const,
    },
    {
      title: isRtl ? 'مواقع المستودعات' : 'Warehouse Locations',
      subtitle: isRtl ? 'إدارة المستودعات ومناطق التخزين' : 'Facility sites, store rooms, and bins',
      icon: <MapPin />,
      to: '/locations',
      color: 'teal' as const,
    },
    {
      title: isRtl ? 'مصفوفة أمناء المخازن' : 'Store Keeper Matrix',
      subtitle: isRtl ? 'تحديد صلاحيات وصول المستودعات' : 'Location assignments and keeper authorization',
      icon: <ShieldCheck />,
      to: '/settings/store-keeper-assignments',
      color: 'indigo' as const,
    },
    {
      title: isRtl ? 'كتالوج معدات الوقاية' : 'PPE Item Catalog',
      subtitle: isRtl ? 'سجل الأصناف والمواصفات المعتمدة' : 'Master catalog of certified protective equipment',
      icon: <Box />,
      to: '/catalog',
      color: 'rose' as const,
    },
    {
      title: isRtl ? 'إدارة الخردة والتالف' : 'Scrap Management',
      subtitle: isRtl ? 'سجلات التكهين والإتلاف البيئي' : 'Damaged and decommissioned safety items',
      icon: <Warehouse />,
      to: '/scrap',
      color: 'violet' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRtl ? 'إدارة المخزون والمستودعات' : 'Stock Management'}
        subtitle={isRtl ? 'بوابة إدارة المستودعات، الأرصدة، والمناقلات المخزنية' : 'Central operations for inventory levels, transfers, and warehouse controls'}
        breadcrumbs={[
          { label: isRtl ? 'إدارة المخزون' : 'Stock Management' },
        ]}
      />

      {/* Prometeon Module Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {stockModules.map((item, idx) => (
          <ModuleCard
            key={idx}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            to={item.to}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
}

