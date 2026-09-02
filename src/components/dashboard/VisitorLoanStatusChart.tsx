import * as React from 'react';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Users, Clock, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';

const ReactApexChart: any = typeof Chart === 'function' ? Chart : (Chart as any)?.default || Chart;

export type LoanStatusFilter = 'all' | 'active' | 'returned' | 'overdue';

export function VisitorLoanStatusChart({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: LoanStatusFilter;
  onFilterChange: (status: LoanStatusFilter) => void;
}) {
  const stats = useMemo(() => {
    const active = 18;
    const returned = 42;
    const overdue = 4;
    const total = active + returned + overdue;
    const returnRate = Math.round((returned / total) * 100);
    return { active, returned, overdue, total, returnRate };
  }, []);

  const series = useMemo(() => [
    stats.active,
    stats.returned,
    stats.overdue,
  ], [stats]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 260,
      background: 'transparent',
      fontFamily: 'inherit',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const keys: LoanStatusFilter[] = ['active', 'returned', 'overdue'];
          const picked = keys[config.dataPointIndex];
          if (picked) {
            onFilterChange(activeFilter === picked ? 'all' : picked);
          }
        },
      },
    },
    labels: ['Active Loans', 'Returned Today', 'Overdue Past Shift'],
    colors: ['#f59e0b', '#10b981', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              fontWeight: 700,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 900,
              formatter: (val: string) => `${val} Loans`,
            },
            total: {
              show: true,
              label: 'Return Rate',
              fontSize: '11px',
              color: '#10b981',
              formatter: () => `${stats.returnRate}%`,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
      markers: {
        shape: 'circle',
        size: 5,
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `${val} Loans (Click to filter grid)`,
      },
    },
  }), [stats, activeFilter, onFilterChange]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 " />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Visitor Loan Status (ApexCharts Donut)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active visitor/contractor loans. Click <strong>Active Loans</strong> to highlight unreturned PPE due this shift.
          </p>
        </div>

        {activeFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filter ({activeFilter.toUpperCase()})
          </button>
        )}
      </div>

      {/* ApexCharts Donut */}
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-[280px]">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={260}
          />
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center text-xs">
        <div
          onClick={() => onFilterChange(activeFilter === 'active' ? 'all' : 'active')}
          className={`p-1.5 rounded border cursor-pointer transition-all ${
            activeFilter === 'active'
              ? 'bg-amber-100 border-amber-400 font-bold'
              : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[10px] text-amber-700 ">Active Loans</div>
          <div className="font-mono font-bold text-slate-900 ">{stats.active}</div>
        </div>

        <div
          onClick={() => onFilterChange(activeFilter === 'returned' ? 'all' : 'returned')}
          className={`p-1.5 rounded border cursor-pointer transition-all ${
            activeFilter === 'returned'
              ? 'bg-emerald-100 border-emerald-400 font-bold'
              : 'border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[10px] text-emerald-700 ">Returned</div>
          <div className="font-mono font-bold text-slate-900 ">{stats.returned}</div>
        </div>

        <div
          onClick={() => onFilterChange(activeFilter === 'overdue' ? 'all' : 'overdue')}
          className={`p-1.5 rounded border cursor-pointer transition-all ${
            activeFilter === 'overdue'
              ? 'bg-red-100 border-red-400 font-bold'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="text-[10px] text-red-700 ">Overdue</div>
          <div className="font-mono font-bold text-slate-900 ">{stats.overdue}</div>
        </div>
      </div>
    </div>
  );
}
