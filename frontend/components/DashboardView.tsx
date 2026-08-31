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
  ShieldCheck,
  Zap,
  BarChart3,
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
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <span className="text-xs font-semibold text-slate-500">Loading Portfolio Analytics...</span>
      </div>
    );
  }

  const maxWeeklyCount = Math.max(1, ...stats.completionTrends.map((t) => t.count));
  const totalTasks = stats.metrics.openTasks + (stats.statusBreakdown.find((s) => s.status === 'Done')?.count || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Executive Portfolio Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Client Services Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time delivery health, team capacity balance, and 8-week completion trajectory across all active client projects.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigateToTasks()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 group hover:scale-[1.02]"
          >
            <span>Explore All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 4 KPI Headline Cards (Goal 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Open Tasks */}
        <div
          onClick={() => onNavigateToTasks()}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-indigo-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Tasks</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.metrics.openTasks}</span>
            <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center">
              View list →
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Across active engagements</p>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={onNavigateToAlerts}
          className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-white to-rose-50/50 hover:border-rose-400 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 tracking-tight">{stats.metrics.overdueTasks}</span>
            <span className="text-xs font-bold text-rose-600 group-hover:underline flex items-center">
              View alerts →
            </span>
          </div>
          <p className="text-[11px] text-rose-500 mt-1 font-medium">Needs immediate resolution</p>
        </div>

        {/* Due This Week */}
        <div
          onClick={() => onNavigateToTasks()}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-amber-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Due This Week</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.metrics.dueThisWeek}</span>
            <span className="text-xs font-semibold text-slate-500">Target Delivery</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Upcoming 7-day deadlines</p>
        </div>

        {/* Completed This Week */}
        <div
          onClick={() => onNavigateToTasks({ status: 'Done' })}
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed This Week</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">{stats.metrics.completedThisWeek}</span>
            <span className="text-xs font-bold text-emerald-600">Shipped 🎉</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Delivered to clients</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Team Capacity & Workload Balance (Goal 8: "who is overloaded") */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Team Capacity & Workload Balance</h2>
                  <p className="text-xs text-slate-500">Live capacity analysis to identify overloaded staff and balance client assignments.</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mt-5">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3.5 rounded-l-xl">Team Member</th>
                    <th className="py-3 px-3.5 text-center">Role</th>
                    <th className="py-3 px-3.5 text-center">Open Tasks</th>
                    <th className="py-3 px-3.5 text-center">Overdue</th>
                    <th className="py-3 px-3.5 text-center">Completed</th>
                    <th className="py-3 px-3.5 text-right rounded-r-xl">Capacity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.assigneeBreakdown.map((member) => (
                    <tr
                      key={member.id}
                      onClick={() => onNavigateToTasks({ assigneeId: member.id })}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-slate-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {member.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 text-center capitalize">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            member.role === 'manager'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-bold text-slate-900">
                        {member.openTasks}
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-bold">
                        {member.overdueTasks > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-extrabold">
                            {member.overdueTasks}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-center text-slate-600 font-medium">
                        {member.completedTasks}
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        {member.isOverloaded ? (
                          <span className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            <span>Overloaded</span>
                          </span>
                        ) : member.openTasks === 0 ? (
                          <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium text-[10px]">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
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
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Task Status Distribution</h2>
                <p className="text-xs text-slate-500">Breakdown of all {totalTasks} work items across lifecycle phases.</p>
              </div>
            </div>

            <div className="space-y-3 mt-5">
              {stats.statusBreakdown.map((item) => {
                const colors: Record<string, { bg: string; bar: string; text: string; badge: string }> = {
                  Backlog: { bg: 'bg-slate-100', bar: 'bg-slate-500', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-700' },
                  'In Progress': { bg: 'bg-blue-50', bar: 'bg-blue-600', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
                  'In Review': { bg: 'bg-purple-50', bar: 'bg-purple-600', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
                  Blocked: { bg: 'bg-rose-50', bar: 'bg-rose-600', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800' },
                  Done: { bg: 'bg-emerald-50', bar: 'bg-emerald-600', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
                };
                const c = colors[item.status] || colors.Backlog;
                const percent = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;

                return (
                  <div
                    key={item.status}
                    onClick={() => onNavigateToTasks({ status: item.status })}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group bg-slate-50/40 hover:bg-white"
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.bar}`}></span>
                        <span className={c.text}>{item.status}</span>
                      </div>
                      <span className="text-slate-600 font-mono">
                        {item.count} tasks <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.bar} transition-all duration-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8-Week Completion Trajectory Velocity Chart (Goal 8) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">8-Week Completion Velocity</h2>
                <p className="text-xs text-slate-500">Verified tasks moved to 'Done' over the last 8 weekly sprint cycles.</p>
              </div>
            </div>

            {/* Custom SVG / HTML Bar Chart */}
            <div className="flex items-end justify-between h-44 pt-6 px-2 border-b border-slate-200 mt-4">
              {stats.completionTrends.map((trend) => {
                const heightPercent = Math.max(14, Math.round((trend.count / maxWeeklyCount) * 100));
                return (
                  <div key={trend.weekLabel} className="flex flex-col items-center flex-1 group">
                    <span className="text-[11px] font-black text-slate-700 mb-1.5 group-hover:text-emerald-600 group-hover:scale-110 transition-transform">
                      {trend.count}
                    </span>
                    <div className="w-7 sm:w-9 bg-slate-100 rounded-t-xl flex items-end overflow-hidden h-28 shadow-inner">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 rounded-t-xl group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 font-mono font-medium truncate max-w-[50px]">
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
