import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { Issuance } from '../types';

export default function MyPPE() {
  const { t, language } = useTranslation();
  const { currentUser, issuances, ppeItems } = usePPEStore();

  const myIssuances = React.useMemo(() => {
    return issuances.filter(i => i.employeeId === currentUser.id && i.status === 'issued');
  }, [issuances, currentUser.id]);

  return (
    <div>
      <PageHeader title={t('myPpe')} />
      
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border bg-canvas">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xl font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{currentUser.name}</h2>
              <p className="text-sm text-body">{currentUser.employeeCode} &middot; {currentUser.role}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-[13px] font-semibold text-ink mb-4 uppercase tracking-wider">Currently Issued PPE</h3>
          <DataTable 
            data={myIssuances}
            keyExtractor={(item) => item.id}
            columns={[
              { key: 'item', header: 'Item', render: (i) => {
                if (i.ppeItemId) {
                  const ppe = ppeItems.find(p => p.id === i.ppeItemId);
                  return ppe ? (
                    <div>
                      <div className="font-medium text-ink">{language === 'en' ? ppe.nameEn : ppe.nameAr}</div>
                      <div className="text-xs text-body font-mono mt-0.5">{ppe.itemCode}</div>
                    </div>
                  ) : i.ppeItemId;
                }
                return 'Kit';
              }},
              { key: 'issueDate', header: 'Issue Date', render: (i) => format(new Date(i.issueDate), 'MMM d, yyyy') },
              { key: 'status', header: 'Status', render: (i) => (
                <StatusBadge status="success" label="Active" />
              )}
            ]}
          />
        </div>
      </div>
    </div>
  )
}
