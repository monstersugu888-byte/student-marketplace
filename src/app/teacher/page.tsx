'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
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
  const [students, setStudents] = useState<{id:string;name:string;email:string}[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [markSubject, setMarkSubject] = useState('');
  const [markCode, setMarkCode] = useState('');
  const [markStatus, setMarkStatus] = useState<'Present'|'Absent'>('Present');

  useEffect(() => {
    let active = true;
    apiFetch('/api/profile', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!active) return;
      if (response.status === 401) router.replace('/auth/teacher-login');
      else if (!response.ok || data.profile?.role !== 'teacher' || data.profile?.teacherAccessStatus !== 'approved') router.replace('/auth/teacher-login?pending=1');
      else {
        setReady(true);
        apiFetch('/api/teacher/students', { cache: 'no-store' }).then(async studentsResponse => {
          const studentsData = await studentsResponse.json();
          if (studentsResponse.ok) setStudents(studentsData.students || []);
        }).catch(error => console.error('Unable to load teacher student list:', error));
      }
    }).catch(() => { if (active) router.replace('/auth/teacher-login'); });
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
      showToast('Assignment created successfully.');
    } finally { setBusy(false); }
  };

  const createAttendanceSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attendanceSubject.trim() || !attendanceCode.trim()) return;
    setBusy(true);
    try {
      await addSubjectAttendance(attendanceSubject.trim(), attendanceCode.trim(), 'Teacher', 0, 0, 75);
      setAttendanceSubject(''); setAttendanceCode('');
      showToast('Attendance subject saved successfully.');
    } finally { setBusy(false); }
  };

  const recordStudentAttendance = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudentId || !markSubject.trim() || !markCode.trim()) {
      showToast('Choose a student and enter the subject and code.');
      return;
    }
    setBusy(true);
    try {
      const existingResponse = await apiFetch(`/api/attendance?userId=${encodeURIComponent(selectedStudentId)}`, { cache: 'no-store' });
      const existingData = await existingResponse.json();
      if (!existingResponse.ok) throw new Error(existingData.error || 'Unable to load student attendance.');
      const existing = (existingData.attendances || []).find((row: any) =>
        row.studentId === selectedStudentId && String(row.code || '').toLowerCase() === markCode.trim().toLowerCase()
      );
      const date = new Date().toISOString().slice(0, 10);
      let response: Response;
      if (existing) {
        response = await apiFetch('/api/attendance', {
          method: 'PUT',
          body: JSON.stringify({ userId: selectedStudentId, id: existing.id, action: 'mark', status: markStatus, date }),
        });
      } else {
        const safeCode = markCode.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
        const id = `att_${selectedStudentId.replace(/-/g, '').slice(0, 16)}_${safeCode}`.slice(0, 120);
        response = await apiFetch('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            subject: {
              id, studentId: selectedStudentId, subject: markSubject.trim(), code: markCode.trim(),
              instructor: 'Teacher', attendedClasses: markStatus === 'Present' ? 1 : 0, totalClasses: 1,
              targetPercentage: 75,
              history: [{ id: `h_${Date.now()}`, date, status: markStatus, note: '' }],
            },
          }),
        });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Attendance was not saved.');
      showToast(`Marked ${markStatus} for ${students.find(student => student.id === selectedStudentId)?.name || 'student'}.`);
      setMarkSubject('');
      setMarkCode('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance was not saved.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="mx-auto max-w-4xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white">
      <div className="flex items-center gap-3"><GraduationCap className="h-9 w-9" /><div><p className="text-sm text-violet-100">CampusMate</p><h1 className="text-2xl font-extrabold">Teacher Portal</h1></div></div>
      <p className="mt-3 text-sm text-violet-100">Create assignments, manage attendance, and review student work.</p><a href="/teacher/reviews" className="mt-4 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25">Review submissions & attendance requests</a>
    </header>
    <section className="space-y-5">
      <form onSubmit={recordStudentAttendance} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-600" /><h2 className="font-bold">Record student attendance</h2></div>
        <label className="block text-sm font-medium">Student
          <select required value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900">
            <option value="">Choose a student</option>
            {students.map(student=><option key={student.id} value={student.id}>{student.name} ({student.email})</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">Subject<input required value={markSubject} onChange={e=>setMarkSubject(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
          <label className="block text-sm font-medium">Subject code<input required value={markCode} onChange={e=>setMarkCode(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-slate-900" /></label>
        </div>
        <label className="block text-sm font-medium">Attendance status
          <select value={markStatus} onChange={e=>setMarkStatus(e.target.value as 'Present'|'Absent')} className="mt-1 w-full rounded-xl border p-3 text-slate-900">
            <option value="Present">Present</option><option value="Absent">Absent</option>
          </select>
        </label>
        <p className="text-xs leading-relaxed text-slate-500">Saving records the class against the selected student. Existing subjects are updated rather than duplicated.</p>
        <button disabled={busy || students.length===0} className="w-full rounded-xl bg-violet-600 p-3 font-bold text-white disabled:opacity-60">{busy?'Saving…':'Save attendance'}</button>
        {students.length===0 && <p className="text-sm text-amber-700">No student accounts found yet, or the student list could not be loaded.</p>}
      </form>
    </section>
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
