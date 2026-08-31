'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FolderKanban,
  Shield,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
  Zap,
  Layers,
  FileText,
  ShieldCheck,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'manager',
    name: 'Alex Morgan',
    email: 'manager@company.com',
    desc: 'Portfolio Manager • All projects, team membership & task delete',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    role: 'member',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    desc: 'Lead Engineer • Assigned to Fintech Payments & Global Logistics',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    role: 'member',
    name: 'David Kim',
    email: 'david@company.com',
    desc: 'Frontend Specialist • Assigned to Fintech Payments & Health Telemed',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'member',
    name: 'Elena Rostova',
    email: 'elena@company.com',
    desc: 'DevOps & QA Engineer • Assigned to Health Telemed & Global Logistics',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

export default function LoginView() {
  const { login, signup } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('manager@company.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'member' | 'manager'>('member');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUpMode) {
      if (!name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await signup(name.trim(), email.trim(), password, role);
      if (!res.success) {
        setError(res.error || 'Signup failed');
        setLoading(false);
      }
    } else {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Invalid email or password');
        setLoading(false);
      }
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);
    const res = await login(demoEmail, 'password123');
    if (!res.success) {
      setError(res.error || 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Professional Header / Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/70 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FolderKanban className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                PulseTrack
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Enterprise Portfolio
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsSignUpMode(false);
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !isSignUpMode
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUpMode(true);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSignUpMode
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Landing & Authentication Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Hero Showcase & Interviewer Quick-Start Dock (Cols 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Assignment 01 • Project & Task Tracking System</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Multi-Client Portfolio & <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                Task Lifecycle System
              </span>
            </h1>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Designed for client services firms to eliminate missed deadlines, balance team capacity across engagements, enforce strict lifecycle transitions, and maintain immutable audit history.
            </p>

            {/* Evaluator Quick Notice Banner */}
            <div className="p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Reviewer Quick-Start (1-Click Demo Accounts)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Click any role to test instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleDemoLogin(acc.email)}
                    disabled={loading}
                    className="text-left p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-950 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-100 group-hover:text-indigo-300">
                          {acc.name}
                        </span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${acc.badge}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{acc.desc}</p>
                    </div>
                    <div className="mt-2 flex items-center text-[10px] text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Sign in as {acc.name.split(' ')[0]}</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Key System Highlights Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 font-semibold">Server-Enforced RBAC</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center space-x-2.5">
                <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-slate-300 font-semibold">Strict State Machine</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-slate-300 font-semibold">Overdue Alerts & Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Glassmorphic Sign In / Sign Up Form (Cols 5) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
              
              {/* Form Mode Tabs */}
              <div className="flex border-b border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setError(null);
                  }}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                    !isSignUpMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setError(null);
                    setEmail('');
                    setPassword('');
                  }}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                    isSignUpMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-bold text-white">
                  {isSignUpMode ? 'Create New Staff Account' : 'Sign In to Workspace'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSignUpMode
                    ? 'Register a new account as a Manager or Member.'
                    : 'Enter your credentials or use the evaluator demo buttons.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Input (Sign Up Only) */}
                {isSignUpMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Robert Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Role Selector (Sign Up Only) */}
                {isSignUpMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Select Role</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRole('member')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          role === 'member'
                            ? 'border-blue-500/80 bg-blue-500/20 text-blue-300'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Member (Staff)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('manager')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          role === 'manager'
                            ? 'border-purple-500/80 bg-purple-500/20 text-purple-300'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Manager (Admin)</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Authenticating...' : isSignUpMode ? 'Register Account & Sign In' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PulseTrack — Professional Services Portfolio & Task Management System</span>
          <span>Assignment 01 • Built with Next.js 14, TypeScript, Tailwind, Prisma & PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
