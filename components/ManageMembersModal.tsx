'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, AlertCircle, ShieldAlert } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  key: string;
  ownerId: string;
}

interface Member {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ManageMembersModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageMembersModal({
  project,
  isOpen,
  onClose,
  onSuccess,
}: ManageMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      setError(null);
      setSuccessMsg(null);
      setSelectedUserId('');
      fetchMembers();
      fetchAllUsers();
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const currentMemberUserIds = new Set(members.map((m) => m.userId));
  const availableUsersToAdd = allUsers.filter((u) => !currentMemberUserIds.has(u.id));

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member.');
        return;
      }
      setSelectedUserId('');
      setSuccessMsg('Member added successfully.');
      fetchMembers();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (userId === project.ownerId) {
      setError('Cannot remove the project owner.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${userName}? They will be automatically unassigned from all tasks in this project.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member.');
        return;
      }
      setSuccessMsg(data.message || `${userName} was removed and unassigned from all tasks.`);
      fetchMembers();
      onSuccess();
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Project Team Members</h3>
              <p className="text-xs text-slate-500">{project.name} ({project.key})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Goal 5 Rule Alert */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Assignment Rule:</span> Removing a member immediately unassigns them from all project tasks and logs an immutable audit event.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Add Member Form */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Add Team Member
          </label>
          <div className="flex space-x-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select staff member...</option>
              {availableUsersToAdd.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) - {u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={!selectedUserId || loading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Current Members List */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Current Members ({members.length})
          </h4>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                    <span>{m.user.name}</span>
                    {m.userId === project.ownerId && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{m.user.email}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                    {m.user.role}
                  </span>
                  {m.userId !== project.ownerId && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.user.name)}
                      disabled={loading}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
