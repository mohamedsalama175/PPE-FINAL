import * as React from 'react';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Briefcase, Zap, ArrowRight } from 'lucide-react';
import { usePPEStore } from '../../store/useStore';
import { Kit } from '../../types';

const ReactApexChart: any = typeof Chart === 'function' ? Chart : (Chart as any)?.default || Chart;

export function TopJobKitsChart({
  onSelectKit,
}: {
  onSelectKit: (kit: Kit) => void;
}) {
  const { kits } = usePPEStore();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('month');

  const defaultCounts: Record<string, { week: number; month: number }> = {
    'kit-1': { week: 14, month: 48 }, // Standard Site Kit
    'kit-2': { week: 9, month: 32 },  // Welder Kit
    'kit-3': { week: 7, month: 24 },  // Scaffolder Kit
    'kit-4': { week: 4, month: 16 },  // Lab Tech Kit
    'kit-5': { week: 3, month: 11 },  // Manager Visit Kit
  };

  const rankedKits = useMemo(() => {
    const list = kits.map((kit) => {
      const def = defaultCounts[kit.id] || { week: 2, month: 8 };
      const count = timeframe === 'week' ? def.week : def.month;
      return { kit, name: kit.nameEn, count };
    });

    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [kits, timeframe]);

  const series = useMemo(() => [
    {
      name: 'Dispatched Bundles',
      data: rankedKits.map((k) => k.count),
    },
  ], [rankedKits]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 250,
      background: 'transparent',
      fontFamily: 'inherit',
      toolbar: {
        show: false,
      },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const picked = rankedKits[config.dataPointIndex];
          if (picked) {
            onSelectKit(picked.kit);
          }
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '55%',
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val} Kits`,
      offsetX: 28,
      style: {
        fontSize: '11px',
        fontWeight: 700,
        colors: ['#64748b'],
      },
    },
    xaxis: {
      categories: rankedKits.map((k) => k.name),
      labels: {
        style: {
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 600,
        },
      },
    },
    grid: {
      borderColor: '#33415525',
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `${val} Kits (Click bar to quick issue)`,
      },
    },
  }), [rankedKits, onSelectKit]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Top 5 Job Kits Issued (ApexCharts Horizontal Bar)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Most dispatched bundles. Click any bar to instantly trigger the <strong>Issue Job Kit</strong> modal.
          </p>
        </div>

        {/* Timeframe Toggle */}
        <div className="inline-flex items-center rounded-md p-0.5 bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
              timeframe === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
              timeframe === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* ApexChart Horizontal Bar */}
      <div className="w-full overflow-hidden">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={250}
        />
      </div>

      {/* Action Notice */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Clicking any bar auto-populates the kit modal for rapid shift dispatching.
        </span>
        <span className="font-mono text-[11px] text-amber-600 font-bold">
          ⚡ 1-Click Kit Shortcut Active
        </span>
      </div>
    </div>
  );
}
