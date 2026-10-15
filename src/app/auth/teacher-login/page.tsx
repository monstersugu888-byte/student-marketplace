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
        setError('This teacher application is still pending or was rejected. The CampusMate administrator must approve it using the approval email before teacher access is enabled.');
        return;
      }
      router.replace('/teacher');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
            <GraduationCap className="h-9 w-9" />
          </div>
          <p className="text-sm font-semibold text-violet-600">CampusMate</p>
          <h1 className="mt-1 text-2xl font-extrabold">Teacher Login Portal</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with an administrator-approved teacher account.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Teacher email
            <span className="relative mt-1 block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@college.edu" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" />
            </span>
          </label>
          <label className="block text-sm font-semibold">
            Password
            <span className="relative mt-1 block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" />
            </span>
          </label>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            {busy ? 'Signing in…' : 'Sign in as teacher'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">Teacher access is restricted. Student accounts cannot enter this portal.</p>
        <p className="text-center text-sm text-slate-600 dark:text-slate-300">New teacher? <Link href="/auth/teacher-register" className="font-bold text-violet-600 hover:underline">Register here</Link></p>
        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to student login</Link>
        </div>
      </div>
    </main>
  );
}
