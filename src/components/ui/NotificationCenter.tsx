import * as React from 'react';
import { usePPEStore } from '../../store/useStore';
import { 
  Bell, AlertOctagon, AlertTriangle, Info, Check, 
  Trash2, ExternalLink, Play, Clock, Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function NotificationCenter() {
  const [open, setOpen] = React.useState(false);
  const { notifications, markNotificationRead, clearAllNotifications, runNightlyCronJobs } = usePPEStore();
  const [cronFeedback, setCronFeedback] = React.useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRunCron = () => {
    const result = runNightlyCronJobs();
    setCronFeedback(`Cron executed: ${result.reminderCount} reminders evaluated, ${result.overdueLoanCount} overdue loans flagged, ${result.autoPurgedCount} trash items purged.`);
    setTimeout(() => setCronFeedback(null), 5000);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
        title="In-App Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-lg bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                Live Notification Center
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-semibold rounded text-[10px]">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-[10px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Nightly Cron Banner Trigger */}
          <div className="p-2.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Simulate Nightly Batch Jobs</span>
            </div>
            <button
              type="button"
              onClick={handleRunCron}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              Run Cron
            </button>
          </div>

          {cronFeedback && (
            <div className="p-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-[10px] font-medium animate-in fade-in">
              {cronFeedback}
            </div>
          )}

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active notifications
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = n.severity === 'critical' ? AlertOctagon : n.severity === 'warning' ? AlertTriangle : Info;
                const iconColor = n.severity === 'critical' ? 'text-red-600' : n.severity === 'warning' ? 'text-amber-600' : 'text-blue-600';

                return (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 transition-colors flex items-start gap-2.5 hover:bg-slate-50 cursor-pointer ${
                      n.read ? 'opacity-70 bg-white' : 'bg-blue-50/20'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-slate-900 text-[11.5px] leading-snug truncate">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{format(new Date(n.timestamp), 'MMM d, HH:mm')}</span>
                        {n.linkTo && (
                          <Link
                            to={n.linkTo}
                            onClick={() => setOpen(false)}
                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            Open <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
