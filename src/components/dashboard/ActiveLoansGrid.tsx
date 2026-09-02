import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  X,
  CheckCircle2,
  Clock,
  AlertOctagon,
  CornerDownLeft,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { usePPEStore } from '../../store/useStore';
import { useToastStore } from '../../store/toastStore';
import { LoanStatusFilter } from './VisitorLoanStatusChart';

export interface VisitorLoanItem {
  id: string;
  borrowerName: string;
  borrowerType: 'Visitor' | 'Contractor';
  itemName: string;
  itemCode: string;
  hostEmployee: string;
  hostDepartment: string;
  issueTime: string;
  expectedReturn: string;
  status: 'active' | 'returned' | 'overdue';
  badgeNumber: string;
}

const INITIAL_VISITOR_LOANS: VisitorLoanItem[] = [
  {
    id: 'V-2026-001',
    borrowerName: 'Sarah Jenkins (Apex Audit)',
    borrowerType: 'Visitor',
    itemName: 'MSA V-Gard 500 Hard Hat & Hi-Vis',
    itemCode: 'HELM-YEL',
    hostEmployee: 'John HSE Supervisor',
    hostDepartment: 'HSE Division',
    issueTime: '07:30 AM',
    expectedReturn: '15:30 PM (Shift End)',
    status: 'active',
    badgeNumber: 'VIS-902',
  },
  {
    id: 'V-2026-002',
    borrowerName: 'Tariq Construction Crew (3 Pax)',
    borrowerType: 'Contractor',
    itemName: '3x Full Body Harnesses & Lanyards',
    itemCode: 'HARNESS-FB',
    hostEmployee: 'Sarah Direct Super',
    hostDepartment: 'Civil Works',
    issueTime: '06:45 AM',
    expectedReturn: '16:00 PM',
    status: 'active',
    badgeNumber: 'CON-412',
  },
  {
    id: 'V-2026-003',
    borrowerName: 'Marcus Vance (Logistics Carrier)',
    borrowerType: 'Visitor',
    itemName: 'Steel Toe Safety Boots & Clear Goggles',
    itemCode: 'BOOT-S3-41',
    hostEmployee: 'Mike Store Keeper',
    hostDepartment: 'Logistics',
    issueTime: '08:15 AM',
    expectedReturn: '11:00 AM',
    status: 'overdue',
    badgeNumber: 'VIS-881',
  },
  {
    id: 'V-2026-004',
    borrowerName: 'Elena Rostova (Lab Inspector)',
    borrowerType: 'Visitor',
    itemName: '3M 6800 Full-Face Respirator',
    itemCode: 'RESP-P3',
    hostEmployee: 'Admin User',
    hostDepartment: 'HSE',
    issueTime: '09:00 AM',
    expectedReturn: '14:00 PM',
    status: 'returned',
    badgeNumber: 'VIS-773',
  },
  {
    id: 'V-2026-005',
    borrowerName: 'Gulf Electrical Subcontractor',
    borrowerType: 'Contractor',
    itemName: 'Welding Helmet & Leather Gloves',
    itemCode: 'HELM-WELD',
    hostEmployee: 'Ahmed Electrician',
    hostDepartment: 'Electrical',
    issueTime: '07:15 AM',
    expectedReturn: '15:30 PM',
    status: 'active',
    badgeNumber: 'CON-109',
  },
  {
    id: 'V-2026-006',
    borrowerName: 'Dr. Faisal Al-Harbi (Environmental)',
    borrowerType: 'Visitor',
    itemName: 'Standard Site Kit (Helmet + Vest)',
    itemCode: 'KIT-1',
    hostEmployee: 'John HSE Supervisor',
    hostDepartment: 'HSE Division',
    issueTime: '10:00 AM',
    expectedReturn: '13:30 PM',
    status: 'returned',
    badgeNumber: 'VIS-552',
  },
];

export function ActiveLoansGrid({
  activeFilter,
  onResetFilter,
}: {
  activeFilter: LoanStatusFilter;
  onResetFilter: () => void;
}) {
  const [loans, setLoans] = useState<VisitorLoanItem[]>(INITIAL_VISITOR_LOANS);
  const [search, setSearch] = useState('');
  const addToast = useToastStore((s) => s.addToast);

  const handleReturnItem = (loan: VisitorLoanItem) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loan.id ? { ...l, status: 'returned' as const } : l))
    );
    addToast(`PPE loan ${loan.id} for ${loan.borrowerName} collected and returned.`, 'success');
  };

  const filteredLoans = useMemo(() => {
    return loans.filter((item) => {
      // Status filter
      if (activeFilter !== 'all' && item.status !== activeFilter) {
        return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase();
        return (
          item.borrowerName.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          item.hostEmployee.toLowerCase().includes(q) ||
          item.badgeNumber.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [loans, activeFilter, search]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 " />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Active Visitor &amp; Contractor Loans Grid
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift-end return enforcement. Filtered dynamically by the loan status donut chart above.
          </p>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="absolute start-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search visitor, host, badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 rounded bg-gray-50 border border-gray-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear Status Filter
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Notice */}
      {activeFilter === 'active' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
            <strong>Shift Collection Queue:</strong> Showing active unreturned visitor loans that must be surrendered before 16:00 PM.
          </span>
          <span className="font-mono font-bold text-[11px] bg-amber-200 px-2 py-0.5 rounded">
            {filteredLoans.length} Loans Due
          </span>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded border border-gray-200 max-h-72 overflow-y-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 z-10">
            <tr>
              <th scope="col" className="py-2.5 px-3">Borrower &amp; Badge</th>
              <th scope="col" className="py-2.5 px-3">Loaned Equipment</th>
              <th scope="col" className="py-2.5 px-3">Responsible Host</th>
              <th scope="col" className="py-2.5 px-3">Timing &amp; Return Due</th>
              <th scope="col" className="py-2.5 px-3">Status</th>
              <th scope="col" className="py-2.5 px-3 text-end">Counter Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 ">
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <tr
                  key={loan.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 ">
                      {loan.borrowerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {loan.borrowerType} • Badge #{loan.badgeNumber}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800 ">
                      {loan.itemName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{loan.itemCode}</div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-500" />
                      {loan.hostEmployee}
                    </div>
                    <div className="text-[10px] text-slate-400">{loan.hostDepartment}</div>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 ">
                    <div>Issued: {loan.issueTime}</div>
                    <div className="text-amber-600 font-bold">
                      Due: {loan.expectedReturn}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {loan.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-300 ">
                        <Clock className="w-3 h-3" /> Active Loan
                      </span>
                    ) : loan.status === 'overdue' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-300 ">
                        <AlertOctagon className="w-3 h-3" /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300 ">
                        <CheckCircle2 className="w-3 h-3" /> Returned
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-end whitespace-nowrap">
                    {loan.status !== 'returned' ? (
                      <button
                        type="button"
                        onClick={() => handleReturnItem(loan)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <CornerDownLeft className="w-3 h-3" /> Collect Return
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        Archived
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No visitor loan records found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
