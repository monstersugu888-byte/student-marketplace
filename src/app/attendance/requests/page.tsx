'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { ArrowLeft, Send, RefreshCw } from 'lucide-react';

type Attendance = { id: string; subject: string };
type RequestRow = { id: string; date: string; reason: string; requestedStatus?: string; status: string; createdAt?: string };

export default function AttendanceRequestsPage() {
  const [subjects, setSubjects] = useState<Attendance[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [requestedStatus, setRequestedStatus] = useState<'Present' | 'Absent'>('Present');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setMessage('');
    try {
      const [attendanceResponse, requestResponse] = await Promise.all([
        apiFetch('/api/attendance', { cache: 'no-store' }),
        apiFetch('/api/attendance-requests', { cache: 'no-store' }),
      ]);
      const attendanceData = await attendanceResponse.json();
      const requestData = await requestResponse.json();
      if (!attendanceResponse.ok || !requestResponse.ok) throw new Error(attendanceData.error || requestData.error || 'Could not load attendance data.');
      setSubjects(attendanceData.attendances || []);
      setRequests(requestData.requests || []);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load attendance data.'); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) { setMessage('Enter a reason for your request.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await apiFetch('/api/attendance-requests', { method: 'POST', body: JSON.stringify({ subjectId, date, reason: reason.trim(), requestedStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request could not be submitted.');
      setReason('');
      setMessage('Attendance request submitted for teacher review.');
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Request could not be submitted.'); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
    <header><Link href="/attendance" className="inline-flex items-center gap-2 text-sm text-violet-600"><ArrowLeft className="h-4 w-4"/> Back to attendance</Link><h1 className="mt-3 text-2xl font-extrabold">Attendance Requests</h1><p className="mt-1 text-sm text-slate-500">Request a correction and track your teacher’s decision.</p></header>
    {message && <p role="status" className="rounded-xl border p-3 text-sm">{message}</p>}
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
      <label className="block text-sm font-semibold">Attendance subject<select required value={subjectId} onChange={e=>setSubjectId(e.target.value)} className="mt-1 w-full rounded-xl border bg-transparent p-3"><option value="">Choose subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.subject}</option>)}</select></label>
      <label className="block text-sm font-semibold">Date<input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-xl border bg-transparent p-3"/></label>
      <label className="block text-sm font-semibold">Requested attendance status<select value={requestedStatus} onChange={e=>setRequestedStatus(e.target.value as 'Present' | 'Absent')} className="mt-1 w-full rounded-xl border bg-transparent p-3"><option value="Present">Present</option><option value="Absent">Absent</option></select></label>
      <label className="block text-sm font-semibold">Reason<textarea required rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain the attendance correction you need…" className="mt-1 w-full rounded-xl border bg-transparent p-3"/></label>
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{busy?'Submitting…':'Submit request'}</button>
    </form>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Your requests</h2><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4"/>Refresh</button></div>
      {requests.length===0 && <p className="rounded-xl border p-4 text-sm text-slate-500">No attendance requests yet.</p>}
      {requests.map(r=><article key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{r.date} · Requested: {r.requestedStatus || 'Present'}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.reason}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${r.status==='approved'?'bg-emerald-100 text-emerald-800':r.status==='rejected'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800'}`}>{r.status}</span></article>)}
    </section>
  </main>;
}
