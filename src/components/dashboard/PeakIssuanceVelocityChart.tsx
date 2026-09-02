import * as React from 'react';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Activity, Clock, Calendar, Zap } from 'lucide-react';

const ReactApexChart: any = typeof Chart === 'function' ? Chart : (Chart as any)?.default || Chart;

export function PeakIssuanceVelocityChart() {
  const [viewMode, setViewMode] = useState<'hour' | 'day'>('hour');

  const hourlyData = useMemo(() => {
    const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    const totals = [18, 42, 24, 11, 8, 14, 9, 16, 38, 28, 15, 10, 19, 8, 5];
    const kits = [12, 30, 14, 4, 2, 5, 3, 6, 25, 18, 6, 3, 11, 2, 1];
    return { categories: hours, totals, kits };
  }, []);

  const dailyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = [48, 41, 33, 29, 36, 8, 14];
    const kits = [32, 25, 18, 15, 22, 3, 6];
    return { categories: days, totals, kits };
  }, []);

  const active = viewMode === 'hour' ? hourlyData : dailyData;

  const series = useMemo(() => [
    { name: 'Total Transactions', data: active.totals },
    { name: 'Job Kits Issued', data: active.kits },
  ], [active]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'area',
      height: 250,
      background: 'transparent',
      fontFamily: 'inherit',
      toolbar: {
        show: false,
      },
    },
    colors: ['#6366f1', '#f59e0b'],
    stroke: {
      curve: 'smooth',
      width: [2.5, 2],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.65,
        opacityTo: 0.1,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: active.categories,
      labels: {
        style: {
          fontSize: '11px',
        },
      },
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Throughput / Hr',
        style: {
          fontSize: '10px',
        },
      },
      labels: {
        style: {
          fontSize: '10px',
        },
      },
    },
    grid: {
      borderColor: '#33415525',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      markers: {
        shape: 'circle',
        size: 5,
      },
    },
    tooltip: {
      theme: 'dark',
      shared: true,
      y: {
        formatter: (val: number) => `${val} units`,
      },
    },
    annotations: viewMode === 'hour' ? {
      xaxis: [
        {
          x: '07:00',
          borderColor: '#6366f1',
          label: {
            text: 'Morning Rush Peak (07:00)',
            style: {
              color: '#fff',
              background: '#6366f1',
              fontSize: '10px',
              fontWeight: 700,
            },
          },
        },
        {
          x: '14:00',
          borderColor: '#f59e0b',
          label: {
            text: 'Shift Handover (14:00)',
            style: {
              color: '#fff',
              background: '#f59e0b',
              fontSize: '10px',
              fontWeight: 700,
            },
          },
        },
      ],
    } : undefined,
  }), [active, viewMode]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs transition-colors space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 ">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 " />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">
              Peak Issuance Velocity (ApexCharts Throughput)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly transaction throughput. Helps Store Keepers anticipate shift changes and pre-pack kits.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center rounded-md p-0.5 bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('hour')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
              viewMode === 'hour'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hour of Day</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Day of Week</span>
          </button>
        </div>
      </div>

      {/* ApexChart Area */}
      <div className="w-full overflow-hidden">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={250}
        />
      </div>

      {/* Store Keeper Insight Callout */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-slate-700 ">
            <strong>Store Keeper Protocol:</strong> Rush peaks at <strong>07:00 AM</strong> &amp;{' '}
            <strong>14:00 PM</strong>. Pre-pack top 3 kits (Standard Site Kit, Welder Kit) 30 mins prior to eliminate counter delays.
          </span>
        </div>
        <div className="font-mono font-bold text-indigo-600 text-[11px] shrink-0">
          Optimal Pre-pack Target: 30 Kits
        </div>
      </div>
    </div>
  );
}
