'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Password changed successfully. You can now sign in with your new password.');
    window.setTimeout(() => router.replace('/auth/login'), 1200);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-slate-50 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Set a new password</h1>
        <p className="mt-2 mb-6 text-sm text-slate-500">Open this page from the password reset email to choose a new password.</p>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-700">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">New password
            <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-3" />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm new password
            <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-3" />
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-violet-600 p-3 font-bold text-white disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button>
        </form>
        <p className="mt-5 text-center text-sm"><Link href="/auth/login" className="font-semibold text-violet-600">Back to sign in</Link></p>
      </section>
    </main>
  );
}
