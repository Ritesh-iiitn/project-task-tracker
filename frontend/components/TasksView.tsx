'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Filter,
  Plus,
  Download,
  CheckSquare,
  Square,
  Layers,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Tag,
  Kanban,
  List,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import TaskDetailModal from './TaskDetailModal';
import CreateTaskModal from './CreateTaskModal';
import BulkActionModal from './BulkActionModal';

interface TasksViewProps {
  initialProjectId?: string | null;
  initialStatus?: string | null;
  initialOverdue?: boolean;
  initialAssigneeId?: string | null;
}

export default function TasksView({
  initialProjectId,
  initialStatus,
  initialOverdue = false,
  initialAssigneeId,
}: TasksViewProps) {
  const { user } = useAuth();

  // Filter & Search states (Goal 6: Server-side search & filtering)
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [status, setStatus] = useState(initialStatus || 'all');
  const [priority, setPriority] = useState('all');
  const [assigneeId, setAssigneeId] = useState(initialAssigneeId || 'all');
  const [overdueOnly, setOverdueOnly] = useState(initialOverdue);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Data states
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter dropdown data
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // View mode: Table vs Kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Selection & Modals
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Fetch projects & users for filter options
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(console.error);

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error);
  }, []);

  // Fetch tasks on server whenever filters/pagination/sorting change
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (projectId) params.append('projectId', projectId);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      if (assigneeId !== 'all') params.append('assigneeId', assigneeId);
      if (overdueOnly) params.append('overdue', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, projectId, status, priority, assigneeId, overdueOnly, sortBy, sortOrder, page, limit]);

  // Handle Export CSV (Goal 7)
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (projectId) params.append('projectId', projectId);
    if (status !== 'all') params.append('status', status);
    if (priority !== 'all') params.append('priority', priority);
    if (assigneeId !== 'all') params.append('assigneeId', assigneeId);
    if (overdueOnly) params.append('overdue', 'true');

    window.open(`/api/tasks/export?${params.toString()}`, '_blank');
  };

  // Selection handlers for bulk actions
  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((tId) => tId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setProjectId('');
    setStatus('all');
    setPriority('all');
    setAssigneeId('all');
    setOverdueOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Portfolio Task Finder</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-medium">
              {total} matches
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-side search, filtering, lifecycle management, and bulk operations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          {/* Export CSV (Goal 7) */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* New Task Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Text Search Input (Goal 6) */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, description, key..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Row: Overdue Toggle, Sorting, Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-rose-600 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              <span className="flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Overdue Tasks Only</span>
              </span>
            </label>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sorting controls */}
            <div className="flex items-center space-x-1.5 text-slate-500">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="createdAt">Created Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {(search || projectId || status !== 'all' || priority !== 'all' || assigneeId !== 'all' || overdueOnly) && (
              <button
                onClick={clearFilters}
                className="text-indigo-600 hover:underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Select Bulk Actions Bar (Goal 7) */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-indigo-900 text-white rounded-2xl p-3 px-5 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedTaskIds.length} tasks selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Perform Bulk Action →
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-950 text-indigo-200 rounded-xl text-xs"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Tasks Match Filters</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try loosening your search query or reset filters.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Goal 6) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 w-8">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                      {selectedTaskIds.length === tasks.length && tasks.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Key</th>
                  <th className="py-3 px-3">Title & Project</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Assignees</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Blockers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done';
                  const isSelected = selectedTaskIds.includes(t.id);

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectTask(t.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Key */}
                      <td
                        className="py-3 px-3 font-mono font-bold text-indigo-600"
                        onClick={() => setActiveTaskId(t.id)}
                      >
                        {t.key}
                      </td>

                      {/* Title & Project */}
                      <td className="py-3 px-3" onClick={() => setActiveTaskId(t.id)}>
                        <div className="font-semibold text-slate-900 max-w-sm">{t.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span>{t.project.name}</span>
                          {t.project.isArchived && (
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded">Archived</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3" onClick={() => setActiveTaskId(t.id)}>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            t.status === 'Done'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'Blocked'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.status === 'In Review'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : t.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 capitalize font-medium" onClick={() => setActiveTaskId(t.id)}>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 font-semibold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td className="py-3 px-3" onClick={() => setActiveTaskId(t.id)}>
                        <div className="flex -space-x-1 overflow-hidden">
                          {t.assignees.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                          ) : (
                            t.assignees.map((a: any) => (
                              <div
                                key={a.id}
                                title={a.user.name}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center uppercase"
                              >
                                {a.user.name.charAt(0)}
                              </div>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 font-mono" onClick={() => setActiveTaskId(t.id)}>
                        {t.dueDate ? (
                          <div
                            className={`flex items-center space-x-1 ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                            <span>{format(new Date(t.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Blockers */}
                      <td className="py-3 px-3" onClick={() => setActiveTaskId(t.id)}>
                        {t.blockedBy.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.blockedBy.map((b: any) => (
                              <span
                                key={b.blockedBy.id}
                                className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  b.blockedBy.status === 'Done'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {b.blockedBy.key}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar (Goal 6) */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{tasks.length}</span> of{' '}
              <span className="font-semibold">{total}</span> total matches
            </div>

            <div className="flex items-center space-x-4">
              <span>
                Page <strong className="text-slate-900">{page}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>

              <div className="flex space-x-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW (Bonus Stretch) */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['Backlog', 'In Progress', 'In Review', 'Blocked', 'Done'].map((colStatus) => {
            const colTasks = tasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col h-[700px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    {colStatus}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 font-semibold border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colTasks.map((t) => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done';
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveTaskId(t.id)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {t.key}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded capitalize ${
                              t.priority === 'urgent' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-2">
                          {t.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-50">
                          <span>{t.project.name}</span>
                          {t.dueDate && (
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                              {format(new Date(t.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={activeTaskId}
        isOpen={!!activeTaskId}
        onClose={() => setActiveTaskId(null)}
        onTaskUpdated={fetchTasks}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTasks}
        defaultProjectId={projectId || null}
      />

      {/* Bulk Action Modal */}
      <BulkActionModal
        selectedTaskIds={selectedTaskIds}
        isOpen={isBulkOpen}
        onClose={() => {
          setIsBulkOpen(false);
          setSelectedTaskIds([]);
        }}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
