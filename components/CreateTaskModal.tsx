'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string | null;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}: CreateTaskModalProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's accessible projects
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSelectedAssignees([]);
      setSelectedBlockers([]);

      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          const projs = data.projects || [];
          setProjects(projs);
          if (defaultProjectId) {
            setProjectId(defaultProjectId);
          } else if (projs.length > 0 && !projectId) {
            setProjectId(projs[0].id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, defaultProjectId]);

  // When project changes, fetch its members and tasks for assignment and blockers
  useEffect(() => {
    if (projectId) {
      // Find project in projects list
      const proj = projects.find((p) => p.id === projectId);
      if (proj && proj.members) {
        setProjectMembers(proj.members);
      } else {
        fetch(`/api/projects/${projectId}/members`)
          .then((res) => res.json())
          .then((data) => setProjectMembers(data.members || []))
          .catch((err) => console.error(err));
      }

      // Fetch tasks in this project for blockers
      fetch(`/api/tasks?projectId=${projectId}&limit=100`)
        .then((res) => res.json())
        .then((data) => setProjectTasks(data.tasks || []))
        .catch((err) => console.error(err));
    }
  }, [projectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) {
      setError('Project and Task Title are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
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
        setError(data.error || 'Failed to create task.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
              <p className="text-xs text-slate-500">Add work item to project backlog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setSelectedAssignees([]);
                setSelectedBlockers([]);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement payment callback handler"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Detailed acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Assignees (Filtered to project members) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignees (Project Members Only)
            </label>
            <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 bg-slate-50/50">
              {projectMembers.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">Select a project first</span>
              ) : (
                projectMembers.map((m: any) => (
                  <label
                    key={m.userId}
                    className="flex items-center space-x-2 py-1 px-1.5 hover:bg-slate-100/70 rounded cursor-pointer text-xs"
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
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-slate-800 font-medium">{m.user.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Blocker Dependencies */}
          {projectTasks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blocking Tasks (in this project)
              </label>
              <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 bg-slate-50/50">
                {projectTasks.map((t: any) => (
                  <label
                    key={t.id}
                    className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-100/70 rounded cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedBlockers.includes(t.id)}
                        onChange={() => {
                          if (selectedBlockers.includes(t.id)) {
                            setSelectedBlockers(selectedBlockers.filter((id) => id !== t.id));
                          } else {
                            setSelectedBlockers([...selectedBlockers, t.id]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono font-bold text-slate-700 text-[11px]">{t.key}</span>
                      <span className="truncate max-w-[150px] text-slate-600">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{t.status}</span>
                  </label>
                ))}
              </div>
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
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
