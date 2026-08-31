'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  UserCheck,
  AlertTriangle,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts') => void;
  selectedProjectId?: string | null;
  setSelectedProjectId?: (id: string | null) => void;
}

const DEMO_USERS = [
  { email: 'manager@company.com', name: 'Alex Morgan', role: 'manager', desc: 'Full manager permissions' },
  { email: 'sarah@company.com', name: 'Sarah Chen', role: 'member', desc: 'Member (Apex, Orbit)' },
  { email: 'david@company.com', name: 'David Kim', role: 'member', desc: 'Member (Apex, Nova)' },
  { email: 'elena@company.com', name: 'Elena Rostova', role: 'member', desc: 'Member (Nova, Orbit)' },
];

export default function Navbar({ activeTab, setActiveTab, setSelectedProjectId }: NavbarProps) {
  const { user, logout, switchUser, alertCount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleTabClick = (tab: 'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts') => {
    if (tab !== 'tasks' && setSelectedProjectId) {
      setSelectedProjectId(null);
    }
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-lg flex items-center justify-center shadow-md">
              <FolderKanban className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                PulseTrack
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Services Portfolio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('projects')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => handleTabClick('tasks')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>All Tasks</span>
            </button>

            <button
              onClick={() => handleTabClick('my-tasks')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Tasks</span>
            </button>

            <button
              onClick={() => handleTabClick('alerts')}
              className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Overdue Alerts</span>
              {alertCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-600 rounded-full animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center space-x-4">
            {/* Fast Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 transition-colors"
                title="Switch demo account"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">Switch Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Instant Demo Switcher
                  </div>
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => {
                        switchUser(u.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-start space-x-2 transition-colors ${
                        user?.email === u.email ? 'bg-indigo-950/50 text-indigo-300' : 'text-slate-300'
                      }`}
                    >
                      {u.role === 'manager' ? (
                        <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium flex items-center space-x-1.5">
                          <span>{u.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              u.role === 'manager'
                                ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                                : 'bg-blue-900/60 text-blue-200 border border-blue-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{u.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active User Badge & Logout */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                <span className="text-[10px] text-slate-400 capitalize flex items-center justify-end space-x-1">
                  {user?.role === 'manager' ? (
                    <span className="text-purple-400 font-medium flex items-center">
                      <Shield className="w-3 h-3 mr-0.5 inline" /> Manager
                    </span>
                  ) : (
                    <span className="text-blue-400 font-medium flex items-center">
                      <UserIcon className="w-3 h-3 mr-0.5 inline" /> Member
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
