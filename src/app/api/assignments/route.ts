import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher, requireUser } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };
const validId = /^[a-zA-Z0-9_-]{1,120}$/;

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { data: rows, error } = await supabaseAdmin
    .from('assignments').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Assignments GET:', error.message);
    return NextResponse.json({ success: false, error: 'Unable to load assignments. Check that the Supabase migration has been applied.' }, { status: 503, headers: noStore });
  }
  const { data: submissions, error: subError } = await supabaseAdmin
    .from('assignment_submissions').select('*').eq('student_id', auth.user!.id);
  if (subError) return NextResponse.json({ success: false, error: 'Unable to load your assignment submissions.' }, { status: 500, headers: noStore });
  const byAssignment = new Map((submissions || []).map(s => [s.assignment_id, s]));
  const assignments = await Promise.all((rows || []).map(async a => {
    const submission = byAssignment.get(a.id);
    let submissionUrl = submission?.submission_url || '';
    if (submission?.submission_path) {
      const { data } = await supabaseAdmin.storage.from('study-materials').createSignedUrl(submission.submission_path, 600);
      submissionUrl = data?.signedUrl || '';
    }
    return {
      id: a.id, title: a.title, description: a.description, subject: a.subject,
      dueDate: a.due_date, priority: a.priority, createdAt: a.created_at,
      createdBy: a.created_by, status: submission?.status === 'approved' ? 'Completed' : (submission?.status === 'pending' ? 'In Progress' : 'Not Started'),
      submissionUrl, submissionText: submission?.submission_text || '',
      submissionStatus: submission?.status || null, feedback: submission?.feedback || '',
      submittedAt: submission?.submitted_at || null,
    };
  }));
  return NextResponse.json({ success: true, assignments }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const assignment = body?.assignment;
    if (!assignment || typeof assignment !== 'object' || !String(assignment.title || '').trim()) {
      return NextResponse.json({ success: false, error: 'A valid assignment title is required.' }, { status: 400 });
    }
    const id = typeof assignment.id === 'string' && validId.test(assignment.id) ? assignment.id : 'asg_' + crypto.randomUUID();
    const row = {
      id, title: String(assignment.title).trim(), description: String(assignment.description || ''),
      subject: String(assignment.subject || ''), due_date: assignment.dueDate || null,
      priority: ['Low', 'Medium', 'High'].includes(assignment.priority) ? assignment.priority : 'Medium',
      created_by: auth.user!.id,
    };
    const { data, error } = await supabaseAdmin.from('assignments').insert(row).select().single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ success: false, error: 'That assignment ID already exists. Refresh and try again.' }, { status: 409 });
      console.error('Assignments POST:', error.message);
      return NextResponse.json({ success: false, error: 'Unable to save assignment. Verify the Supabase migration.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, assignment: { ...data, dueDate: data.due_date, createdAt: data.created_at } }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid assignment request.' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { id, updated } = body || {};
    if (typeof id !== 'string' || !validId.test(id) || !updated || typeof updated !== 'object' || Array.isArray(updated)) {
      return NextResponse.json({ success: false, error: 'A valid assignment ID and updates are required.' }, { status: 400 });
    }
    const { data: assignment, error: assignmentError } = await supabaseAdmin.from('assignments').select('id,created_by').eq('id', id).maybeSingle();
    if (assignmentError) return NextResponse.json({ success: false, error: 'Unable to verify assignment.' }, { status: 500 });
    if (!assignment) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });

    const { data: profile } = await supabaseAdmin.from('profiles').select('role,teacher_access_status').eq('id', auth.user!.id).maybeSingle();
    const isTeacher = profile?.role === 'teacher' && profile?.teacher_access_status === 'approved';
    if (isTeacher) {
      if (assignment.created_by !== auth.user!.id) return NextResponse.json({ success: false, error: 'You can only edit assignments you created.' }, { status: 403 });
      const mapping: Record<string, string> = { title: 'title', description: 'description', subject: 'subject', dueDate: 'due_date', priority: 'priority' };
      const safe = Object.fromEntries(Object.entries(updated).filter(([k]) => k in mapping).map(([k, v]) => [mapping[k], v]));
      if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No editable assignment fields supplied.' }, { status: 400 });
      const { error } = await supabaseAdmin.from('assignments').update(safe).eq('id', id).eq('created_by', auth.user!.id);
      if (error) return NextResponse.json({ success: false, error: 'Unable to update assignment.' }, { status: 500 });
      return NextResponse.json({ success: true, id, updated: safe }, { headers: noStore });
    }

    const allowed: Record<string, string> = { submissionUrl: 'submission_url', submissionText: 'submission_text', submissionPath: 'submission_path', status: 'status' };
    const safe = Object.fromEntries(Object.entries(updated).filter(([k]) => k in allowed).map(([k, v]) => [allowed[k], v]));
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'Students may only submit work for review.' }, { status: 403 });
    const status = safe.status;
    if (status && !['pending', 'rejected'].includes(String(status))) delete safe.status;
    if (safe.submission_path || safe.submission_url || safe.submission_text) safe.status = 'pending';
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'Invalid submission status.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('assignment_submissions').upsert({
      assignment_id: id, student_id: auth.user!.id, ...safe,
      status: 'pending', submitted_at: new Date().toISOString(), reviewed_by: null, reviewed_at: null,
    }, { onConflict: 'assignment_id,student_id' });
    if (error) return NextResponse.json({ success: false, error: 'Unable to submit assignment.' }, { status: 500 });
    return NextResponse.json({ success: true, id, updated: { ...updated, status: 'pending' } }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid assignment update.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !validId.test(id)) return NextResponse.json({ success: false, error: 'A valid assignment ID is required.' }, { status: 400 });
  const { data: assignment } = await supabaseAdmin.from('assignments').select('id,created_by').eq('id', id).maybeSingle();
  if (!assignment) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });
  if (assignment.created_by !== auth.user!.id) return NextResponse.json({ success: false, error: 'You can only delete assignments you created.' }, { status: 403 });
  const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id).eq('created_by', auth.user!.id);
  if (error) return NextResponse.json({ success: false, error: 'Unable to delete assignment.' }, { status: 500 });
  return NextResponse.json({ success: true, id }, { headers: noStore });
}
