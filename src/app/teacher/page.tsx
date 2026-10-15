'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import { GraduationCap, ShieldAlert, BookOpen, ClipboardCheck } from 'lucide-react';

export default function TeacherPortalPage() {
  const router = useRouter();
  const { userRole, isAuthenticated, addAssignment, addSubjectAttendance, showToast } = useApp();
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceCode, setAttendanceCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) router.replace('/auth/login');
      else if (data.user.app_metadata?.role !== 'teacher') router.replace('/');
      else setReady(true);
    });
    return () => { active = false; };
  }, [router]);

  if (!ready || !isAuthenticated || userRole !== 'teacher') {
    return <main className="mx-auto max-w-xl p-8 text-center"><ShieldAlert className="mx-auto mb-3 h-10 w-10 text-violet-600" /><h1 className="text-xl font-bold">Checking teacher access…</h1><p className="mt-2 text-sm text-slate-500">Teacher access must be granted by an administrator.</p></main>;
  }

  const createAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !subject.trim() || !dueDate) return;
    setBusy(true);
    try {
      await addAssignment({ title: title.trim(), subject: subject.trim(), description: description.trim(), dueDate, dueTime: '23:59', priority: 'Medium', status: 'Not Started' });
      setTitle(''); setSubject(''); setDescription(''); setDueDate('');
      showToast('Assignment created. Note: shared teacher/student assignment storage still needs the Supabase migration.');
    } finally { setBusy(false); }
  };

  const createAttendanceSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attendanceSubject.trim() || !attendanceCode.trim()) return;
    setBusy(true);
    try {
      await addSubjectAttendance(attendanceSubject.trim(), attendanceCode.trim(), 'Teacher', 0, 0, 75);
      setAttendanceSubject(''); setAttendanceCode('');
      showToast('Attendance subject added. Shared attendance requests need the Supabase migration.');
    } finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-4xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white">
      <div className="flex items-center gap-3"><GraduationCap className="h-9 w-9" /><div><p className="text-sm text-violet-100">CampusMate</p><h1 className="text-2xl font-extrabold">Teacher Portal</h1></div></div>
      <p className="mt-3 text-sm text-violet-100">Create assignments and attendance subjects for your classes.</p>
    </header>
    <section className="grid gap-5 md:grid-cols-2">
      <form onSubmit={createAssignment} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-violet-600" /><h2 className="font-bold">Create assignment</h2></div>
        <label className="block text-sm font-medium">Assignment title<input required value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        <label className="block text-sm font-medium">Subject<input required value={subject} onChange={e=>setSubject(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        <label className="block text-sm font-medium">Instructions<textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" rows={3} /></label>
        <label className="block text-sm font-medium">Due date<input required type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-violet-600 p-3 font-bold text-white disabled:opacity-60">{busy?'Saving…':'Create assignment'}</button>
      </form>
      <form onSubmit={createAttendanceSubject} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-600" /><h2 className="font-bold">Set up attendance</h2></div>
        <label className="block text-sm font-medium">Subject name<input required value={attendanceSubject} onChange={e=>setAttendanceSubject(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        <label className="block text-sm font-medium">Subject code<input required value={attendanceCode} onChange={e=>setAttendanceCode(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        <p className="text-xs leading-relaxed text-slate-500">Student requests and teacher approval must be stored in shared database tables before this becomes a complete attendance workflow.</p>
        <button disabled={busy} className="w-full rounded-xl bg-violet-600 p-3 font-bold text-white disabled:opacity-60">{busy?'Saving…':'Add attendance subject'}</button>
      </form>
    </section>
  </main>;
}
