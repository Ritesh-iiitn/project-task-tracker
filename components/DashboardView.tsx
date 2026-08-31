'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Users,
  TrendingUp,
  ArrowRight,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface StatsData {
  metrics: {
    openTasks: number;
    overdueTasks: number;
    dueThisWeek: number;
    completedThisWeek: number;
    totalProjects: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  assigneeBreakdown: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    totalAssigned: number;
    openTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    isOverloaded: boolean;
  }>;
  completionTrends: Array<{ weekLabel: string; count: number; weekIndex: number }>;
}

interface DashboardViewProps {
  onNavigateToTasks: (filter?: { status?: string; overdue?: boolean; assigneeId?: string }) => void;
  onNavigateToAlerts: () => void;
}

export default function DashboardView({ onNavigateToTasks, onNavigateToAlerts }: DashboardViewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate max completion for trend chart height scaling
  const maxWeeklyCount = Math.max(1, ...stats.completionTrends.map((t) => t.count));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300 mb-2">
            <span>Portfolio Health & Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Real-time status, workload balancing, and completion trajectory across all client engagements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTasks()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 KPI Headline Cards (Goal 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tasks */}
        <div
          onClick={() => onNavigateToTasks()}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Tasks</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{stats.metrics.openTasks}</span>
            <span className="text-xs text-indigo-600 font-medium group-hover:underline">View tasks →</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across active projects</p>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={onNavigateToAlerts}
          className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-gradient-to-br from-white to-rose-50/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-rose-600">{stats.metrics.overdueTasks}</span>
            <span className="text-xs text-rose-600 font-medium group-hover:underline">View alerts →</span>
          </div>
          <p className="text-xs text-rose-500 mt-1">Requiring immediate attention</p>
        </div>

        {/* Due This Week */}
        <div
          onClick={() => onNavigateToTasks()}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Due This Week</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{stats.metrics.dueThisWeek}</span>
            <span className="text-xs text-slate-500">Upcoming deadlines</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Target delivery within 7 days</p>
        </div>

        {/* Completed This Week */}
        <div
          onClick={() => onNavigateToTasks({ status: 'Done' })}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed This Week</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-600">{stats.metrics.completedThisWeek}</span>
            <span className="text-xs text-emerald-600 font-medium">Shipped ✅</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Closed in current sprint</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Assignee Workload & Overload Breakdown (Goal 8: "who is overloaded") */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Team Workload & Capacity</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Overload Threshold: ≥4 open tasks</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Live capacity breakdown across all projects to identify blocked staff and prevent delivery bottlenecks.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Team Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">Open Tasks</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-right">Workload Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.assigneeBreakdown.map((member) => (
                    <tr
                      key={member.id}
                      onClick={() => onNavigateToTasks({ assigneeId: member.id })}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                      </td>
                      <td className="py-3 px-3 capitalize">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            member.role === 'manager'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {member.openTasks}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {member.overdueTasks > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {member.overdueTasks}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {member.completedTasks}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {member.isOverloaded ? (
                          <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            <Flame className="w-3 h-3 text-rose-500" />
                            <span>Overloaded</span>
                          </span>
                        ) : member.openTasks === 0 ? (
                          <span className="inline-flex items-center text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium text-[10px]">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium text-[10px]">
                            Balanced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Status Breakdown & 8-Week Completion Trajectory (Goal 8) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Task Status Distribution</h2>
            </div>

            <div className="space-y-3">
              {stats.statusBreakdown.map((item) => {
                const colors: Record<string, { bg: string; bar: string; text: string }> = {
                  Backlog: { bg: 'bg-slate-100', bar: 'bg-slate-500', text: 'text-slate-700' },
                  'In Progress': { bg: 'bg-blue-50', bar: 'bg-blue-600', text: 'text-blue-700' },
                  'In Review': { bg: 'bg-purple-50', bar: 'bg-purple-600', text: 'text-purple-700' },
                  Blocked: { bg: 'bg-rose-50', bar: 'bg-rose-600', text: 'text-rose-700' },
                  Done: { bg: 'bg-emerald-50', bar: 'bg-emerald-600', text: 'text-emerald-700' },
                };
                const c = colors[item.status] || colors.Backlog;
                const totalTasks = stats.metrics.openTasks + (stats.statusBreakdown.find((s) => s.status === 'Done')?.count || 0);
                const percent = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;

                return (
                  <div
                    key={item.status}
                    onClick={() => onNavigateToTasks({ status: item.status })}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className={c.text}>{item.status}</span>
                      <span className="text-slate-600 font-mono">
                        {item.count} tasks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.bar} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8-Week Completion Trajectory Chart (Goal 8) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">8-Week Completion Velocity</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Number of milestone tasks verified and moved to 'Done' over the last 8 weekly cycles.
            </p>

            {/* Custom SVG / HTML Bar Chart */}
            <div className="flex items-end justify-between h-40 pt-4 px-2 border-b border-slate-200">
              {stats.completionTrends.map((trend) => {
                const heightPercent = Math.max(12, Math.round((trend.count / maxWeeklyCount) * 100));
                return (
                  <div key={trend.weekLabel} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip / Value on top */}
                    <span className="text-[11px] font-bold text-slate-700 mb-1 group-hover:text-emerald-600">
                      {trend.count}
                    </span>
                    {/* Bar */}
                    <div className="w-6 sm:w-8 bg-slate-100 rounded-t-lg flex items-end overflow-hidden h-28">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    {/* Week Label */}
                    <span className="text-[10px] text-slate-400 mt-2 font-mono truncate max-w-[48px]">
                      {trend.weekLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
