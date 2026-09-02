'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  ShieldCheck,
  ChevronRight,
  Clock,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'manager',
    name: 'Alex Morgan',
    email: 'manager@company.com',
    desc: 'Portfolio Manager • All projects, team membership & task delete',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  {
    role: 'member',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    desc: 'Lead Engineer • Assigned to Fintech Payments & Global Logistics',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    role: 'member',
    name: 'David Kim',
    email: 'david@company.com',
    desc: 'Frontend Specialist • Assigned to Fintech Payments & Health Telemed',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'member',
    name: 'Elena Rostova',
    email: 'elena@company.com',
    desc: 'DevOps & QA Engineer • Assigned to Health Telemed & Global Logistics',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
];

export default function LoginView() {
  const { login, signup, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('manager@company.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'member' | 'manager'>('member');

  // Google modal states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState<'member' | 'manager'>('member');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        if (urlError === 'google_auth_cancelled') {
          setError('Google authentication was cancelled.');
        } else if (urlError === 'token_exchange_failed') {
          setError('Google token exchange failed. Check Authorized redirect URIs in Google Cloud Console.');
        } else {
          setError(`Google Sign-In notice: ${decodeURIComponent(urlError)}`);
        }
      }
    }
  }, []);

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

  // Google OAuth redirect or interactive email sign-up
  const handleGoogleSignUpRedirect = () => {
    window.location.href = `/api/auth/google?role=${role}`;
  };

  const handleGoogleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError('Please enter your Google account email');
      return;
    }
    setLoading(true);
    setError(null);

    const targetName = googleName.trim() || googleEmail.split('@')[0];
    const res = await googleLogin(googleEmail.trim(), targetName, googleRole);
    if (!res.success) {
      setError(res.error || 'Google Sign-Up failed');
      setLoading(false);
    } else {
      setIsGoogleModalOpen(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Professional Header / Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/70 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FolderKanban className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                PulseTrack
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
                Enterprise Portfolio
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Theme Toggle on Landing Page */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700/80 shadow-sm transition-all flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            <button
              onClick={() => {
                setIsSignUpMode(false);
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !isSignUpMode
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Assignment 01 • Project & Task Tracking System</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Multi-Client Portfolio & <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 dark:from-indigo-400 dark:via-purple-300 dark:to-emerald-400 bg-clip-text text-transparent">
                Task Lifecycle System
              </span>
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Designed for client services firms to eliminate missed deadlines, balance team capacity across engagements, enforce strict lifecycle transitions, and maintain immutable audit history.
            </p>

            {/* Evaluator Quick Notice Banner */}
            <div className="p-4 bg-white dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Reviewer Quick-Start (1-Click Demo Accounts)</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Click any role to test instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleDemoLogin(acc.email)}
                    disabled={loading}
                    className="text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 hover:bg-slate-100 dark:hover:bg-slate-950 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                          {acc.name}
                        </span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${acc.badge}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{acc.desc}</p>
                    </div>
                    <div className="mt-2 flex items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Sign in as {acc.name.split(' ')[0]}</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Key System Highlights Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center space-x-2.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Server-Enforced RBAC</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center space-x-2.5 shadow-sm">
                <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Strict State Machine</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center space-x-2.5 shadow-sm">
                <Clock className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Overdue Alerts & Resets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Glassmorphic Sign In / Sign Up Form (Cols 5) */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
              
              {/* Form Mode Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setError(null);
                  }}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                    !isSignUpMode
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
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
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isSignUpMode ? 'Sign Up for PulseTrack' : 'Sign In to Workspace'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isSignUpMode
                    ? 'Create a new account using Google or email credentials.'
                    : 'Enter your credentials or use the 1-click evaluator demo.'}
                </p>
              </div>

              {/* Google Sign-Up button inside Sign Up Mode */}
              {isSignUpMode && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignUpRedirect}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all flex items-center justify-center space-x-2.5 mb-4 group cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign Up with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider absolute">
                      Or Sign Up with Email
                    </span>
                  </div>
                </>
              )}

              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Input (Sign Up Only) */}
                {isSignUpMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Robert Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Role Selector (Sign Up Only) */}
                {isSignUpMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Role</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRole('member')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          role === 'member'
                            ? 'border-blue-500/80 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                            ? 'border-purple-500/80 bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

      {/* Google Account Selector & Cloud Configuration Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google OAuth Sign-Up</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Authenticate with Google Account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoogleCustomSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Google Account Email</label>
                <input
                  type="email"
                  placeholder="your.name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ritesh Singh"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('member')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      googleRole === 'member'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Member (Staff)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('manager')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      googleRole === 'manager'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                        : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Manager (Admin)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  {loading ? 'Authenticating...' : 'Sign Up with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PulseTrack — Professional Services Portfolio & Task Management System</span>
          <span>Assignment 01 • Built with Next.js 14, TypeScript, Tailwind, Prisma & PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
