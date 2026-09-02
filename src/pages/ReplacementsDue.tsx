import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { KpiCard } from '../components/ui/KpiCard';
import { useToastStore } from '../store/toastStore';
import { 
  Clock, AlertTriangle, ArrowRight, Download, RotateCcw, 
  Calendar, CheckCircle2, ShieldAlert, Sparkles, AlertOctagon 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Issuance, Employee } from '../types';

export default function ReplacementsDue() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const { 
    issuances, 
    ppeItems, 
    employees, 
    locations, 
    currentUser, 
    settings 
  } = usePPEStore();

  const isStoreKeeper = currentUser.role === 'Store Keeper';
  const assignedLocations = React.useMemo(() => {
    if (currentUser.role === 'Admin' || currentUser.role === 'HSE Supervisor') {
      return locations.filter(l => l.active && !l.deletedAt);
    }
    return locations.filter(l => l.active && !l.deletedAt && l.assignedStoreKeeperIds.includes(currentUser.id));
  }, [locations, currentUser]);

  const isBlockedKeeper = isStoreKeeper && assignedLocations.length === 0;

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'Upcoming' | 'Overdue'>('all');
  const [siteFilter, setSiteFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  // Process rows: non-returned issuances of ACTIVE employees only (BD-I473 / NEW-07)
  const rows = React.useMemo(() => {
    const today = new Date();

    return issuances
      .filter(i => {
        if (i.status !== 'issued' || !i.expectedReplacementDate) return false;

        // Lookup employee
        const emp = employees.find(e => e.id === i.employeeId);
        // Exclude Terminated and Transferred employees (NEW-07)
        if (!emp || emp.status === 'Terminated' || emp.status === 'Transferred') return false;

        // Store keeper location scoping
        if (isStoreKeeper && !assignedLocations.some(l => l.id === i.locationId)) return false;

        return true;
      })
      .map(i => {
        const emp = employees.find(e => e.id === i.employeeId)!;
        const ppe = ppeItems.find(p => p.id === i.ppeItemId);
        const loc = locations.find(l => l.id === i.locationId);

        // Site lead time window in days
        const site = loc?.site || 'Cairo Site';
        const leadTimeDays = settings.reminderLeadTimePerSite[site] || 14;

        const replDate = new Date(i.expectedReplacementDate!);
        const daysUntilRepl = differenceInDays(replDate, today);

        let status: 'Upcoming' | 'Overdue' | 'Normal' = 'Normal';
        if (daysUntilRepl < 0) {
          status = 'Overdue';
        } else if (daysUntilRepl <= leadTimeDays) {
          status = 'Upcoming';
        }

        return {
          issuance: i,
          employee: emp,
          ppe,
          location: loc,
          site,
          leadTimeDays,
          daysUntilRepl,
          status
        };
      })
      // Only keep Upcoming and Overdue
      .filter(r => r.status === 'Upcoming' || r.status === 'Overdue')
      .filter(r => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (siteFilter !== 'all' && r.site !== siteFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchEmp = r.employee.name.toLowerCase().includes(q) || r.employee.employeeCode.toLowerCase().includes(q);
          const matchItem = r.ppe?.nameEn.toLowerCase().includes(q) || r.ppe?.itemCode.toLowerCase().includes(q);
          if (!matchEmp && !matchItem) return false;
        }
        return true;
      })
      // Sorted oldest Expected Replacement Date first (NEW-07)
      .sort((a, b) => new Date(a.issuance.expectedReplacementDate!).getTime() - new Date(b.issuance.expectedReplacementDate!).getTime());
  }, [issuances, employees, ppeItems, locations, assignedLocations, isStoreKeeper, settings, statusFilter, siteFilter, search]);

  const upcomingCount = React.useMemo(() => rows.filter(r => r.status === 'Upcoming').length, [rows]);
  const overdueCount = React.useMemo(() => rows.filter(r => r.status === 'Overdue').length, [rows]);

  const handleIssueReplacement = (row: any) => {
    navigate(
      `/issuances/new?employeeId=${row.employee.id}&itemId=${row.issuance.ppeItemId}&variant=${encodeURIComponent(
        row.issuance.variantKey || ''
      )}&replacesId=${row.issuance.id}`
    );
  };

  const handleExportExcel = () => {
    addToast('Replacements_Due_Report.xlsx downloaded', 'info');
  };

  if (isBlockedKeeper) {
    return (
      <ContainerCard className="p-8 text-center space-y-4 border-red-200 ">
        <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 ">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from replacements due.
        </p>
      </ContainerCard>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Replacements Due (NEW-07 & BD-I473)"
        subtitle="Active non-returned PPE reaching replacement date or past due, excluding Terminated/Transferred staff"
        action={
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 me-1.5" /> Export Excel
          </Button>
        }
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Upcoming Replacements (Within Site Lead Time)"
          value={upcomingCount}
          color="warning"
          icon={<Clock className="w-6 h-6 text-amber-500" />}
        />

        <KpiCard
          title="Overdue Replacements (Past Replacement Date)"
          value={overdueCount}
          color="danger"
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        />
      </div>

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search employee name, code, or item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 text-xs"
          />

          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-40 text-xs"
          >
            <option value="all">All (Upcoming & Overdue)</option>
            <option value="Upcoming">Upcoming Only</option>
            <option value="Overdue">Overdue Only</option>
          </Select>

          <Select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            className="w-48 text-xs"
          >
            <option value="all">All Sites</option>
            <option value="Cairo Site">Cairo Site</option>
            <option value="Alexandria Site">Alexandria Site</option>
            <option value="Main Campus">Main Campus</option>
          </Select>
        </div>
      </FilterBar>

      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={rows}
        keyExtractor={r => r.issuance.id}
        emptyState={<EmptyState icon={<CheckCircle2 />} title="No replacements due at this time" />}
        columns={[
          {
            key: 'employee',
            header: 'Employee',
            render: r => (
              <div>
                <div className="font-semibold text-slate-800 text-xs">{r.employee.name}</div>
                <div className="text-[11px] text-slate-500">
                  {r.employee.employeeCode} — {r.employee.jobPosition} ({r.employee.site})
                </div>
              </div>
            )
          },
          {
            key: 'item',
            header: 'PPE Item & Variant',
            render: r => (
              <div>
                <div className="font-semibold text-slate-800 text-xs">{r.ppe?.nameEn || r.issuance.ppeItemId}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Variant: {r.issuance.variantKey || 'Standard'} | Batch: {r.issuance.batchNumber}
                </div>
              </div>
            )
          },
          {
            key: 'issueDate',
            header: 'Issue Date',
            render: r => format(new Date(r.issuance.issueDate), 'MMM d, yyyy')
          },
          {
            key: 'replacementDate',
            header: 'Replacement Date',
            render: r => {
              const isOverdue = r.status === 'Overdue';
              return (
                <div>
                  <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                    {format(new Date(r.issuance.expectedReplacementDate!), 'MMM d, yyyy')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isOverdue
                      ? `${Math.abs(r.daysUntilRepl)} day(s) overdue`
                      : `Due in ${r.daysUntilRepl} day(s)`}
                  </div>
                </div>
              );
            }
          },
          {
            key: 'status',
            header: 'Status',
            render: r => (
              <StatusBadge
                status={r.status === 'Overdue' ? 'error' : 'warning'}
                label={r.status}
              />
            )
          },
          {
            key: 'action',
            header: '',
            className: 'text-end',
            render: r => (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleIssueReplacement(r)}
              >
                <RotateCcw className="w-3.5 h-3.5 me-1" /> Issue Replacement
              </Button>
            )
          }
        ]}
      />
      </ContainerCard>
    </div>
  );
}
