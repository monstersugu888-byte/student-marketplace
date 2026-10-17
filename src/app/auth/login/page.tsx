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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    const ok = await login(email, password);
    if (!ok) {
      setError('Sign-in failed. Check your email and password. Teacher accounts must use the Teacher Login Portal.');
      return;
    }

    // A valid teacher account must never be allowed through the student portal.
    const { data: authData, error: authError } = await (await import('@/lib/supabase/client')).supabase.auth.getUser();
    if (authError || !authData.user) {
      setError('Could not verify your account. Please try again.');
      return;
    }
    const appRole = authData.user.app_metadata?.role;
    const userMetadata = authData.user.user_metadata || {};
    const requestedRole = userMetadata.requested_role || userMetadata.role;
    const isTeacherAccount =
      appRole === 'teacher' ||
      appRole === 'teacher_applicant' ||
      requestedRole === 'teacher' ||
      userMetadata.teacher_access_status === 'pending';

    if (isTeacherAccount || (appRole && appRole !== 'student')) {
      const { supabase } = await import('@/lib/supabase/client');
      await supabase.auth.signOut({ scope: 'local' });
      setError(
        isTeacherAccount
          ? 'Teacher accounts cannot sign in here. Please use the Teacher Login Portal.'
          : 'This account is not marked as a student account. Please contact the administrator.'
      );
      return;
    }
    router.replace('/');
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

        <p className="text-center text-xs text-purple-200 pt-2">
          Don't have an account yet?{' '}
          <Link href="/auth/register" className="font-bold text-white hover:underline">
            Register here
          </Link>
        </p>
        <div className="border-t border-white/15 pt-4 text-center">
          <p className="mb-3 text-xs text-purple-200">Are you a teacher?</p>
          <div className="flex justify-center">
            <Link href="/auth/teacher-login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-300/50">
              <ShieldCheck className="h-4 w-4" />
              Teacher Login Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
