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
import { Users, Eye, Shield, UserX, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Employees() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { employees, jobPositions, issuances, currentUser, setEmployeeStatus } = usePPEStore();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Rule G13: Direct Supervisor scoping
  const isDirectSupervisor = currentUser.role === 'Direct Supervisor';

  const scopedEmployees = React.useMemo(() => {
    return employees.filter(emp => {
      // Scoping: Direct Supervisor sees own team only
      if (isDirectSupervisor && emp.supervisorId !== currentUser.id) {
        return false;
      }

      if (statusFilter !== 'all') {
        const empStatus = emp.status || (emp.active ? 'Active' : 'Inactive');
        if (empStatus !== statusFilter) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return emp.name.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [employees, isDirectSupervisor, currentUser.id, statusFilter, search]);

  return (
    <div>
      <PageHeader 
        title="Employee PPE Directory (PPE-042)" 
        subtitle={isDirectSupervisor ? "Manage safety equipment custody for your team members" : "Directory of employees, custody records, and lifecycle status"}
      />

      <FilterBar>
        <SearchInput 
          placeholder="Search by employee name or code..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="all">All Lifecycle Statuses</option>
          <option value="Active">Active</option>
          <option value="Terminated">Terminated (G12)</option>
          <option value="Transferred">Transferred (G12)</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </FilterBar>

      <DataTable 
        data={scopedEmployees}
        keyExtractor={(emp) => emp.id}
        emptyState={<EmptyState icon={<Users />} title="No employees found" description="No employees match the selected criteria." />}
        columns={[
          { key: 'code', header: 'Code', render: (emp) => (
            <span 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="font-mono text-xs font-bold text-accent cursor-pointer hover:underline"
            >
              {emp.employeeCode}
            </span>
          )},
          { key: 'name', header: 'Employee Name', render: (emp) => (
            <div>
              <div 
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="font-semibold text-ink cursor-pointer hover:underline"
              >
                {emp.name}
              </div>
              <div className="text-[11px] text-body">{emp.department || 'Operations'} &middot; {emp.site || 'Main Campus'}</div>
            </div>
          )},
          { key: 'position', header: 'Job Position', render: (emp) => {
            const jp = jobPositions.find(j => j.id === emp.jobPositionId);
            return jp ? (language === 'en' ? jp.nameEn : jp.nameAr) : '-';
          }},
          { key: 'activePPE', header: 'Currently Held PPE', render: (emp) => {
            const activeCount = issuances.filter(i => i.employeeId === emp.id && i.status === 'issued').length;
            return (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${activeCount > 0 ? 'bg-blue-50 text-accent border border-blue-200' : 'text-body bg-canvas border border-border'}`}>
                {activeCount} items held
              </span>
            );
          }},
          { key: 'status', header: 'Status (G12)', render: (emp) => {
            const st = emp.status || (emp.active ? 'Active' : 'Inactive');
            return (
              <StatusBadge 
                status={st === 'Active' ? 'success' : st === 'Terminated' ? 'error' : st === 'Transferred' ? 'warning' : 'neutral'} 
                label={st} 
              />
            );
          }},
          { key: 'actions', header: '', className: 'text-right', render: (emp) => (
            <div className="flex justify-end gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/employees/${emp.id}`)}>
                <Eye className="w-3.5 h-3.5 mr-1" /> View Timeline
              </Button>
            </div>
          )}
        ]}
      />
    </div>
  );
}

