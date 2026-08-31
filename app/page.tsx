'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import ProjectsView from '@/components/ProjectsView';
import TasksView from '@/components/TasksView';
import MyTasksView from '@/components/MyTasksView';
import AlertsView from '@/components/AlertsView';
import LoginView from '@/components/LoginView';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts'>('dashboard');

  // Drill-down states from dashboard or project clicks
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string | null>(null);
  const [taskFilterOverdue, setTaskFilterOverdue] = useState<boolean>(false);
  const [taskFilterAssigneeId, setTaskFilterAssigneeId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleNavigateToTasks = (filters?: {
    status?: string;
    overdue?: boolean;
    assigneeId?: string;
  }) => {
    setSelectedProjectId(null);
    setTaskFilterStatus(filters?.status || null);
    setTaskFilterOverdue(filters?.overdue || false);
    setTaskFilterAssigneeId(filters?.assigneeId || null);
    setActiveTab('tasks');
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setTaskFilterStatus(null);
    setTaskFilterOverdue(false);
    setTaskFilterAssigneeId(null);
    setActiveTab('tasks');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar with live badge and role switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateToTasks={handleNavigateToTasks}
            onNavigateToAlerts={() => setActiveTab('alerts')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView onSelectProject={handleSelectProject} />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            key={`${selectedProjectId}-${taskFilterStatus}-${taskFilterOverdue}-${taskFilterAssigneeId}`}
            initialProjectId={selectedProjectId}
            initialStatus={taskFilterStatus}
            initialOverdue={taskFilterOverdue}
            initialAssigneeId={taskFilterAssigneeId}
          />
        )}

        {activeTab === 'my-tasks' && <MyTasksView />}

        {activeTab === 'alerts' && <AlertsView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PulseTrack Services Portfolio & Task Lifecycle System</span>
          <span className="text-[11px] text-slate-400">
            Assignment 01 • Built with Next.js, TypeScript, Tailwind, Prisma & SQLite
          </span>
        </div>
      </footer>
    </div>
  );
}
