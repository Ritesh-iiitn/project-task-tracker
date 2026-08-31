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
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'manager',
    name: 'Alex Morgan',
    email: 'manager@company.com',
    desc: 'Portfolio Manager (All projects, team membership, task delete)',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    role: 'member',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    desc: 'Senior Backend Engineer (Assigned to Fintech & Logistics)',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    role: 'member',
    name: 'David Kim',
    email: 'david@company.com',
    desc: 'Frontend Specialist (Assigned to Fintech & Health)',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'member',
    name: 'Elena Rostova',
    email: 'elena@company.com',
    desc: 'DevOps & QA Engineer (Assigned to Health & Logistics)',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
          <FolderKanban className="w-6 h-6 text-white font-bold" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">PulseTrack</h2>
        <p className="mt-2 text-xs text-slate-400 max-w-xs mx-auto">
          Multi-client project tracking, strict task lifecycles, and portfolio capacity management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 space-y-6">
        {/* 1-Click Fast Demo Logins */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Select Demo Role to Sign In (1-Click)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleDemoLogin(acc.email)}
                disabled={loading}
                className="text-left p-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-indigo-500 hover:bg-slate-900 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white group-hover:text-indigo-300">
                      {acc.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${acc.badge}`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{acc.desc}</p>
                </div>
                <div className="mt-2 flex items-center text-[10px] text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Sign in as {acc.name.split(' ')[0]} →</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Form Card with Sign In / Sign Up Tabs */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => {
                setIsSignUpMode(false);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                !isSignUpMode
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                setIsSignUpMode(true);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                isSignUpMode
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up (Create Account)</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input (Sign Up Only) */}
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Role Selector (Sign Up Only) */}
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      role === 'member'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Member (Staff)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      role === 'manager'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isSignUpMode ? 'Create Account & Sign In' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
