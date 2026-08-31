'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FolderKanban,
  Plus,
  Users,
  Archive,
  ArchiveRestore,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
} from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import ManageMembersModal from './ManageMembersModal';

interface ProjectWithStats {
  id: string;
  key: string;
  name: string;
  description: string | null;
  ownerId: string;
  isArchived: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  members: Array<{
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; role: string };
  }>;
  stats: {
    totalTasks: number;
    openTasks: number;
    doneTasks: number;
    overdueTasks: number;
  };
}

interface ProjectsViewProps {
  onSelectProject: (projectId: string) => void;
}

export default function ProjectsView({ onSelectProject }: ProjectsViewProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeMembersProject, setActiveMembersProject] = useState<ProjectWithStats | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects?includeArchived=${showArchived}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [showArchived, user]);

  const handleToggleArchive = async (projectId: string, currentArchived: boolean) => {
    if (
      !confirm(
        currentArchived
          ? 'Restore this project to active views?'
          : 'Archive this project? (It will be hidden from default views without deleting any data or tasks)'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentArchived }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2.5">
            <span>Client Projects Portfolio</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {projects.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage client retainers, configure team assignments, and track project completion.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
          </button>

          {/* Create Project Button (Manager Only) */}
          {user?.role === 'manager' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {showArchived
              ? 'There are no archived projects in the database.'
              : user?.role === 'manager'
              ? 'Create a new project using the button above to get started.'
              : 'You have not been added to any active project yet. Ask a manager to assign you.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                project.isArchived
                  ? 'border-slate-300 dark:border-slate-800 opacity-75 bg-slate-50/60 dark:bg-slate-900/40'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500'
              }`}
            >
              <div className="p-5">
                {/* Top Row: Key Badge + Archive status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {project.key}
                    </span>
                    {project.isArchived && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Archived
                      </span>
                    )}
                  </div>

                  {user?.role === 'manager' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setActiveMembersProject(project)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Manage Project Team"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(project.id, project.isArchived)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={project.isArchived ? 'Restore Project' : 'Archive Project'}
                      >
                        {project.isArchived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Project Title & Description */}
                <h3
                  onClick={() => onSelectProject(project.id)}
                  className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Open</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{project.stats.openTasks}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">Overdue</div>
                    <div className={`text-sm font-bold ${project.stats.overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}`}>
                      {project.stats.overdueTasks}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Done</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{project.stats.doneTasks}</div>
                  </div>
                </div>

                {/* Team Members Chips */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.members.length} members</span>
                  </div>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.members.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        title={m.user.name}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-indigo-500 to-slate-700 text-white text-[10px] font-bold flex items-center justify-center uppercase shadow-sm"
                      >
                        {m.user.name.charAt(0)}
                      </div>
                    ))}
                    {project.members.length > 4 && (
                      <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View Tasks Footer Action */}
              <div
                onClick={() => onSelectProject(project.id)}
                className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer group"
              >
                <span>Explore Project Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchProjects}
      />

      {/* Manage Members Modal */}
      <ManageMembersModal
        project={activeMembersProject}
        isOpen={!!activeMembersProject}
        onClose={() => setActiveMembersProject(null)}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
