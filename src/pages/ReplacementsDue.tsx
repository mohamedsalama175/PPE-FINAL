import * as React from 'react';
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
import { downloadCsv } from '../lib/excelService';
import { useToastStore } from '../store/toastStore';
import { Clock, Download, Plus, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function ReplacementsDue() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { issuances, ppeItems, employees, locations, expirySettings, currentUser } = usePPEStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = React.useState('');
  const [urgencyFilter, setUrgencyFilter] = React.useState<'all' | 'overdue' | 'dueSoon'>('all');

  // Rule G13: Direct Supervisor scoping
  const isDirectSupervisor = currentUser.role === 'Direct Supervisor';

  // Base due items calculation before UI filtering
  const allDue = React.useMemo(() => {
    const today = new Date();
    const generalLeadTime = expirySettings.generalLeadTimeDays || 30;

    return issuances
      .filter(iss => {
        // Only active issued equipment
        if (iss.status !== 'issued') return false;
        // Must have an expected replacement date
        if (!iss.expectedReplacementDate) return false;

        // Rule G12: Omit Terminated and Transferred employees
        if (iss.employeeId) {
          const emp = employees.find(e => e.id === iss.employeeId);
          if (emp && (emp.status === 'Terminated' || emp.status === 'Transferred' || !emp.active)) {
            return false;
          }
          // Rule G13: Direct Supervisor only sees team members
          if (isDirectSupervisor && emp?.supervisorId !== currentUser.id) {
            return false;
          }
        } else {
          // If Direct Supervisor, cannot see non-team loans
          if (isDirectSupervisor) return false;
        }

        const dueDate = new Date(iss.expectedReplacementDate);
        const daysLeft = differenceInDays(dueDate, today);

        const item = ppeItems.find(p => p.id === iss.ppeItemId);
        let leadTime = generalLeadTime;
        if (item) {
          const override = expirySettings.categoryOverrides?.find(o => o.riskCategory === item.riskCategory);
          if (override) leadTime = override.leadTimeDays;
        }

        // Check site override
        const loc = locations.find(l => l.id === iss.locationId);
        if (loc?.site) {
          const siteOverride = expirySettings.siteLeadTimes?.find(s => s.site === loc.site);
          if (siteOverride) leadTime = siteOverride.leadTimeDays;
        }

        // Due if overdue or within lead time
        return daysLeft <= leadTime;
      })
      .map(iss => {
        const item = ppeItems.find(p => p.id === iss.ppeItemId);
        const emp = employees.find(e => e.id === iss.employeeId);
        const loc = locations.find(l => l.id === iss.locationId);
        const dueDate = new Date(iss.expectedReplacementDate!);
        const daysLeft = differenceInDays(dueDate, today);
        const isOverdue = daysLeft < 0;

        return {
          iss,
          item,
          emp,
          loc,
          dueDate,
          daysLeft,
          isOverdue
        };
      });
  }, [issuances, employees, isDirectSupervisor, currentUser.id, ppeItems, locations, expirySettings]);

  // Counts of Upcoming and Overdue at top (PPE-040)
  const overdueCount = React.useMemo(() => allDue.filter(d => d.isOverdue).length, [allDue]);
  const upcomingCount = React.useMemo(() => allDue.filter(d => !d.isOverdue).length, [allDue]);

  const dueItems = React.useMemo(() => {
    return allDue
      .filter(entry => {
        if (urgencyFilter === 'overdue' && !entry.isOverdue) return false;
        if (urgencyFilter === 'dueSoon' && entry.isOverdue) return false;

        if (search) {
          const q = search.toLowerCase();
          const empMatch = entry.emp?.name.toLowerCase().includes(q) || entry.emp?.employeeCode.toLowerCase().includes(q);
          const itemMatch = entry.item?.name.toLowerCase().includes(q) || entry.item?.itemCode.toLowerCase().includes(q);
          return empMatch || itemMatch;
        }
        return true;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [allDue, urgencyFilter, search]);

  const handleExport = () => {
    if (dueItems.length === 0) {
      addToast('No replacements due records to export.', 'error');
      return;
    }
    const headers = ['Issuance Ref', 'Employee Name', 'Employee Code', 'PPE Item', 'Item Code', 'Location', 'Issue Date', 'Replacement Due Date', 'Days Left / Overdue', 'Status'];
    const rows = dueItems.map(d => [
      d.iss.reference || d.iss.id,
      d.emp?.name || d.iss.holderName || '',
      d.emp?.employeeCode || '',
      d.item?.name || '',
      d.item?.itemCode || '',
      d.loc?.name || '',
      format(new Date(d.iss.issueDate), 'yyyy-MM-dd'),
      format(d.dueDate, 'yyyy-MM-dd'),
      d.daysLeft < 0 ? `${Math.abs(d.daysLeft)} days overdue` : `${d.daysLeft} days remaining`,
      d.isOverdue ? 'Overdue' : 'Due Soon'
    ]);
    downloadCsv('ppe_replacements_due', headers, rows);
    addToast('Replacements Due exported successfully.', 'success');
  };

  return (
    <div>
      <PageHeader 
        title="Replacements Due (PPE-040)" 
        subtitle={isDirectSupervisor ? "Showing replacements due for your direct reporting team members" : "Items reaching the end of their operational lifespan based on configured lead times"}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
            <Button onClick={() => navigate('/issuances/new')}>
              <Plus className="w-4 h-4 mr-2" /> Issue Replacement
            </Button>
          </div>
        } 
      />

      {/* Summary Counts at Top (PPE-040) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div 
          onClick={() => setUrgencyFilter('all')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${urgencyFilter === 'all' ? 'bg-accent/10 border-accent shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-body uppercase tracking-wider">Total Replacements Due</div>
          <div className="text-xl font-bold text-ink mt-0.5">{allDue.length} items</div>
          <p className="text-[11px] text-body mt-0.5">Within operational replacement threshold</p>
        </div>

        <div 
          onClick={() => setUrgencyFilter('overdue')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${urgencyFilter === 'overdue' ? 'bg-red-50 border-safety-red shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-safety-red uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue Lifespan
          </div>
          <div className="text-xl font-bold text-safety-red mt-0.5">{overdueCount} items</div>
          <p className="text-[11px] text-safety-red/80 mt-0.5">Lifespan expired; immediate renewal required</p>
        </div>

        <div 
          onClick={() => setUrgencyFilter('dueSoon')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${urgencyFilter === 'dueSoon' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-surface border-border hover:bg-canvas'}`}
        >
          <div className="text-[10px] font-bold text-safety-amber-signal uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Upcoming (Within Lead Time)
          </div>
          <div className="text-xl font-bold text-safety-amber-signal mt-0.5">{upcomingCount} items</div>
          <p className="text-[11px] text-safety-amber-signal/80 mt-0.5">Lead time window; prepare replenishment</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput 
          placeholder="Search by employee or item..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value as any)} className="w-48">
          <option value="all">All Due Equipment</option>
          <option value="overdue">Overdue Only (&lt; 0 days)</option>
          <option value="dueSoon">Due Soon (Within Lead Time)</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={dueItems}
        keyExtractor={(item) => item.iss.id}
        emptyState={
          <EmptyState 
            icon={<Clock />} 
            title="No replacements currently due" 
            description={isDirectSupervisor ? "All PPE held by your team is compliant and within its operational lifespan." : "All issued equipment is within its safe operational lifespan."} 
          />
        }
        columns={[
          { key: 'employee', header: 'Employee / Holder', render: (d) => (
            <div>
              <div 
                className="font-semibold text-ink cursor-pointer hover:underline"
                onClick={() => d.emp && navigate(`/employees/${d.emp.id}`)}
              >
                {d.emp?.name || d.iss.holderName}
              </div>
              <div className="text-[11px] font-mono text-body">{d.emp?.employeeCode} &middot; {d.emp?.department}</div>
            </div>
          )},
          { key: 'item', header: 'Equipment', render: (d) => (
            <div>
              <div className="font-medium text-ink">{d.item ? d.item.name : d.iss.ppeItemId}</div>
              <div className="text-[11px] text-body">{d.item?.itemCode} &middot; Cat {d.item?.riskCategory}</div>
            </div>
          )},
          { key: 'dueDate', header: 'Replacement Due', render: (d) => (
            <div>
              <div className="font-mono text-xs font-semibold">{format(d.dueDate, 'yyyy-MM-dd')}</div>
              <div className="text-[10px] text-body">Issued: {format(new Date(d.iss.issueDate), 'yyyy-MM-dd')}</div>
            </div>
          )},
          { key: 'urgency', header: 'Urgency & Timing', render: (d) => (
            d.isOverdue ? (
              <span className="inline-flex items-center gap-1 font-bold text-xs text-safety-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5" /> {Math.abs(d.daysLeft)} days OVERDUE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-safety-amber-signal bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5" /> Due in {d.daysLeft} days
              </span>
            )
          )},
          { key: 'actions', header: '', className: 'text-right', render: (d) => (
            <Button 
              size="sm" 
              onClick={() => navigate(`/issuances/new?employeeId=${d.emp?.id || ''}&itemId=${d.item?.id || ''}&replacesIssuanceId=${d.iss.id}`)}
            >
              Issue Replacement <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        ]}
      />
    </div>
  );
}

