import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { SerialList } from '../components/serials/SerialList';
import { SerialDetailPanel } from '../components/serials/SerialDetailPanel';

/** PPE-059: Serial Numbers page (search, filters, read-only history). */
export default function SerialNumbers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { serialId } = useParams();
  const { serialUnits, currentUser, visibleSerialUnits } = usePPEStore();
  // Scoping also applies to deep links: a Store Keeper cannot open a serial outside their locations.
  const unit = serialId ? visibleSerialUnits(currentUser).find(u => u.id === serialId) : undefined;

  return (
    <div className="pb-16">
      <PageHeader title={t('serialNumbers')} subtitle="Trace a single unit for audits, recalls and incidents (PPE-059)" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SerialList onOpen={u => navigate(`/serials/${u.id}`)} />
        </div>
        <div className="lg:col-span-2">
          {serialId && !unit && (
            <p className="text-sm text-body p-4 border border-border rounded-lg">{t('noSerialFound')}</p>
          )}
          {unit && <SerialDetailPanel key={unit.id + serialUnits.length} unit={unit} onClose={() => navigate('/serials')} />}
        </div>
      </div>
    </div>
  );
}
