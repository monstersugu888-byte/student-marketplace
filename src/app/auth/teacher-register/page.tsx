'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { GraduationCap, User, Mail, Lock, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TeacherRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            full_name: name.trim(),
            department: department.trim(),
            staff_id: staffId.trim(),
            requested_role: 'teacher',
            teacher_access_status: 'pending',
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setSuccess('Registration submitted. Check your email if verification is required. Your account must be approved by an administrator before you can use the Teacher Portal.');
      setName('');
      setEmail('');
      setDepartment('');
      setStaffId('');
      setPassword('');
    } catch {
      setError('Registration could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
            <GraduationCap className="h-9 w-9" />
          </div>
          <p className="text-sm font-semibold text-violet-600">CampusMate</p>
          <h1 className="mt-1 text-2xl font-extrabold">Teacher Registration</h1>
          <p className="mt-2 text-sm text-slate-500">Apply for teacher access using your college details.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold">Full name
            <span className="relative mt-1 block"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" /></span>
          </label>
          <label className="block text-sm font-semibold">College / staff email
            <span className="relative mt-1 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="teacher@college.edu" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" /></span>
          </label>
          <label className="block text-sm font-semibold">Department / subject
            <span className="relative mt-1 block"><BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Electronics Engineering" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" /></span>
          </label>
          <label className="block text-sm font-semibold">Staff ID (if available)
            <input value={staffId} onChange={e=>setStaffId(e.target.value)} placeholder="College staff ID" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" />
          </label>
          <label className="block text-sm font-semibold">Create password
            <span className="relative mt-1 block"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700" /></span>
          </label>
          <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900 dark:bg-violet-950/40 dark:text-violet-200">Teacher registration does not automatically grant teacher privileges. An administrator must approve the account.</div>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Submitting…' : 'Submit teacher registration'} {!busy && <ArrowRight className="h-4 w-4" />}</button>
        </form>
        <div className="flex flex-col items-center gap-3 text-sm">
          <Link href="/auth/teacher-login" className="font-semibold text-violet-600 hover:underline">Already registered? Teacher login</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-500 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to student login</Link>
        </div>
      </div>
    </main>
  );
}
