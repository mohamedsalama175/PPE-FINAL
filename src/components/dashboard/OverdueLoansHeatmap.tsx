import * as React from 'react';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react';
import { usePPEStore } from '../../store/useStore';

const ReactApexChart: any = typeof Chart === 'function' ? Chart : (Chart as any)?.default || Chart;

export interface OverdueLoanRecord {
  id: string;
  visitorName: string;
  visitorType: 'Visitor' | 'Contractor';
  hostEmployeeName: string;
  hostDepartment: string;
  ppeItemName: string;
  issueDate: string;
  expectedReturnDate: string;
  daysOverdue: number;
  contactPhone?: string;
}

export function OverdueLoansHeatmap({
  onSelectDate,
}: {
  onSelectDate: (dateStr: string, records: OverdueLoanRecord[]) => void;
}) {
  const { issuances, employees, ppeItems } = usePPEStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date('2026-09-01T12:00:00Z'));

  // Seeded & store overdue loans mapped by date
  const overdueMap = useMemo(() => {
    const map: Record<string, OverdueLoanRecord[]> = {};

    issuances.forEach((iss) => {
      if (iss.holderName && iss.expectedReturnDate && iss.status === 'issued') {
        const d = iss.expectedReturnDate.split('T')[0];
        const item = ppeItems.find((p) => p.id === iss.ppeItemId);
        const host = employees.find((e) => e.id === iss.employeeId) || employees[0];

        map[d] = map[d] || [];
        map[d].push({
          id: iss.id,
          visitorName: iss.holderName,
          visitorType: (iss.holderType as any) || 'Visitor',
          hostEmployeeName: host ? host.name : 'Supervisor On-Duty',
          hostDepartment: host?.department || 'Operations',
          ppeItemName: item?.nameEn || 'Safety Gear Asset',
          issueDate: iss.issueDate,
          expectedReturnDate: iss.expectedReturnDate,
          daysOverdue: 1,
          contactPhone: '+966 50 123 4567',
        });
      }
    });

    const seedRecords: { date: string; records: OverdueLoanRecord[] }[] = [
      {
        date: '2026-09-01',
        records: [
          {
            id: 'ov-1',
            visitorName: 'David Miller (Contractor)',
            visitorType: 'Contractor',
            hostEmployeeName: 'John HSE Supervisor',
            hostDepartment: 'HSE & Safety',
            ppeItemName: 'Full Body Harness & Lanyard',
            issueDate: '2026-08-30',
            expectedReturnDate: '2026-09-01',
            daysOverdue: 5,
            contactPhone: '+966 54 882 1920',
          },
          {
            id: 'ov-2',
            visitorName: 'Sami Al-Otaibi (Auditor)',
            visitorType: 'Visitor',
            hostEmployeeName: 'Admin User',
            hostDepartment: 'Executive HSE',
            ppeItemName: 'MSA Safety Helmet Yellow',
            issueDate: '2026-09-01',
            expectedReturnDate: '2026-09-01',
            daysOverdue: 5,
            contactPhone: '+966 55 331 4421',
          },
        ],
      },
      {
        date: '2026-09-03',
        records: [
          {
            id: 'ov-3',
            visitorName: 'Apex Scaffolding Team (4 Pax)',
            visitorType: 'Contractor',
            hostEmployeeName: 'Sarah Direct Super',
            hostDepartment: 'Site Operations',
            ppeItemName: '4x Clear Safety Goggles & Helmets',
            issueDate: '2026-09-02',
            expectedReturnDate: '2026-09-03',
            daysOverdue: 3,
            contactPhone: '+966 59 771 9001',
          },
        ],
      },
      {
        date: '2026-09-05',
        records: [
          {
            id: 'ov-4',
            visitorName: 'Dr. Robert Langdon (Consultant)',
            visitorType: 'Visitor',
            hostEmployeeName: 'John HSE Supervisor',
            hostDepartment: 'HSE Audit Team',
            ppeItemName: '3M 6800 Full-Face Respirator',
            issueDate: '2026-09-04',
            expectedReturnDate: '2026-09-05',
            daysOverdue: 1,
            contactPhone: '+966 53 220 1198',
          },
          {
            id: 'ov-5',
            visitorName: 'Carl Jenkins (Logistics Driver)',
            visitorType: 'Visitor',
            hostEmployeeName: 'Mike Store Keeper',
            hostDepartment: 'Logistics Central',
            ppeItemName: 'Hi-Vis Vest Yellow & Steel Boots',
            issueDate: '2026-09-05',
            expectedReturnDate: '2026-09-05',
            daysOverdue: 1,
            contactPhone: '+966 56 441 7892',
          },
          {
            id: 'ov-6',
            visitorName: 'TechnoPower Inspector',
            visitorType: 'Contractor',
            hostEmployeeName: 'Ahmed Electrician',
            hostDepartment: 'Electrical Bay',
            ppeItemName: 'Dielectric Helmet Red',
            issueDate: '2026-09-05',
            expectedReturnDate: '2026-09-05',
            daysOverdue: 1,
            contactPhone: '+966 50 998 1234',
          },
        ],
      },
      {
        date: '2026-08-28',
        records: [
          {
            id: 'ov-7',
            visitorName: 'Delta HVAC Specialist',
            visitorType: 'Contractor',
            hostEmployeeName: 'Ali Employee',
            hostDepartment: 'Maintenance',
            ppeItemName: 'Welding Helmet & Leather Gloves',
            issueDate: '2026-08-27',
            expectedReturnDate: '2026-08-28',
            daysOverdue: 9,
            contactPhone: '+966 55 119 0044',
          },
        ],
      },
    ];

    seedRecords.forEach(({ date, records }) => {
      map[date] = map[date] ? [...map[date], ...records] : records;
    });

    return map;
  }, [issuances, ppeItems, employees]);

  // Construct Heatmap Matrix: Rows = Weeks, Columns = Days (Sun - Sat)
  const { heatmapSeries, dateLookup } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const lookup: Record<string, string> = {}; // key: "Week X-Day" -> "2026-09-05"
    const weeks: { name: string; data: { x: string; y: number }[] }[] = [
      { name: 'Week 1', data: [] },
      { name: 'Week 2', data: [] },
      { name: 'Week 3', data: [] },
      { name: 'Week 4', data: [] },
      { name: 'Week 5', data: [] },
    ];

    // Initialize 0s for all weeks
    weeks.forEach((w) => {
      dayNames.forEach((dName) => {
        w.data.push({ x: dName, y: 0 });
      });
    });

    days.forEach((day) => {
      const dayOfWeek = getDay(day);
      const dayOfMonth = day.getDate();
      const startOffset = getDay(start);
      const weekIndex = Math.min(4, Math.floor((dayOfMonth + startOffset - 1) / 7));

      const dateStr = format(day, 'yyyy-MM-dd');
      const count = (overdueMap[dateStr] || []).length;
      const dayLabel = dayNames[dayOfWeek];

      const cell = weeks[weekIndex]?.data.find((d) => d.x === dayLabel);
      if (cell) {
        cell.y = count;
      }
      lookup[`${weeks[weekIndex]?.name}-${dayLabel}`] = dateStr;
    });

    return { heatmapSeries: weeks, dateLookup: lookup };
  }, [currentMonth, overdueMap]);

  // ApexCharts Options
  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'heatmap',
      height: 240,
      toolbar: {
        show: false,
      },
      fontFamily: 'inherit',
      background: 'transparent',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const weekName = heatmapSeries[config.seriesIndex]?.name;
          const dayName = heatmapSeries[config.seriesIndex]?.data[config.dataPointIndex]?.x;
          const dateStr = dateLookup[`${weekName}-${dayName}`];
          if (dateStr && overdueMap[dateStr]?.length > 0) {
            onSelectDate(dateStr, overdueMap[dateStr]);
          }
        },
      },
    },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: false,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0,
              color: '#33415518',
              name: '0 Overdue (Clear)',
            },
            {
              from: 1,
              to: 1,
              color: '#f59e0b',
              name: '1 Overdue',
            },
            {
              from: 2,
              to: 2,
              color: '#f97316',
              name: '2 Overdue',
            },
            {
              from: 3,
              to: 100,
              color: '#ef4444',
              name: '3+ High Volume',
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => (val > 0 ? `${val}` : ''),
      style: {
        colors: ['#ffffff'],
        fontSize: '11px',
        fontWeight: 800,
      },
    },
    xaxis: {
      categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      labels: {
        style: {
          fontWeight: 600,
        },
      },
    },
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex }) => {
        const weekName = heatmapSeries[seriesIndex]?.name;
        const dayName = heatmapSeries[seriesIndex]?.data[dataPointIndex]?.x;
        const dateStr = dateLookup[`${weekName}-${dayName}`];
        const records = dateStr ? overdueMap[dateStr] || [] : [];

        if (records.length === 0) {
          return `<div class="p-2 text-xs font-mono text-slate-300"><strong>${dateStr || dayName}</strong>: Clear (0 Overdue)</div>`;
 }

 const hostsList = records
 .map((r) => `• <strong>${r.hostEmployeeName}</strong> (${r.visitorName})`)
          .join('<br/>');

        return `
          <div class="p-2.5 text-xs text-white max-w-xs space-y-1">
            <div class="font-bold text-rose-400 font-mono">${dateStr} (${records.length} Overdue)</div>
            <div class="text-[10px] text-slate-300 font-semibold uppercase">Responsible Hosts:</div>
            <div class="text-[11px] text-slate-200">${hostsList}</div>
            <div class="text-[10px] text-amber-300 pt-1">Click to open full records</div>
          </div>
        `;
      },
    },
  }), [heatmapSeries, dateLookup, overdueMap, onSelectDate]);

  const totalOverdueThisMonth = useMemo(() => {
    return Object.values(overdueMap).flat().length;
  }, [overdueMap]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-rose-600 " />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Overdue Loans Heatmap (ApexCharts Matrix)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Days with unreturned visitor / contractor gear. Hover date for Host Employee names. Click cell to open records.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded border border-gray-200 text-slate-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded border border-gray-200 text-slate-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* ApexChart Heatmap */}
      <div className="w-full overflow-hidden">
        <ReactApexChart
          options={options}
          series={heatmapSeries}
          type="heatmap"
          height={240}
        />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          Clicking any shaded cell opens the <strong>Overdue Loans Detail Modal</strong>.
        </span>
        <span className="font-mono text-[11px]">
          Total Monthly Overdue: <strong className="text-rose-600 ">{totalOverdueThisMonth} items</strong>
        </span>
      </div>
    </div>
  );
}
