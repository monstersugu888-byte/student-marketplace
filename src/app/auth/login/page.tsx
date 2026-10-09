'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    login(email, password);
    router.push('/');
  };

  const handleDemoLogin = () => {
    login('alex.rivera@campus.edu', 'demo1234');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-purple-900 via-slate-900 to-indigo-950 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight">
            Campus<span className="text-purple-300">Mate</span>
          </h1>
          <p className="text-xs text-purple-200">
            Sign in to access your student productivity portal
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-purple-200 mb-1">
              Campus Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-purple-200">Password</label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset email sent to student address.'); }} className="text-[11px] text-purple-300 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/15"></div>
          </div>
          <span className="relative px-3 text-[11px] font-semibold text-purple-300 bg-slate-900/50 rounded-full">
            OR DEMO ACCESS
          </span>
        </div>

        <button
          onClick={handleDemoLogin}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Quick Log In as Alex Rivera (Demo)</span>
        </button>

        <p className="text-center text-xs text-purple-200 pt-2">
          Don't have an account yet?{' '}
          <Link href="/auth/register" className="font-bold text-white hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
