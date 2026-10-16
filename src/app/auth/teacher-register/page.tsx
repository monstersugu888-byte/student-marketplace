'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, User, Mail, Lock, BookOpen, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

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
      const response = await fetch('/api/teacher-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
          staffId: staffId.trim(),
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Teacher registration could not be completed. Please try again.');
        return;
      }
      setSuccess(data.message || 'Teacher application submitted. The administrator has been emailed for approval.');
      setName('');
      setEmail('');
      setDepartment('');
      setStaffId('');
      setPassword('');
    } catch {
      setError('Registration could not be completed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 p-4 text-white">
      <div className="my-4 w-full max-w-lg space-y-6 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl shadow-purple-950/40 backdrop-blur-xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
            <GraduationCap className="h-9 w-9" />
          </div>
          <p className="text-sm font-semibold text-purple-200">CampusMate</p>
          <h1 className="mt-1 text-2xl font-extrabold">Teacher Registration</h1>
          <p className="mt-2 text-sm text-purple-100/80">Apply for teacher access using your college details.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-bold text-purple-100">Full name
            <span className="relative mt-1 block"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" /><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30" /></span>
          </label>
          <label className="block text-xs font-bold text-purple-100">College / staff email
            <span className="relative mt-1 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" /><input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="teacher@college.edu" className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30" /></span>
          </label>
          <label className="block text-xs font-bold text-purple-100">Department / subject
            <span className="relative mt-1 block"><BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" /><input required maxLength={120} value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Electronics Engineering" className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30" /></span>
          </label>
          <label className="block text-xs font-bold text-purple-100">Staff ID (if available)
            <input maxLength={80} value={staffId} onChange={e=>setStaffId(e.target.value)} placeholder="College staff ID" className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30" />
          </label>
          <label className="block text-xs font-bold text-purple-100">Create password
            <span className="relative mt-1 block"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" /><input required type="password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm font-normal text-white placeholder:text-purple-200/50 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30" /></span>
          </label>
          <div className="flex gap-2 rounded-xl border border-purple-300/20 bg-purple-400/10 p-3 text-xs leading-relaxed text-purple-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" /><span>Your application is reviewed by the CampusMate administrator. You cannot access teacher features until approved.</span></div>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-3 font-bold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Submitting…' : 'Submit teacher registration'} {!busy && <ArrowRight className="h-4 w-4" />}</button>
        </form>
        <div className="flex flex-col items-center gap-3 text-sm">
          <Link href="/auth/teacher-login" className="font-semibold text-purple-200 hover:text-white hover:underline">Already registered? Teacher login</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-purple-200 hover:text-white hover:underline"><ArrowLeft className="h-4 w-4" /> Back to student login</Link>
        </div>
      </div>
    </main>
  );
}
