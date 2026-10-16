import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher, requireUser } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { data: profile } = await supabaseAdmin.from('profiles').select('role,teacher_access_status').eq('id', auth.user!.id).maybeSingle();
  const isTeacher = profile?.role === 'teacher' && profile?.teacher_access_status === 'approved';
  let query = supabaseAdmin.from('attendance_requests').select('*').order('created_at', { ascending: false });
  if (!isTeacher) query = query.eq('student_id', auth.user!.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: 'Unable to load attendance requests. Apply the Supabase migration.' }, { status: 503, headers: noStore });
  const ids = [...new Set((data || []).map(row => row.student_id))];
  const profiles = ids.length ? await supabaseAdmin.from('profiles').select('id,full_name,email').in('id', ids) : { data: [], error: null };
  const profileMap = new Map((profiles.data || []).map(row => [row.id, row]));
  return NextResponse.json({ success: true, requests: (data || []).map(row => ({
    id: row.id, studentId: row.student_id, studentName: profileMap.get(row.student_id)?.full_name || profileMap.get(row.student_id)?.email || 'Student',
    subjectId: row.subject_id, date: row.requested_date, reason: row.reason, requestedStatus: row.requested_status, status: row.status,
    createdAt: row.created_at, reviewedAt: row.reviewed_at,
  })) }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const reason = String(body?.reason || '').trim();
    const requestedStatus = body?.requestedStatus === 'Absent' ? 'Absent' : 'Present';
    const requestedDate = String(body?.date || new Date().toISOString().slice(0, 10));
    const subjectId = body?.subjectId ? String(body.subjectId) : null;
    if (!reason) return NextResponse.json({ success: false, error: 'Please explain your attendance request.' }, { status: 400 });
    if (!subjectId) return NextResponse.json({ success: false, error: 'Choose an attendance subject.' }, { status: 400 });
    const { data: subject } = subjectId ? await supabaseAdmin.from('attendance_subjects').select('id,student_id').eq('id', subjectId).maybeSingle() : { data: null };
    if (subjectId && (!subject || (subject.student_id !== auth.user!.id && subject.student_id !== null))) return NextResponse.json({ success: false, error: 'That attendance subject was not found on your account.' }, { status: 404 });
    const { data, error } = await supabaseAdmin.from('attendance_requests').insert({
      student_id: auth.user!.id, subject_id: subjectId, requested_date: requestedDate, reason, requested_status: requestedStatus,
    }).select().single();
    if (error) return NextResponse.json({ success: false, error: 'Unable to submit attendance request.' }, { status: 500 });
    return NextResponse.json({ success: true, request: { id: data.id, date: data.requested_date, reason: data.reason, requestedStatus: data.requested_status, status: data.status } }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid attendance request.' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const { id, status } = await req.json();
    if (typeof id !== 'string' || !['approved', 'rejected'].includes(status)) return NextResponse.json({ success: false, error: 'A request ID and approved/rejected status are required.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('attendance_requests').update({
      status, reviewed_by: auth.user!.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id).eq('status', 'pending').select().maybeSingle();
    if (error) return NextResponse.json({ success: false, error: 'Unable to review attendance request.' }, { status: 500 });
    if (!data) return NextResponse.json({ success: false, error: 'Request not found or already reviewed.' }, { status: 404 });
    return NextResponse.json({ success: true, id: data.id, status: data.status }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid review request.' }, { status: 400 });
  }
}
