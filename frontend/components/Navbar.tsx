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
  Layers,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'projects' | 'tasks' | 'my-tasks' | 'alerts') => void;
  selectedProjectId?: string | null;
  setSelectedProjectId?: (id: string | null) => void;
}

const DEMO_USERS = [
  {
    email: 'manager@company.com',
    name: 'Alex Morgan',
    role: 'manager',
    title: 'Portfolio Manager',
    desc: 'Full access: create/archive projects, edit team, delete tasks',
  },
  {
    email: 'sarah@company.com',
    name: 'Sarah Chen',
    role: 'member',
    title: 'Lead Engineer',
    desc: 'Assigned to: Fintech Payments & Global Logistics',
  },
  {
    email: 'david@company.com',
    name: 'David Kim',
    role: 'member',
    title: 'Frontend Developer',
    desc: 'Assigned to: Fintech Payments & Health Telemed',
  },
  {
    email: 'elena@company.com',
    name: 'Elena Rostova',
    role: 'member',
    title: 'DevOps & QA Engineer',
    desc: 'Assigned to: Health Telemed & Global Logistics',
  },
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  PulseTrack
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Portfolio Hub
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Services & Task Tracker</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('projects')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => handleTabClick('tasks')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>All Tasks</span>
            </button>

            <button
              onClick={() => handleTabClick('my-tasks')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my-tasks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Tasks</span>
            </button>

            <button
              onClick={() => handleTabClick('alerts')}
              className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Overdue Alerts</span>
              {alertCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold text-white bg-rose-500 rounded-full animate-pulse shadow-sm">
                  {alertCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center space-x-3">
            {/* Fast Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-700 hover:to-slate-750 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-100 shadow-sm transition-all"
                title="Switch demo account"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Switch Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Demo Role Switcher</span>
                    <span className="text-amber-400 font-normal">1-Click Sign In</span>
                  </div>
                  <div className="p-1 space-y-1">
                    {DEMO_USERS.map((u) => {
                      const isCurrent = user?.email === u.email;
                      return (
                        <button
                          key={u.email}
                          onClick={() => {
                            switchUser(u.email);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start space-x-2.5 transition-colors ${
                            isCurrent
                              ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          {u.role === 'manager' ? (
                            <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-300 mt-0.5 flex-shrink-0">
                              <Shield className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-300 mt-0.5 flex-shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold flex items-center justify-between">
                              <span className="text-white">{u.name}</span>
                              <span
                                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono ${
                                  u.role === 'manager'
                                    ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                                    : 'bg-blue-900/80 text-blue-200 border border-blue-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{u.title}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{u.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Active User Badge & Logout */}
            <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-800">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{user?.name?.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400 font-medium capitalize flex items-center justify-end">
                  {user?.role === 'manager' ? (
                    <span className="text-purple-300 font-semibold flex items-center">
                      <Shield className="w-3 h-3 mr-0.5 inline text-purple-400" /> Manager
                    </span>
                  ) : (
                    <span className="text-blue-300 font-semibold flex items-center">
                      <UserIcon className="w-3 h-3 mr-0.5 inline text-blue-400" /> Member
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
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
