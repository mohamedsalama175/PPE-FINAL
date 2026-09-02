import * as React from 'react';
import { 
  Settings, Clock, ShieldCheck, Trash2, 
  FileSpreadsheet, ShieldAlert, Sliders, Database
} from 'lucide-react';
import { ModuleCard } from '../components/ui/ModuleCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useTranslation } from '../i18n/useTranslation';

export default function SettingsHub() {
  const { language } = useTranslation();
  const isRtl = language === 'ar';

  const settingsModules = [
    {
      title: isRtl ? 'إعدادات النظام العامة' : 'Module Settings',
      subtitle: isRtl ? 'تخصيص قواعد الصرف، الأذونات، وسير العمل' : 'Global system policies, workflows, and defaults',
      icon: <Settings />,
      to: '/settings/modules',
      color: 'blue' as const,
    },
    {
      title: isRtl ? 'إعدادات الصلاحية والاستبدال' : 'Expiry & Lifecycle Rules',
      subtitle: isRtl ? 'تحديد العمر الافتراضي لكل صنف وقواعد التنبيه' : 'Lifespan limits, reminder windows, and auto-alerts',
      icon: <Clock />,
      to: '/settings/expiry',
      color: 'amber' as const,
    },
    {
      title: isRtl ? 'مصفوفة وصول أمناء المخازن' : 'Store Keeper Assignments',
      subtitle: isRtl ? 'ربط المستودعات بأمناء العهدة المعتمدين' : 'Warehouse authorization and location scope assignment',
      icon: <ShieldCheck />,
      to: '/settings/store-keeper-assignments',
      color: 'emerald' as const,
    },
    {
      title: isRtl ? 'سجل التدقيق غير القابل للتعديل' : 'Immutable Audit Log',
      subtitle: isRtl ? 'سجل تتبع أمني شامل لجميع العمليات' : 'Tamper-proof compliance log with JSON delta diffs',
      icon: <ShieldAlert />,
      to: '/audit-logs',
      color: 'indigo' as const,
    },
    {
      title: isRtl ? 'سلة المهملات المشتركة' : 'Shared Trash Bin',
      subtitle: isRtl ? 'استعادة أو الحذف النهائي للسجلات المؤرشفة' : 'Soft-deleted records recovery with 30-day retention',
      icon: <Trash2 />,
      to: '/trash',
      color: 'rose' as const,
    },
    {
      title: isRtl ? 'استيراد السجلات السابقة' : 'Historical Data Import',
      subtitle: isRtl ? 'رفع واستيراد كشوف الصرف القديمة عبر Excel' : 'Bulk CSV/Excel historical issuances ingestion engine',
      icon: <FileSpreadsheet />,
      to: '/employees/historical-import',
      color: 'teal' as const,
    },
    {
      title: isRtl ? 'السمات والمواصفات' : 'Attributes & Values',
      subtitle: isRtl ? 'تخصيص المقاسات، الألوان، والمعايير' : 'Custom sizing, standards, and dynamic specs',
      icon: <Sliders />,
      to: '/attributes',
      color: 'purple' as const,
    },
    {
      title: isRtl ? 'مجموعات الأصناف' : 'Item Groups & Classes',
      subtitle: isRtl ? 'تصنيف معدات الوقاية حسب مجالات الحماية' : 'Taxonomy hierarchy (Head, Eye, Body, Foot)',
      icon: <Database />,
      to: '/item-groups',
      color: 'violet' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRtl ? 'إدارة وتأسيس النظام' : 'System Settings'}
        subtitle={isRtl ? 'لوحة التحكم الإدارية، الصلاحيات، سجلات التدقيق، والتهيئة' : 'Enterprise configuration, compliance logs, lifecycle parameters, and administrative controls'}
        breadcrumbs={[
          { label: isRtl ? 'إعدادات النظام' : 'System Settings' },
        ]}
      />

      {/* Prometeon Module Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {settingsModules.map((item, idx) => (
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

