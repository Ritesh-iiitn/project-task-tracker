'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  BellOff,
  BellRing,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import TaskDetailModal from './TaskDetailModal';

export default function AlertsView() {
  const { user, refreshAlerts } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const handleDismiss = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const res = await fetch(`/api/alerts/${taskId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        await fetchAlerts();
        await refreshAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const res = await fetch(`/api/alerts/${taskId}/dismiss`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAlerts();
        await refreshAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white rounded-2xl p-6 border border-rose-900/60 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-rose-500/20 border border-rose-400/30 rounded-full text-xs font-semibold text-rose-300 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Delivery Alerts (Goal 10)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Overdue Task Center</h1>
          <p className="text-xs text-rose-200/80 mt-1 max-w-2xl">
            Tasks past their delivery deadline that are not yet marked as 'Done'. Assigned members can dismiss alerts; if a task's due date is subsequently rescheduled, the alert automatically resurfaces.
          </p>
        </div>
      </div>

      {/* Goal 10 Rule Notice Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-3 shadow-sm">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-950">Overdue Alert Lifecycle Rules</h4>
          <p className="mt-0.5 text-amber-800">
            • Only assignees (or managers) can dismiss an alert.<br />
            • Dismissals are linked to the specific due date timestamp. If the due date is later edited, the alert is automatically restored on the next cycle.
          </p>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Zero Overdue Tasks!</h3>
          <p className="text-xs text-slate-500 mt-1">
            All active project commitments are currently on schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((t) => {
            const daysOverdue = t.dueDate ? differenceInDays(now, new Date(t.dueDate)) : 0;
            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  t.isDismissedByMe
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-rose-200 hover:border-rose-300 bg-gradient-to-r from-white via-white to-rose-50/20'
                }`}
              >
                {/* Left: Task info & Overdue Badge */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                      {t.key}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{t.project.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                      {t.status}
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {daysOverdue <= 0 ? 'Due Today' : `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`}
                    </span>
                    {t.isDismissedByMe && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        Dismissed by you
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setActiveTaskId(t.id)}
                    className="text-sm font-bold text-slate-900 hover:text-rose-600 cursor-pointer transition-colors pt-1"
                  >
                    {t.title}
                  </h3>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-700 font-semibold">
                        Deadline: {format(new Date(t.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div>
                      Assignees:{' '}
                      <span className="font-medium text-slate-700">
                        {t.assignees.map((a: any) => a.user.name).join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2">
                  {t.isAssignedToMe || user?.role === 'manager' ? (
                    t.isDismissedByMe ? (
                      <button
                        onClick={() => handleRestore(t.id)}
                        disabled={actionLoading === t.id}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Restore Alert</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDismiss(t.id)}
                        disabled={actionLoading === t.id}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
                        title="Dismiss alert for this task"
                      >
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Dismiss Alert</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Not assigned to you</span>
                  )}

                  <button
                    onClick={() => setActiveTaskId(t.id)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskDetailModal
        taskId={activeTaskId}
        isOpen={!!activeTaskId}
        onClose={() => setActiveTaskId(null)}
        onTaskUpdated={fetchAlerts}
      />
    </div>
  );
}
