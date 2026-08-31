'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import TaskDetailModal from './TaskDetailModal';

export default function MyTasksView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open'); // 'open', 'Done', 'all'
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('myTasks', 'true');
      params.append('limit', '100');

      if (statusFilter === 'open') {
        // Exclude done
      } else if (statusFilter === 'Done') {
        params.append('status', 'Done');
      }

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let loadedTasks = data.tasks || [];
        if (statusFilter === 'open') {
          loadedTasks = loadedTasks.filter((t: any) => t.status !== 'Done');
        }
        setTasks(loadedTasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>My Assigned Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-medium">
              {tasks.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal workbench consolidating all work items assigned to you across all client projects (Goal 5).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'open' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Work
          </button>
          <button
            onClick={() => setStatusFilter('Done')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Done' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* List of My Tasks */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">You Have No Assigned Tasks</h3>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === 'open'
              ? 'Great job! You have cleared your assigned queue.'
              : 'No tasks found for this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t) => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done';
            return (
              <div
                key={t.id}
                onClick={() => setActiveTaskId(t.id)}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {t.key}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{t.project.name}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === 'Done'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'Blocked'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : t.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{t.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t.dueDate ? (
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {format(new Date(t.dueDate), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-slate-400">No deadline</span>
                    )}
                  </div>

                  <span className="text-indigo-600 font-semibold flex items-center space-x-1 text-xs">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
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
        onTaskUpdated={fetchMyTasks}
      />
    </div>
  );
}
