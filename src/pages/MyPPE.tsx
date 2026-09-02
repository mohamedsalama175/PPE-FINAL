import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ContainerCard } from '../components/ui/ContainerCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ShieldCheck, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Issuance } from '../types';

export default function MyPPE() {
  const { t, language } = useTranslation();
  const { currentUser, issuances, ppeItems } = usePPEStore();

  const myIssuances = React.useMemo(() => {
    return issuances.filter(i => i.employeeId === currentUser.id && i.status === 'issued');
  }, [issuances, currentUser.id]);

  return (
    <div className="space-y-4">
      <PageHeader title={t('myPpe')} />
      
      <ContainerCard noPadding className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 ">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/20">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 ">{currentUser.name}</h2>
              <p className="text-sm text-slate-600 ">{currentUser.employeeCode} &middot; {currentUser.role}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-[13px] font-semibold text-slate-900 mb-4 uppercase tracking-wider">Currently Issued PPE</h3>
          <DataTable 
            data={myIssuances}
            keyExtractor={(item) => item.id}
            emptyState={<EmptyState icon={<Package />} title="No PPE currently held" description="You do not have any active PPE equipment assigned." />}
            columns={[
              { key: 'item', header: 'Item', render: (i) => {
                if (i.ppeItemId) {
                  const ppe = ppeItems.find(p => p.id === i.ppeItemId);
                  return ppe ? (
                    <div>
                      <div className="font-medium text-slate-900 ">{language === 'en' ? ppe.nameEn : ppe.nameAr}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{ppe.itemCode}</div>
                    </div>
                  ) : i.ppeItemId;
                }
                return 'Kit';
              }},
              { key: 'issueDate', header: 'Issue Date', render: (i) => (
                <span className="text-slate-700 font-medium">
                  {format(new Date(i.issueDate), 'MMM d, yyyy')}
                </span>
              )},
              { key: 'status', header: 'Status', render: (i) => (
                <StatusBadge status="success" label="Active" />
              )}
            ]}
          />
        </div>
      </ContainerCard>
    </div>
  );
}
