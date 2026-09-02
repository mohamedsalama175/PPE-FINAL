import * as React from 'react';
import { 
  ShieldAlert, Clock, AlertTriangle, Briefcase, 
  RefreshCw, FileText, CheckCircle2, UserCheck
} from 'lucide-react';
import { ModuleCard } from '../components/ui/ModuleCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useTranslation } from '../i18n/useTranslation';

export default function IssuanceHub() {
  const { language } = useTranslation();
  const isRtl = language === 'ar';

  const issuanceModules = [
    {
      title: isRtl ? 'صرف معدات الموظفين' : 'Employee Issuances',
      subtitle: isRtl ? 'سجل عمليات الصرف الفردي للموظفين' : 'Permanent assignments and standard PPE issuances',
      icon: <ShieldAlert />,
      to: '/issuances/records',
      color: 'blue' as const,
    },
    {
      title: isRtl ? 'قروض الزوار والمقاولين' : 'Visitor & Contractor Loans',
      subtitle: isRtl ? 'إدارة الإعارات المؤقتة وتتبع الاسترجاع' : 'Active and overdue temporary protective loans',
      icon: <Clock />,
      to: '/issuances/open-loans',
      color: 'purple' as const,
    },
    {
      title: isRtl ? 'الاستبدالات المستحقة' : 'Replacements Due',
      subtitle: isRtl ? 'متابعة انتهاء صلاحية واستبدال المعدات' : 'Items past validity periods requiring replacement',
      icon: <AlertTriangle />,
      to: '/issuances/replacements-due',
      color: 'amber' as const,
    },
    {
      title: isRtl ? 'صرف طقم وظيفة محدد' : 'Issue Job Kit',
      subtitle: isRtl ? 'صرف حزمة معدات وقاية متكاملة بنقرة واحدة' : 'Issue pre-configured multi-item PPE bundles',
      icon: <Briefcase />,
      to: '/issuances/new-kit',
      color: 'emerald' as const,
    },
    {
      title: isRtl ? 'إصدار إعارة مؤقتة' : 'Issue Temporary Loan',
      subtitle: isRtl ? 'تسجيل إعارة جديدة لزائر أو مقاول' : 'Register loan equipment with expected return date',
      icon: <UserCheck />,
      to: '/issuances/new-loan',
      color: 'teal' as const,
    },
    {
      title: isRtl ? 'أطقم الوظائف المحددة' : 'Job-Specific Kits',
      subtitle: isRtl ? 'إعداد الحزم القياسية للوظائف الخطرة' : 'Configure standardized PPE kits by job role',
      icon: <CheckCircle2 />,
      to: '/kits',
      color: 'indigo' as const,
    },
    {
      title: isRtl ? 'سجل الموظفين وتاريخ الصرف' : 'Personnel PPE Directory',
      subtitle: isRtl ? 'السجل التاريخي لكل موظف وبراءة الذمة' : 'Employee timeline, signatures, and safety passports',
      icon: <FileText />,
      to: '/employees',
      color: 'rose' as const,
    },
    {
      title: isRtl ? 'مرتجع واستبدال المعدات' : 'Returns & Condition Audit',
      subtitle: isRtl ? 'استلام المرتجعات وتقييم حالتها الفنية' : 'Inspect return conditions (Good vs Damaged/Scrap)',
      icon: <RefreshCw />,
      to: '/issuances/records',
      color: 'violet' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRtl ? 'الصرف، المرتجعات والإعارات' : 'Issuances & Loans'}
        subtitle={isRtl ? 'بوابة إدارة عمليات الصرف الدوري، الإعارات المؤقتة، واستبدال معدات الوقاية' : 'Manage equipment distribution, employee gear passports, and temporary safety loans'}
        breadcrumbs={[
          { label: isRtl ? 'عمليات الصرف' : 'Issuances & Loans' },
        ]}
      />

      {/* Prometeon Module Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {issuanceModules.map((item, idx) => (
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

