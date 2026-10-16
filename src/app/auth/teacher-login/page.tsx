'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError || !data.user) {
        setError(signInError?.message || 'Unable to sign in. Check your email and password.');
        return;
      }
      if (data.user.app_metadata?.role !== 'teacher') {
        await supabase.auth.signOut({ scope: 'local' });
        setError('This teacher application is still pending or was rejected. The administrator must approve it before teacher access is enabled.');
        return;
      }
      router.replace('/teacher');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = 'w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 p-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl shadow-purple-950/40 backdrop-blur-xl sm:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Campus<span className="text-purple-300">Mate</span></h1>
          <p className="text-xs text-purple-200">Teacher Login Portal</p>
          <p className="text-sm text-purple-100/80">Sign in with an administrator-approved teacher account.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <label className="block font-bold text-purple-100">
            Teacher Email Address
            <span className="relative mt-1.5 block">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" />
              <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@college.edu" className={fieldClass} />
            </span>
          </label>
          <label className="block font-bold text-purple-100">
            Password
            <span className="relative mt-1.5 block">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" />
              <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className={fieldClass} />
            </span>
          </label>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            <span>{busy ? 'Signing in…' : 'Sign In'}</span>
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-purple-200">Teacher access is restricted to approved accounts. Student accounts cannot enter this portal.</p>
        <p className="border-t border-white/15 pt-4 text-center text-xs text-purple-200">
          New teacher? <Link href="/auth/teacher-register" className="font-bold text-white hover:underline">Register here</Link>
        </p>
        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-xs font-semibold text-purple-200 hover:text-white hover:underline"><ArrowLeft className="h-4 w-4" /> Back to student login</Link>
        </div>
      </div>
    </main>
  );
}
