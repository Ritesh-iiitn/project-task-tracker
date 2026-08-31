'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Send,
  User,
  Shield,
  History,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const { user, refreshAlerts } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [legalTransitions, setLegalTransitions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);
  const [availableProjectTasks, setAvailableProjectTasks] = useState<any[]>([]);

  const fetchTask = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setErrorBanner(null);
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Failed to load task.');
        return;
      }

      const t = data.task;
      setTask(t);
      setLegalTransitions(data.legalTransitions || []);
      setTitle(t.title);
      setDescription(t.description || '');
      setPriority(t.priority);
      setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
      setSelectedAssignees(t.assignees.map((a: any) => a.userId));
      setSelectedBlockers(t.blockedBy.map((b: any) => b.blockedById));

      // Fetch other tasks in the same project for blocker selector
      if (t.projectId) {
        const projTasksRes = await fetch(`/api/tasks?projectId=${t.projectId}&limit=100`);
        if (projTasksRes.ok) {
          const pData = await projTasksRes.json();
          setAvailableProjectTasks((pData.tasks || []).filter((pt: any) => pt.id !== t.id));
        }
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error loading task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask();
    }
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  // Handle Status Transition
  const handleTransition = async (targetStatus: string) => {
    setActionLoading(true);
    setErrorBanner(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Goal 4: Show clear explanation why transition was rejected!
        setErrorBanner(data.error || 'Failed to transition task status.');
        return;
      }

      fetchTask();
      onTaskUpdated();
      refreshAlerts();
    } catch (err: any) {
      setErrorBanner(err.message || 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Field Save (Title, Description, Priority, DueDate, Assignees, Blockers)
  const handleSaveChanges = async () => {
    setActionLoading(true);
    setErrorBanner(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate || null,
          assigneeIds: selectedAssignees,
          blockedByIds: selectedBlockers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Failed to save changes.');
        return;
      }

      fetchTask();
      onTaskUpdated();
      refreshAlerts();
    } catch (err: any) {
      setErrorBanner(err.message || 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Comment (Goal 9: Immutable audit timeline)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      if (res.ok) {
        setCommentText('');
        fetchTask();
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manager-Only Task Delete (Goal 1 & 3)
  const handleDeleteTask = async () => {
    if (!confirm(`Are you sure you want to permanently delete task ${task.key}?`)) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        onTaskUpdated();
        refreshAlerts();
        onClose();
      } else {
        const data = await res.json();
        setErrorBanner(data.error || 'Failed to delete task.');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Network error.');
    }
  };

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const unfinishedBlockers = (task?.blockedBy || []).filter((b: any) => b.blockedBy.status !== 'Done');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs sm:text-sm font-extrabold px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-sm">
              {task?.key || '...'}
            </span>
            <div className="text-xs text-slate-500 font-medium">
              Project: <strong className="text-slate-900 font-bold">{task?.project?.name}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {user?.role === 'manager' && (
              <button
                onClick={handleDeleteTask}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Delete task (Manager only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Banner / Rejection Explanation (Goal 4) */}
        {errorBanner && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lifecycle Rule Rejection:</span>
              <div className="mt-0.5 text-rose-700 font-medium">{errorBanner}</div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        {loading || !task ? (
          <div className="flex items-center justify-center py-28">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Column: Title, Description, Transitions, Timeline (Cols 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Requirements</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add detailed task notes..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Status Transition Control (Goal 4: Strict state machine) */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Current Phase:{' '}
                    <span className="text-indigo-700 font-extrabold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                      {task.status}
                    </span>
                  </span>
                  {task.previousStatus && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      (Blocked from: {task.previousStatus})
                    </span>
                  )}
                </div>

                {/* Blocker warning if any */}
                {unfinishedBlockers.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>
                      Blocked by: <strong>{unfinishedBlockers.map((b: any) => b.blockedBy.key).join(', ')}</strong> (Must be Done first)
                    </span>
                  </div>
                )}

                {/* Legal Action Buttons */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-2">Legal Next Moves (Server-Validated):</div>
                  <div className="flex flex-wrap gap-2">
                    {legalTransitions.map((target) => (
                      <button
                        key={target}
                        onClick={() => handleTransition(target)}
                        disabled={actionLoading}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 hover:scale-[1.02] ${
                          target === 'Done'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : target === 'Blocked'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        <span>Move to {target}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ))}

                    {legalTransitions.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No further moves available.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Immutable Timeline & Comment Feed (Goal 9) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Immutable Audit Timeline & Comments
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Append-only • Cannot be edited</span>
                </div>

                {/* Add Comment Box */}
                <form onSubmit={handleAddComment} className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    placeholder="Write a comment (permanently recorded)..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>

                {/* Timeline Items */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {task.activities?.map((act: any) => (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl text-xs flex items-start space-x-2.5"
                    >
                      <div className="mt-0.5">
                        {act.type === 'comment' ? (
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        ) : act.type === 'status_change' ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        ) : act.type === 'unassignment' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <History className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {act.user ? act.user.name : 'System'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {format(new Date(act.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          {act.type === 'created' && 'Created this task.'}
                          {act.type === 'comment' && act.comment}
                          {act.type === 'status_change' && (
                            <span>
                              Changed status from{' '}
                              <span className="font-mono font-medium bg-slate-200/60 px-1 py-0.2 rounded">{act.oldValue}</span> to{' '}
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">{act.newValue}</span>
                            </span>
                          )}
                          {act.type === 'assignment' && `Assigned to ${act.newValue}.`}
                          {act.type === 'unassignment' && (
                            <span>
                              Unassigned {act.oldValue}. {act.comment && `(${act.comment})`}
                            </span>
                          )}
                          {act.type === 'dependency_add' && `Added blocker dependency: ${act.newValue}.`}
                          {act.type === 'dependency_remove' && `Removed blocker dependency: ${act.oldValue}.`}
                          {act.type === 'field_change' && (
                            <span>
                              Updated {act.field} from '{act.oldValue}' to '{act.newValue}'.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Meta fields & Blockers (Cols 5) */}
            <div className="lg:col-span-5 space-y-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Deadline {isOverdue && <span className="text-rose-600 font-bold">(Overdue!)</span>}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    isOverdue ? 'border-rose-400 bg-rose-50/40 text-rose-800 font-bold' : 'border-slate-300'
                  }`}
                />
              </div>

              {/* Assignees (Goal 5: Only project members can be assigned) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignees (Project Members Only)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 bg-white rounded-xl p-2.5 divide-y divide-slate-100 shadow-inner">
                  {task?.project?.members?.map((m: any) => (
                    <label
                      key={m.userId}
                      className="flex items-center space-x-2.5 py-1.5 px-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(m.userId)}
                        onChange={() => {
                          if (selectedAssignees.includes(m.userId)) {
                            setSelectedAssignees(selectedAssignees.filter((id) => id !== m.userId));
                          } else {
                            setSelectedAssignees([...selectedAssignees, m.userId]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-slate-800 font-medium">{m.user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Blocked By Tasks (Goal 3 & 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blocking Dependencies (In Same Project)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 bg-white rounded-xl p-2.5 divide-y divide-slate-100 shadow-inner">
                  {availableProjectTasks.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic p-1">No other tasks in this project.</span>
                  ) : (
                    availableProjectTasks.map((pt: any) => (
                      <label
                        key={pt.id}
                        className="flex items-center justify-between py-1.5 px-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlockers.includes(pt.id)}
                            onChange={() => {
                              if (selectedBlockers.includes(pt.id)) {
                                setSelectedBlockers(selectedBlockers.filter((id) => id !== pt.id));
                              } else {
                                setSelectedBlockers([...selectedBlockers, pt.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="font-mono text-[11px] font-extrabold text-indigo-700">{pt.key}</span>
                          <span className="truncate max-w-[120px] text-slate-700 font-medium">{pt.title}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            pt.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pt.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Save Meta Changes Button */}
              <button
                onClick={handleSaveChanges}
                disabled={actionLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
