import * as React from 'react';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { differenceInDays, parseISO } from 'date-fns';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { usePPEStore } from '../../store/useStore';

const ReactApexChart: any = typeof Chart === 'function' ? Chart : (Chart as any)?.default || Chart;

export type ExpiryFilterType = 'all' | 'overdue' | 'critical' | 'warning' | 'compliant';

export interface ExpiringPPEItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  locationName: string;
  assignee: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  urgency: 'overdue' | 'critical' | 'warning' | 'compliant';
}

export function UpcomingExpiriesChart({ onActionClick }: { onActionClick?: (item: ExpiringPPEItem) => void }) {
  const { ppeItems, batches, locations, employees, issuances } = usePPEStore();
  const [selectedUrgency, setSelectedUrgency] = useState<ExpiryFilterType>('all');

  const today = useMemo(() => new Date('2026-09-06T12:00:00Z'), []);

  // Compute all active expiring items
  const expiringItems = useMemo<ExpiringPPEItem[]>(() => {
    const list: ExpiringPPEItem[] = [];

    batches.forEach((b) => {
      if (b.status === 'Active' && b.availableQty > 0 && b.expiryDate) {
        const item = ppeItems.find((p) => p.id === b.ppeItemId);
        const loc = locations.find((l) => l.id === b.locationId);
        const expDate = parseISO(b.expiryDate);
        const days = differenceInDays(expDate, today);

        let urgency: 'overdue' | 'critical' | 'warning' | 'compliant' = 'compliant';
        if (days < 0) urgency = 'overdue';
        else if (days <= 14) urgency = 'critical';
        else if (days <= 30) urgency = 'warning';
        else urgency = 'compliant';

        list.push({
          id: b.id,
          itemCode: item?.itemCode || 'PPE-BATCH',
          name: item?.nameEn || 'Batch PPE Item',
          category: item?.category || 'General',
          locationName: loc?.nameEn || 'Main Warehouse',
          assignee: 'Warehouse Stock',
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          daysRemaining: days,
          urgency,
        });
      }
    });

    issuances.forEach((iss) => {
      if (iss.status === 'issued' && (iss.expectedReplacementDate || iss.expectedReturnDate)) {
        const targetDateStr = iss.expectedReplacementDate || iss.expectedReturnDate!;
        const item = ppeItems.find((p) => p.id === iss.ppeItemId);
        const emp = employees.find((e) => e.id === iss.employeeId);
        const loc = locations.find((l) => l.id === iss.locationId);
        const expDate = parseISO(targetDateStr);
        const days = differenceInDays(expDate, today);

        let urgency: 'overdue' | 'critical' | 'warning' | 'compliant' = 'compliant';
        if (days < 0) urgency = 'overdue';
        else if (days <= 14) urgency = 'critical';
        else if (days <= 30) urgency = 'warning';
        else urgency = 'compliant';

        list.push({
          id: iss.id,
          itemCode: item?.itemCode || 'PPE-ISS',
          name: item?.nameEn || (iss.kitId ? 'Job Kit Bundle' : 'Field PPE Equipment'),
          category: item?.category || 'Operational Gear',
          locationName: loc?.nameEn || 'Site Alpha',
          assignee: emp?.name || iss.holderName || 'Field Personnel',
          batchNumber: iss.batchNumber || 'N/A',
          expiryDate: targetDateStr,
          daysRemaining: days,
          urgency,
        });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [batches, issuances, ppeItems, locations, employees, today]);

  // Counts by urgency
  const counts = useMemo(() => {
    return {
      overdue: expiringItems.filter((i) => i.urgency === 'overdue').length,
      critical: expiringItems.filter((i) => i.urgency === 'critical').length,
      warning: expiringItems.filter((i) => i.urgency === 'warning').length,
      compliant: expiringItems.filter((i) => i.urgency === 'compliant').length,
      total: expiringItems.length || 1,
    };
  }, [expiringItems]);

  // ApexCharts Series & Options
  const series = useMemo(() => [
    counts.overdue,
    counts.critical,
    counts.warning,
    counts.compliant,
  ], [counts]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 280,
      background: 'transparent',
      fontFamily: 'inherit',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const keys: ExpiryFilterType[] = ['overdue', 'critical', 'warning', 'compliant'];
          const picked = keys[config.dataPointIndex];
          if (picked) {
            setSelectedUrgency((prev) => (prev === picked ? 'all' : picked));
          }
        },
      },
    },
    labels: ['Overdue (<0d)', 'Critical (<14d)', 'Warning (14-30d)', 'Compliant (>30d)'],
    colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
    dataLabels: {
      enabled: false,
    },
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
              fontSize: '22px',
              fontWeight: 900,
              formatter: (val: string) => `${val} units`,
            },
            total: {
              show: true,
              label: 'Total PPE',
              fontSize: '11px',
              color: '#94a3b8',
              formatter: () => `${counts.total}`,
            },
          },
        },
      },
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
        formatter: (val: number) => `${val} Items (Click to Filter Table)`,
      },
    },
  }), [counts]);

  // Filtered List
  const filteredList = useMemo(() => {
    if (selectedUrgency === 'all') return expiringItems;
    return expiringItems.filter((i) => i.urgency === selectedUrgency);
  }, [expiringItems, selectedUrgency]);

  const getUrgencyBadge = (urgency: ExpiringPPEItem['urgency'], days: number) => {
    switch (urgency) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-red-100 text-red-700 border border-red-300 ">
            <AlertOctagon className="w-3 h-3" />
            {Math.abs(days)}d Overdue
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-300 ">
            <AlertTriangle className="w-3 h-3" />
            {days}d Left
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-300 ">
            <Clock className="w-3 h-3" />
            {days}d Left
          </span>
        );
      case 'compliant':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300 ">
            <CheckCircle2 className="w-3 h-3" />
            Compliant
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Upcoming Expiries Breakdown (ApexCharts Donut &amp; Action Grid)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Proximity to expiration across warehouse batches &amp; active issuances. Click any donut slice to pre-filter grid.
          </p>
        </div>

        {/* Clear filter button */}
        {selectedUrgency !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedUrgency('all')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filter (Showing: {selectedUrgency.toUpperCase()})
          </button>
        )}
      </div>

      {/* Top Section: ApexCharts Donut & Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* ApexCharts Donut */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-[280px]">
            <ReactApexChart
              options={options}
              series={series}
              type="donut"
              height={280}
            />
          </div>
        </div>

        {/* Right side: Clickable Urgency Metric Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
          {/* Overdue Card */}
          <button
            type="button"
            onClick={() => setSelectedUrgency(selectedUrgency === 'overdue' ? 'all' : 'overdue')}
            className={`p-3 rounded-lg border text-start transition-all cursor-pointer ${
              selectedUrgency === 'overdue'
                ? 'bg-red-50 border-red-400 shadow-xs ring-2 ring-red-400/30'
                : 'bg-white border-gray-200 hover:border-red-300 '
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-red-600 ">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Overdue / Expired
              </span>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-red-600 ">
                {counts.overdue}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">items</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Requires immediate scrapping or quarantine
            </p>
          </button>

          {/* Critical Card */}
          <button
            type="button"
            onClick={() => setSelectedUrgency(selectedUrgency === 'critical' ? 'all' : 'critical')}
            className={`p-3 rounded-lg border text-start transition-all cursor-pointer ${
              selectedUrgency === 'critical'
                ? 'bg-amber-50 border-amber-400 shadow-xs ring-2 ring-amber-400/30'
                : 'bg-white border-gray-200 hover:border-amber-300 '
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 ">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Critical (&lt;14 Days)
              </span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-600 ">
                {counts.critical}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">items</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Initiate replenishment requisition
            </p>
          </button>

          {/* Warning Card */}
          <button
            type="button"
            onClick={() => setSelectedUrgency(selectedUrgency === 'warning' ? 'all' : 'warning')}
            className={`p-3 rounded-lg border text-start transition-all cursor-pointer ${
              selectedUrgency === 'warning'
                ? 'bg-blue-50 border-blue-400 shadow-xs ring-2 ring-blue-400/30'
                : 'bg-white border-gray-200 hover:border-blue-300 '
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 ">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Warning (14-30 Days)
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-blue-600 ">
                {counts.warning}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">items</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Scheduled for end-of-month inspection
            </p>
          </button>

          {/* Compliant Card */}
          <button
            type="button"
            onClick={() => setSelectedUrgency(selectedUrgency === 'compliant' ? 'all' : 'compliant')}
            className={`p-3 rounded-lg border text-start transition-all cursor-pointer ${
              selectedUrgency === 'compliant'
                ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-2 ring-emerald-400/30'
                : 'bg-white border-gray-200 hover:border-emerald-300 '
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 ">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Compliant (&gt;30 Days)
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-600 ">
                {counts.compliant}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">items</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Safe operating lifecycles intact
            </p>
          </button>
        </div>
      </div>

      {/* Filtered Data Grid Section */}
      <div className="pt-3 border-t border-gray-100 ">
        <div className="flex items-center justify-between pb-2 text-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 ">
            <Filter className="w-3.5 h-3.5" />
            <span>Upcoming Expiries List ({filteredList.length} items)</span>
            {selectedUrgency !== 'all' && (
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                Filtered: {selectedUrgency}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Click actions to execute swift protocol</span>
        </div>

        <div className="overflow-x-auto rounded border border-gray-200 max-h-72 overflow-y-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 z-10">
              <tr>
                <th scope="col" className="py-2 px-3">Item Name &amp; Code</th>
                <th scope="col" className="py-2 px-3">Batch / Ref</th>
                <th scope="col" className="py-2 px-3">Assignee &amp; Site</th>
                <th scope="col" className="py-2 px-3">Expiry Date</th>
                <th scope="col" className="py-2 px-3">Proximity Status</th>
                <th scope="col" className="py-2 px-3 text-end">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900 ">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.itemCode} • {item.category}
                      </div>
                    </td>

                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 ">
                      {item.batchNumber}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 ">
                        {item.assignee}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.locationName}</div>
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-700 ">
                      {item.expiryDate}
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      {getUrgencyBadge(item.urgency, item.daysRemaining)}
                    </td>

                    <td className="py-2 px-3 text-end whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onActionClick?.(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                          item.urgency === 'overdue'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : item.urgency === 'critical'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-900 text-white '
                        }`}
                      >
                        <span>{item.urgency === 'overdue' ? 'Scrap / Replace' : 'Plan Order'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No items found matching the selected expiry filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
