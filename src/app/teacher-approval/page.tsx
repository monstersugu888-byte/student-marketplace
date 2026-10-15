'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
function ApprovalAction() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const action = token ? (() => { try { return JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).action; } catch { return ''; } })() : '';
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  async function decide() {
    setBusy(true); setError(''); setResult('');
    try {
      const response = await fetch('/api/teacher-approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Decision could not be saved.');
      setResult(data.status === 'approved' ? 'Teacher approved. Teacher access is now enabled.' : 'Teacher application rejected. Teacher access remains disabled.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-[70vh] items-center justify-center p-4"><section className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><h1 className="text-2xl font-extrabold">CampusMate teacher application</h1><p className="text-slate-600">Confirm your decision below. This action can only be completed once for a pending application.</p>{action !== 'approve' && action !== 'reject' && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">The approval link is invalid.</p>}{action === 'approve' && <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">You are about to approve this teacher and grant teacher access.</p>}{action === 'reject' && <p className="rounded-xl bg-red-50 p-3 text-red-800">You are about to reject this teacher application.</p>}{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}{result && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{result}</p>}{!result && <button disabled={busy || !token || !['approve','reject'].includes(action)} onClick={decide} className={`w-full rounded-xl p-3 font-bold text-white disabled:opacity-50 ${action === 'approve' ? 'bg-emerald-700' : 'bg-red-700'}`}>{busy ? 'Saving decision…' : action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}</button>}<Link className="block text-center text-sm text-violet-700 underline" href="/">Return to CampusMate</Link></section></main>;
}
export default function TeacherApprovalPage() { return <Suspense fallback={<main className="p-8">Loading approval…</main>}><ApprovalAction /></Suspense>; }
