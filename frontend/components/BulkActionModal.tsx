'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface BulkResult {
  taskId: string;
  key: string;
  title: string;
  success: boolean;
  reason?: string;
}

interface BulkActionModalProps {
  selectedTaskIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkActionModal({
  selectedTaskIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkActionModalProps) {
  const [actionType, setActionType] = useState<'status' | 'assignee' | 'dueDate'>('status');
  const [status, setStatus] = useState('In Progress');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; successCount: number; failureCount: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setSummary(null);
      setActionType('status');
      setStatus('In Progress');
      setAssigneeId('');
      setDueDate('');

      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.users) setUsers(data.users);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen || selectedTaskIds.length === 0) return null;

  const handleExecute = async () => {
    setLoading(true);
    setResults(null);
    setSummary(null);

    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: selectedTaskIds,
          action: actionType,
          status: actionType === 'status' ? status : undefined,
          assigneeId: actionType === 'assignee' ? assigneeId : undefined,
          dueDate: actionType === 'dueDate' ? dueDate || null : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
        setSummary({
          total: data.total,
          successCount: data.successCount,
          failureCount: data.failureCount,
        });
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bulk Update Selected Tasks</h3>
              <p className="text-xs text-slate-500">
                Operating on <strong>{selectedTaskIds.length}</strong> selected tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If results returned, display Goal 7 report breakdown */}
        {results ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Bulk Operation Execution Report
                </h4>
                <div className="flex items-center space-x-3 mt-1 text-xs">
                  <span className="text-emerald-700 font-semibold">
                    ✓ {summary?.successCount} Succeeded
                  </span>
                  <span className="text-rose-700 font-semibold">
                    ✕ {summary?.failureCount} Rejected
                  </span>
                </div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {results.map((r) => (
                <div
                  key={r.taskId}
                  className={`p-3 rounded-xl border text-xs ${
                    r.success
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{r.key}</span>
                      <span>-</span>
                      <span className="truncate max-w-[260px]">{r.title}</span>
                    </div>
                    <span>{r.success ? 'Success' : 'Rejected'}</span>
                  </div>
                  {!r.success && r.reason && (
                    <div className="mt-1 text-[11px] text-rose-700 font-medium">
                      Reason: {r.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form to configure and trigger bulk action */
          <div className="mt-4 space-y-4">
            {/* Action Type Selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActionType('status')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  actionType === 'status' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Change Status
              </button>
              <button
                type="button"
                onClick={() => setActionType('assignee')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  actionType === 'assignee' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assign User
              </button>
              <button
                type="button"
                onClick={() => setActionType('dueDate')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  actionType === 'dueDate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Set Due Date
              </button>
            </div>

            {/* Action Inputs */}
            {actionType === 'status' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Done">Done</option>
                  <option value="Blocked">Blocked</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Note: The server will validate each task's lifecycle rules individually. Illegal jumps or unfinished blocker violations will be reported.
                </p>
              </div>
            )}

            {actionType === 'assignee' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Staff Member
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select team member...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Note: Will succeed for tasks where this user is an authorized project member, and reject for others.
                </p>
              </div>
            )}

            {actionType === 'dueDate' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Note: Updating due dates will automatically reset any previous alert dismissals so overdue alerts reappear when applicable.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={loading || (actionType === 'assignee' && !assigneeId)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Executing Batch...' : `Apply to ${selectedTaskIds.length} Tasks`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
