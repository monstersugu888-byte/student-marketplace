'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

type RequestRow = { user_id: string; email?: string; name?: string; department: string; staff_id: string; status: string; created_at: string };

export default function TeacherApplicationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await apiFetch('/api/admin/teacher-requests', { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 401) { router.replace('/auth/login'); return; }
      if (!response.ok) throw new Error(data.error || 'Unable to load applications.');
      setRequests(data.requests || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load applications.'); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);
  async function decide(userId: string, status: 'approved' | 'rejected') {
    setBusy(userId); setError('');
    try {
      const response = await apiFetch('/api/admin/teacher-requests', { method: 'PUT', body: JSON.stringify({ userId, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update application.');
      await load();
      if (!data.emailSent && data.emailNotice) setError(data.emailNotice);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update application.'); }
    finally { setBusy(null); }
  }
  return <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-violet-600"/><div><h1 className="text-2xl font-extrabold">Teacher Applications</h1><p className="text-sm text-slate-500">Only administrators can approve teacher accounts.</p></div></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4"/>Refresh</button></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}{error.includes('Administrator access') && <p className="mt-2">The first administrator must be set once in Supabase SQL Editor by changing a verified account’s profile role to admin.</p>}</div>}
    {requests.length===0 && !error && <p className="rounded-xl border p-5 text-sm text-slate-500">No teacher applications found.</p>}
    {requests.map(row=><article key={row.user_id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold">{row.name || 'Teacher applicant'}</h2><p className="text-sm text-slate-500">{row.email}</p><p className="mt-2 text-sm">Department: {row.department || 'Not provided'} · Staff ID: {row.staff_id || 'Not provided'}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{row.status}</span></div>
      {row.status==='pending' && <div className="flex gap-2"><button disabled={busy===row.user_id} onClick={()=>void decide(row.user_id,'approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>Approve</button><button disabled={busy===row.user_id} onClick={()=>void decide(row.user_id,'rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><XCircle className="h-4 w-4"/>Reject</button></div>}
    </article>)}
  </main>;
}
