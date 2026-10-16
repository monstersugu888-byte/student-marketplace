import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher, requireUser } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };
const idPattern = /^[a-zA-Z0-9_-]{1,120}$/;

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const requestedUserId = new URL(req.url).searchParams.get('userId');
  let studentId = auth.user!.id;
  if (requestedUserId && requestedUserId !== studentId) {
    const teacher = await requireTeacher(req);
    if (teacher.response) return teacher.response;
    studentId = requestedUserId;
  }
  // Return this student's records plus global subject templates. Templates
  // are sanitized below so no student's counts/history can leak through them.
  const { data, error } = await supabaseAdmin
    .from('attendance_subjects')
    .select('*')
    .or(`student_id.eq.${studentId},student_id.is.null`)
    .order('subject');
  if (error) {
    console.error('Attendance GET:', error.message);
    return NextResponse.json({ success: false, error: 'Unable to load attendance. Apply the Supabase migration first.' }, { status: 503, headers: noStore });
  }
  const attendances = (data || []).map(row => {
    const isTemplate = row.student_id === null;
    return {
      id: row.id, studentId: row.student_id, subject: row.subject, code: row.code, instructor: row.instructor,
      attendedClasses: isTemplate ? 0 : row.attended_classes,
      totalClasses: isTemplate ? 0 : row.total_classes,
      targetPercentage: Number(row.target_percentage),
      history: isTemplate ? [] : (row.history || []),
    };
  });
  return NextResponse.json({ success: true, attendances }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const subject = body?.subject;
    if (!subject || typeof subject !== 'object' || !String(subject.subject || '').trim()) {
      return NextResponse.json({ success: false, error: 'Attendance subject is required.' }, { status: 400 });
    }
    const studentId = typeof subject.studentId === 'string' ? subject.studentId : null;
    if (studentId) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('profiles').select('id,role').eq('id', studentId).maybeSingle();
      if (studentError) return NextResponse.json({ success: false, error: 'Unable to verify the selected student.' }, { status: 500 });
      if (!student || student.role !== 'student') return NextResponse.json({ success: false, error: 'Attendance can only be assigned to a valid student account.' }, { status: 400 });
    }
    const id = typeof subject.id === 'string' && idPattern.test(subject.id) ? subject.id : 'att_' + crypto.randomUUID();
    const row = {
      id, student_id: studentId,
      subject: String(subject.subject).trim(), code: String(subject.code || ''),
      instructor: String(subject.instructor || ''), attended_classes: Math.max(0, Number(subject.attendedClasses) || 0),
      total_classes: Math.max(0, Number(subject.totalClasses) || 0),
      target_percentage: Math.min(100, Math.max(1, Number(subject.targetPercentage) || 75)),
      history: Array.isArray(subject.history) ? subject.history : [], updated_at: new Date().toISOString(),
    };
    if (row.attended_classes > row.total_classes) return NextResponse.json({ success: false, error: 'Attended classes cannot exceed total classes.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('attendance_subjects').upsert(row).select().single();
    if (error) {
      console.error('Attendance POST:', error.message);
      return NextResponse.json({ success: false, error: 'Unable to save attendance subject. Apply the latest Supabase migration.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, subject: { id: data.id, subject: data.subject, code: data.code, instructor: data.instructor, attendedClasses: data.attended_classes, totalClasses: data.total_classes, targetPercentage: Number(data.target_percentage), history: data.history } }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid attendance request.' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { userId, id, updated, action, status, date, note } = body || {};
    if (typeof id !== 'string' || !idPattern.test(id)) return NextResponse.json({ success: false, error: 'A valid attendance ID is required.' }, { status: 400 });
    const targetStudent = typeof userId === 'string' && userId !== auth.user!.id && userId !== auth.user!.email ? userId : null;
    let existingQuery = supabaseAdmin.from('attendance_subjects').select('*').eq('id', id);
    existingQuery = targetStudent ? existingQuery.eq('student_id', targetStudent) : existingQuery.is('student_id', null);
    const { data: existing, error: readError } = await existingQuery.maybeSingle();
    if (readError) return NextResponse.json({ success: false, error: 'Unable to load attendance record.' }, { status: 500 });
    if (!existing) return NextResponse.json({ success: false, error: 'Attendance record not found for this student.' }, { status: 404 });

    if (action === 'mark') {
      if (!['Present', 'Absent'].includes(status)) return NextResponse.json({ success: false, error: 'Choose Present or Absent.' }, { status: 400 });
      const history = Array.isArray(existing.history) ? existing.history : [];
      const log = { id: 'h_' + crypto.randomUUID(), date: date || new Date().toISOString().slice(0, 10), status, note: String(note || '') };
      const total = Number(existing.total_classes || 0) + 1;
      const attended = Number(existing.attended_classes || 0) + (status === 'Present' ? 1 : 0);
      let markQuery = supabaseAdmin.from('attendance_subjects').update({ total_classes: total, attended_classes: attended, history: [log, ...history], updated_at: new Date().toISOString() }).eq('id', id);
      markQuery = targetStudent ? markQuery.eq('student_id', targetStudent) : markQuery.is('student_id', null);
      const { error } = await markQuery;
      if (error) return NextResponse.json({ success: false, error: 'Unable to mark attendance.' }, { status: 500 });
      return NextResponse.json({ success: true, id, updated: { attendedClasses: attended, totalClasses: total, history: [log, ...history] } }, { headers: noStore });
    }

    if (!updated || typeof updated !== 'object' || Array.isArray(updated)) return NextResponse.json({ success: false, error: 'Attendance updates are required.' }, { status: 400 });
    const allowed: Record<string, string> = { subject: 'subject', code: 'code', instructor: 'instructor', attendedClasses: 'attended_classes', totalClasses: 'total_classes', targetPercentage: 'target_percentage', history: 'history' };
    const safe = Object.fromEntries(Object.entries(updated).filter(([key]) => key in allowed).map(([key, value]) => [allowed[key], value]));
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No editable attendance fields supplied.' }, { status: 400 });
    const attended = Number(safe.attended_classes ?? existing.attended_classes);
    const total = Number(safe.total_classes ?? existing.total_classes);
    if (!Number.isFinite(attended) || !Number.isFinite(total) || attended < 0 || total < attended) return NextResponse.json({ success: false, error: 'Attendance totals are invalid.' }, { status: 400 });
    let updateQuery = supabaseAdmin.from('attendance_subjects').update({ ...safe, updated_at: new Date().toISOString() }).eq('id', id);
    updateQuery = targetStudent ? updateQuery.eq('student_id', targetStudent) : updateQuery.is('student_id', null);
    const { error } = await updateQuery;
    if (error) return NextResponse.json({ success: false, error: 'Unable to update attendance.' }, { status: 500 });
    return NextResponse.json({ success: true, id, updated: safe }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid attendance update.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  const requestedUserId = params.get('userId');
  if (!id || !idPattern.test(id)) return NextResponse.json({ success: false, error: 'Attendance ID is required.' }, { status: 400 });
  // Teacher-created subject templates have no student_id; older clients may send the teacher email.
  if (!requestedUserId || requestedUserId === auth.user!.email || requestedUserId === auth.user!.id) {
    const { data: template, error: templateError } = await supabaseAdmin.from('attendance_subjects').delete().eq('id', id).is('student_id', null).select('id').maybeSingle();
    if (templateError) return NextResponse.json({ success: false, error: 'Unable to delete attendance subject.' }, { status: 500 });
    if (template) return NextResponse.json({ success: true, id }, { headers: noStore });
  }
  const targetId = requestedUserId === auth.user!.email || !requestedUserId ? auth.user!.id : requestedUserId;
  const { data, error } = await supabaseAdmin.from('attendance_subjects').delete().eq('id', id).eq('student_id', targetId).select('id').maybeSingle();
  if (error) return NextResponse.json({ success: false, error: 'Unable to delete attendance subject.' }, { status: 500 });
  if (!data) return NextResponse.json({ success: false, error: 'Attendance subject not found.' }, { status: 404 });
  return NextResponse.json({ success: true, id }, { headers: noStore });
}
