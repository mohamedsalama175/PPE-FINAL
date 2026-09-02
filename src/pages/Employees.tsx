import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { 
  Users, AlertTriangle, ShieldCheck, Wifi, WifiOff, 
  ChevronRight, Building2, Briefcase, MapPin, Eye 
} from 'lucide-react';
import { Employee } from '../types';

export default function Employees() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { 
    employees, 
    cachedEmployees, 
    jobPositions, 
    isEmployeeMasterOnline, 
    toggleEmployeeMasterStatus 
  } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [siteFilter, setSiteFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Source list: If master service is offline, use cachedEmployees; else use live employees
  const sourceEmployees = isEmployeeMasterOnline ? employees : cachedEmployees;

  // Extract unique sites and departments
  const uniqueSites = React.useMemo(() => {
    const sites = new Set<string>();
    sourceEmployees.forEach(e => { if (e.site) sites.add(e.site); });
    return Array.from(sites).sort();
  }, [sourceEmployees]);

  const uniqueDepartments = React.useMemo(() => {
    const depts = new Set<string>();
    sourceEmployees.forEach(e => { if (e.department) depts.add(e.department); });
    return Array.from(depts).sort();
  }, [sourceEmployees]);

  // Filtered employees
  const filteredEmployees = React.useMemo(() => {
    return sourceEmployees.filter(emp => {
      // Search by Name or Employee ID (employeeCode)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesCode = emp.employeeCode.toLowerCase().includes(query);
        if (!matchesName && !matchesCode) return false;
      }

      // Site filter
      if (siteFilter !== 'all' && emp.site !== siteFilter) {
        return false;
      }

      // Department filter
      if (deptFilter !== 'all' && emp.department !== deptFilter) {
        return false;
      }

      // Job position filter
      if (positionFilter !== 'all' && emp.jobPositionId !== positionFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const empStatus = emp.status || (emp.active ? 'Active' : 'Terminated');
        if (empStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [sourceEmployees, search, siteFilter, deptFilter, positionFilter, statusFilter]);

  const getPositionName = (jobPositionId: string) => {
    const jp = jobPositions.find(p => p.id === jobPositionId);
    if (!jp) return '—';
    return language === 'en' ? jp.nameEn : jp.nameAr;
  };

  const getStatusBadge = (status?: string, active?: boolean) => {
    const resolvedStatus = status || (active ? 'Active' : 'Terminated');
    switch (resolvedStatus) {
      case 'Active':
        return <StatusBadge status="success" label={t('activeStatus')} />;
      case 'Terminated':
        return <StatusBadge status="neutral" label={t('terminatedStatus')} />;
      case 'Transferred':
        return <StatusBadge status="warning" label={t('transferredStatus')} />;
      default:
        return <StatusBadge status="neutral" label={resolvedStatus} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Page Header with Title and Employee Master Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <PageHeader 
            title={t('employeeDirectory')} 
            description={t('readOnlyNotice')} 
          />
        </div>
        
        {/* Employee Master Service Status / Toggle Simulator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <span className="font-medium text-slate-600 ">Employee Master:</span>
          <button
            onClick={toggleEmployeeMasterStatus}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              isEmployeeMasterOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to simulate Employee Master service outage/failover"
          >
            {isEmployeeMasterOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online (Live)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline (Simulated)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Banner when Employee Master service is unreachable */}
      {!isEmployeeMasterOnline && (
        <div className="bg-amber-50 border-s-4 border-amber-500 p-4 rounded-e-lg flex items-start gap-3 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 ">
              {t('employeeMasterOffline')}
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Service connection could not be verified. Directory data is served from local persistent cache and all records are marked as <strong>Unverified</strong>.
            </p>
          </div>
          <button 
            onClick={toggleEmployeeMasterStatus}
            className="text-xs bg-amber-200/60 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <FilterBar>
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            placeholder={language === 'en' ? "Search by Name or Employee ID (e.g. Ahmed, EMP-012)..." : "ابحث بالاسم أو الرقم الوظيفي..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Site Filter */}
        <div className="w-40">
          <Select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="all">{t('allSites')}</option>
            {uniqueSites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </Select>
        </div>

        {/* Department Filter */}
        <div className="w-44">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">{t('allDepartments')}</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </Select>
        </div>

        {/* Job Position Filter */}
        <div className="w-44">
          <Select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="all">{t('allPositions')}</option>
            {jobPositions.map(jp => (
              <option key={jp.id} value={jp.id}>
                {language === 'en' ? jp.nameEn : jp.nameAr}
              </option>
            ))}
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="Active">{t('activeStatus')}</option>
            <option value="Terminated">{t('terminatedStatus')}</option>
            <option value="Transferred">{t('transferredStatus')}</option>
          </Select>
        </div>
      </FilterBar>

      {/* Employee List Table */}
      <ContainerCard noPadding className="overflow-hidden">
        <DataTable
          data={filteredEmployees}
          keyExtractor={(emp) => emp.id}
          onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          columns={[
            {
              key: 'employee',
              header: t('name'),
              render: (emp: Employee) => (
                <div className="flex items-center gap-3 py-1">
                  {emp.photoUrl ? (
                    <img 
                      src={emp.photoUrl} 
                      alt={emp.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm border border-primary/20 ${emp.photoUrl ? 'hidden' : ''}`}>
                    {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 hover:text-primary transition-colors">
                        {emp.name}
                      </span>
                      {!isEmployeeMasterOnline && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {t('unverified')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-700 font-medium">{emp.employeeCode}</span>
                      {emp.email && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{emp.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'jobPosition',
              header: t('jobPosition'),
              render: (emp: Employee) => (
                <div className="flex items-center gap-1.5 text-sm text-slate-800 ">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{getPositionName(emp.jobPositionId)}</span>
                </div>
              )
            },
            {
              key: 'siteDepartment',
              header: t('siteOrDepartment'),
              render: (emp: Employee) => (
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1 text-slate-800 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{emp.site || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 ">
                    <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                    <span>{emp.department || '—'}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              header: t('status'),
              render: (emp: Employee) => (
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(emp.status, emp.active)}
                </div>
              )
            },
            {
              key: 'actions',
              header: '',
              className: 'text-end w-16',
              render: (emp: Employee) => (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/employees/${emp.id}`);
                  }}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title={t('employeeDetails')}
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              )
            }
          ]}
        />

        {filteredEmployees.length === 0 && (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={language === 'en' ? "No employees found" : "لم يتم العثور على موظفين"}
            description={
              search 
                ? (language === 'en' ? `No employees match "${search}" with current filters.` : `لا يوجد موظفون يطابقون "${search}".`)
                : (language === 'en' ? "Try adjusting your filter settings." : "جرب تعديل خيارات التصفية.")
            }
          />
        )}
      </ContainerCard>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filteredEmployees.length}</strong> of <strong>{sourceEmployees.length}</strong> employees
        </span>
        <span className="italic text-slate-400 ">
          Source: Employee Master • Read-only access
        </span>
      </div>
    </div>
  );
}
