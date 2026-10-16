'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import { CheckCircle2, XCircle, ClipboardCheck, ArrowLeft, RefreshCw } from 'lucide-react';

type Review = { id: string; status: string; studentName: string; assignmentTitle?: string; subject?: string; submissionUrl?: string; submissionText?: string; feedback?: string; reason?: string; date?: string; createdAt?: string };

export default function TeacherReviewsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Review[]>([]);
  const [requests, setRequests] = useState<Review[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await apiFetch('/api/teacher/reviews', { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 401) { router.replace('/auth/teacher-login'); return; }
      if (!response.ok) throw new Error(data.error || 'Could not load reviews.');
      setSubmissions(data.submissions || []);
      setRequests(data.attendanceRequests || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load reviews.'); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function review(type: 'assignment' | 'attendance', id: string, status: 'approved' | 'rejected') {
    setBusy(id); setError('');
    try {
      const response = await apiFetch('/api/teacher/reviews', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Review failed.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Review failed.'); }
    finally { setBusy(null); }
  }

  const pendingSubmissions = submissions.filter(item => item.status === 'pending');
  const pendingRequests = requests.filter(item => item.status === 'pending');

  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href="/teacher" className="mb-2 inline-flex items-center gap-2 text-sm text-violet-600"><ArrowLeft className="h-4 w-4" /> Teacher Portal</Link><h1 className="text-2xl font-extrabold">Student Reviews</h1><p className="mt-1 text-sm text-slate-500">Review submitted assignments and attendance requests.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh</button>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="h-5 w-5 text-violet-600" /> Assignment submissions ({pendingSubmissions.length} pending)</h2>
      {pendingSubmissions.length === 0 && <p className="rounded-xl border p-5 text-sm text-slate-500">No pending assignment submissions.</p>}
      {pendingSubmissions.map(item => <article key={item.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{item.assignmentTitle}</h3><p className="text-sm text-slate-500">{item.subject} · submitted by {item.studentName}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span></div>
        {item.submissionText && <p className="whitespace-pre-wrap text-sm">{item.submissionText}</p>}
        {item.submissionUrl && <a className="break-all text-sm text-violet-600 underline" href={item.submissionUrl} target="_blank" rel="noreferrer">Open submitted work</a>}
        <div className="flex gap-2"><button disabled={busy===item.id} onClick={() => void review('assignment', item.id, 'approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> Approve</button><button disabled={busy===item.id} onClick={() => void review('assignment', item.id, 'rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><XCircle className="h-4 w-4"/> Reject</button></div>
      </article>)}
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Attendance requests ({pendingRequests.length} pending)</h2>
      {pendingRequests.length === 0 && <p className="rounded-xl border p-5 text-sm text-slate-500">No pending attendance requests.</p>}
      {pendingRequests.map(item => <article key={item.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900">
        <div><h3 className="font-bold">{item.studentName}</h3><p className="text-sm text-slate-500">Date: {item.date || '—'}</p><p className="mt-2 text-sm">{item.reason}</p></div>
        <div className="flex gap-2"><button disabled={busy===item.id} onClick={() => void review('attendance', item.id, 'approved')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Approve</button><button disabled={busy===item.id} onClick={() => void review('attendance', item.id, 'rejected')} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Reject</button></div>
      </article>)}
    </section>
  </main>;
}
