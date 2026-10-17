'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import { BellRing, CalendarDays, ClipboardCheck, FileBarChart2, Send, Plus, RefreshCw } from 'lucide-react';

type Announcement = { id: string; title: string; body: string; audience: string; created_at: string };
type Exam = { id: string; title: string; subject: string; exam_date: string; start_time: string | null; venue: string | null; notes: string | null };
type Result = { id: string; subject: string; assessment: string; marks: number; max_marks: number; remarks: string | null; created_at: string };
type RequestItem = { id: string; request_type: string; subject: string | null; details: string; status: string; created_at: string };

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const field = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50';

export default function AcademicsPage() {
  const { showToast } = useApp();
  const [userId, setUserId] = useState('');
  const [teacher, setTeacher] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examVenue, setExamVenue] = useState('');
  const [requestType, setRequestType] = useState('attendance');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestDetails, setRequestDetails] = useState('');

  async function load() {
    setLoading(true);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setLoading(false);
      showToast('Sign in to access academic services.');
      return;
    }
    setUserId(auth.user.id);
    const isTeacher = auth.user.app_metadata?.role === 'teacher';
    setTeacher(isTeacher);
    const [noticeRes, examRes, resultRes, requestRes] = await Promise.all([
      supabase.from('academic_announcements').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('academic_exams').select('*').order('exam_date', { ascending: true }).limit(50),
      supabase.from('academic_results').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('academic_requests').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const firstError = noticeRes.error || examRes.error || resultRes.error || requestRes.error;
    if (firstError) {
      console.error('Academic portal load failed:', firstError.message);
      showToast('Academic portal tables are not ready. Run the new Supabase SQL migration.');
    }
    setAnnouncements(noticeRes.data || []);
    setExams(examRes.data || []);
    setResults(resultRes.data || []);
    setRequests(requestRes.data || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function publishNotice(e: FormEvent) {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim() || !userId) return;
    setBusy(true);
    const { error } = await supabase.from('academic_announcements').insert({ title: noticeTitle.trim(), body: noticeBody.trim(), audience: 'all', created_by: userId });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setNoticeTitle(''); setNoticeBody(''); showToast('Announcement published.'); await load();
  }

  async function publishExam(e: FormEvent) {
    e.preventDefault();
    if (!examTitle.trim() || !examSubject.trim() || !examDate || !userId) return;
    setBusy(true);
    const { error } = await supabase.from('academic_exams').insert({ title: examTitle.trim(), subject: examSubject.trim(), exam_date: examDate, start_time: examTime || null, venue: examVenue.trim() || null, created_by: userId });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamTime(''); setExamVenue('');
    showToast('Exam schedule published.'); await load();
  }

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    if (!requestDetails.trim() || !userId) return;
    setBusy(true);
    const { error } = await supabase.from('academic_requests').insert({ student_id: userId, request_type: requestType, subject: requestSubject.trim() || null, details: requestDetails.trim() });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setRequestSubject(''); setRequestDetails(''); showToast('Request sent to your teachers.'); await load();
  }

  async function reviewRequest(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase.from('academic_requests').update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) { showToast(error.message); return; }
    showToast('Request ' + status + '.'); await load();
  }

  return <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Studora Academics</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Academic Portal</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">College notices, exam schedules, results and student requests in one place.</p></div>
      <button className={primary} onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" />Refresh</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{label:'Notices',value:announcements.length,Icon:BellRing},{label:'Upcoming exams',value:exams.filter(x=>x.exam_date>=new Date().toISOString().slice(0,10)).length,Icon:CalendarDays},{label:'My results',value:results.length,Icon:FileBarChart2},{label:teacher?'Student requests':'My requests',value:requests.length,Icon:ClipboardCheck}].map(({label,value,Icon})=><div className={panel+' flex items-center gap-3'} key={label}><div className="rounded-xl bg-purple-100 p-3 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><Icon className="h-5 w-5"/></div><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p></div></div>)}
    </div>
    {teacher && <div className="grid gap-5 lg:grid-cols-2">
      <form className={panel+' space-y-3'} onSubmit={publishNotice}><h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><BellRing className="h-5 w-5 text-purple-600"/>Publish college notice</h2><input className={field} placeholder="Notice title" value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} required/><textarea className={field+' min-h-24'} placeholder="Write the notice for students…" value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} required/><button className={primary} disabled={busy}><Plus className="h-4 w-4"/>Publish notice</button></form>
      <form className={panel+' space-y-3'} onSubmit={publishExam}><h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><CalendarDays className="h-5 w-5 text-purple-600"/>Schedule an exam</h2><input className={field} placeholder="Exam name" value={examTitle} onChange={e=>setExamTitle(e.target.value)} required/><input className={field} placeholder="Subject / course code" value={examSubject} onChange={e=>setExamSubject(e.target.value)} required/><div className="grid grid-cols-2 gap-3"><input className={field} type="date" value={examDate} onChange={e=>setExamDate(e.target.value)} required/><input className={field} type="time" value={examTime} onChange={e=>setExamTime(e.target.value)}/></div><input className={field} placeholder="Venue (optional)" value={examVenue} onChange={e=>setExamVenue(e.target.value)}/><button className={primary} disabled={busy}><Plus className="h-4 w-4"/>Publish exam schedule</button></form>
    </div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><BellRing className="h-5 w-5 text-purple-600"/>Notices & announcements</h2>{loading?<p className="text-sm text-slate-500">Loading notices…</p>:announcements.length===0?<p className="text-sm text-slate-500">No college notices yet.</p>:<div className="space-y-3">{announcements.map(n=><article key={n.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold text-slate-900 dark:text-white">{n.title}</h3><span className="shrink-0 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{n.body}</p></article>)}</div>}</section>
      <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><CalendarDays className="h-5 w-5 text-purple-600"/>Exam timetable</h2>{loading?<p className="text-sm text-slate-500">Loading exams…</p>:exams.length===0?<p className="text-sm text-slate-500">No exams scheduled yet.</p>:<div className="space-y-3">{exams.map(x=><article key={x.id} className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="min-w-14 rounded-lg bg-purple-100 px-2 py-2 text-center text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><p className="text-xs font-bold">{new Date(x.exam_date+'T12:00:00').toLocaleDateString(undefined,{month:'short'})}</p><p className="text-lg font-extrabold">{new Date(x.exam_date+'T12:00:00').getDate()}</p></div><div><h3 className="font-semibold text-slate-900 dark:text-white">{x.title}</h3><p className="text-sm text-slate-600 dark:text-slate-300">{x.subject}{x.start_time?' · '+x.start_time.slice(0,5):''}</p>{x.venue&&<p className="text-xs text-slate-500">Venue: {x.venue}</p>}</div></article>)}</div>}</section>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><FileBarChart2 className="h-5 w-5 text-purple-600"/>Academic results</h2>{results.length===0?<p className="text-sm text-slate-500">{teacher?'No results have been entered yet.':'Your results will appear here when your teacher publishes them.'}</p>:<div className="space-y-2">{results.map(r=><div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><div><p className="font-semibold text-slate-900 dark:text-white">{r.subject}</p><p className="text-xs text-slate-500">{r.assessment}</p></div><p className="font-extrabold text-purple-700 dark:text-purple-300">{r.marks}/{r.max_marks}<span className="ml-1 text-xs font-medium text-slate-500">({Math.round(Number(r.marks)/Number(r.max_marks)*100)}%)</span></p></div>)}</div>}</section>
      <section className={panel}>{teacher?<><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><ClipboardCheck className="h-5 w-5 text-purple-600"/>Student requests</h2>{requests.length===0?<p className="text-sm text-slate-500">No student requests to review.</p>:<div className="space-y-3">{requests.map(r=><article key={r.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold capitalize text-slate-900 dark:text-white">{r.request_type} request</span><span className="text-xs capitalize text-slate-500">{r.status}</span></div>{r.subject&&<p className="mt-1 text-xs text-slate-500">Subject: {r.subject}</p>}<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.details}</p>{r.status==='pending'&&<div className="mt-3 flex gap-2"><button className={primary} onClick={()=>void reviewRequest(r.id,'approved')}>Approve</button><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200" onClick={()=>void reviewRequest(r.id,'rejected')}>Reject</button></div>}</article>)}</div>}</>:<><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Send className="h-5 w-5 text-purple-600"/>Request attendance correction or leave</h2><form className="space-y-3" onSubmit={sendRequest}><select className={field} value={requestType} onChange={e=>setRequestType(e.target.value)}><option value="attendance">Attendance correction</option><option value="leave">Leave request</option><option value="general">General academic request</option></select><input className={field} placeholder="Subject / class (optional)" value={requestSubject} onChange={e=>setRequestSubject(e.target.value)}/><textarea className={field+' min-h-24'} placeholder="Explain your request…" value={requestDetails} onChange={e=>setRequestDetails(e.target.value)} required/><button className={primary} disabled={busy}><Send className="h-4 w-4"/>Send request</button></form><div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">My requests</h3>{requests.length===0?<p className="text-sm text-slate-500">You haven't submitted any requests.</p>:requests.map(r=><div key={r.id} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm dark:border-slate-800"><span className="capitalize text-slate-700 dark:text-slate-300">{r.request_type}: {r.details}</span><span className="capitalize text-slate-500">{r.status}</span></div>)}</div></>}</section>
    </div>
    <p className="text-xs text-slate-400">Academic data is stored in Supabase. Teacher publishing and review actions require the authenticated account to have the approved teacher role.</p>
  </div>;
}
