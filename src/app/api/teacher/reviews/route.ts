import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  const [submissionsResult, requestsResult, assignmentsResult, profilesResult] = await Promise.all([
    supabaseAdmin.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
    supabaseAdmin.from('attendance_requests').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('assignments').select('id,title,subject,created_by'),
    supabaseAdmin.from('profiles').select('id,full_name,email'),
  ]);
  if (submissionsResult.error || requestsResult.error || assignmentsResult.error || profilesResult.error) {
    return NextResponse.json({ success: false, error: 'Unable to load teacher reviews. Apply the Supabase migration first.' }, { status: 503, headers: noStore });
  }
  const assignmentMap = new Map((assignmentsResult.data || []).map(row => [row.id, row]));
  const profileMap = new Map((profilesResult.data || []).map(row => [row.id, row]));
  const submissions = await Promise.all((submissionsResult.data || []).filter(row => assignmentMap.get(row.assignment_id)?.created_by === auth.user!.id).map(async row => {
    let submissionUrl = row.submission_url || '';
    if (row.submission_path) {
      const { data } = await supabaseAdmin.storage.from('study-materials').createSignedUrl(row.submission_path, 600);
      submissionUrl = data?.signedUrl || '';
    }
    return {
      id: row.id, assignmentId: row.assignment_id, assignmentTitle: assignmentMap.get(row.assignment_id)?.title || row.assignment_id,
      subject: assignmentMap.get(row.assignment_id)?.subject || '', studentId: row.student_id,
      studentName: profileMap.get(row.student_id)?.full_name || profileMap.get(row.student_id)?.email || 'Student',
      submissionUrl, submissionText: row.submission_text, status: row.status,
      submittedAt: row.submitted_at, feedback: row.feedback,
    };
  }));
  const attendanceRequests = (requestsResult.data || []).map(row => ({
    id: row.id, studentId: row.student_id,
    studentName: profileMap.get(row.student_id)?.full_name || profileMap.get(row.student_id)?.email || 'Student',
    subjectId: row.subject_id, date: row.requested_date, reason: row.reason, requestedStatus: row.requested_status, status: row.status, createdAt: row.created_at,
  }));
  return NextResponse.json({ success: true, submissions, attendanceRequests }, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const { type, id, status, feedback } = await req.json();
    if (typeof id !== 'string' || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'A review ID and approved/rejected status are required.' }, { status: 400 });
    }
    if (type === 'attendance') {
      const { data: request, error: requestReadError } = await supabaseAdmin.from('attendance_requests').select('*').eq('id', id).eq('status', 'pending').maybeSingle();
      if (requestReadError) return NextResponse.json({ success: false, error: 'Unable to load attendance request.' }, { status: 500 });
      if (!request) return NextResponse.json({ success: false, error: 'Request not found or already reviewed.' }, { status: 404 });
      if (status === 'approved') {
        if (!request.subject_id) return NextResponse.json({ success: false, error: 'This request has no attendance subject attached.' }, { status: 400 });
        const { data: template, error: templateError } = await supabaseAdmin.from('attendance_subjects').select('*').eq('id', request.subject_id).maybeSingle();
        if (templateError || !template) return NextResponse.json({ success: false, error: 'Attendance subject was not found.' }, { status: 404 });
        let record = template;
        if (template.student_id !== request.student_id) {
          const targetId = `${template.id}_${request.student_id.replace(/-/g,'').slice(0,8)}`.slice(0,120);
          const { data: existing } = await supabaseAdmin.from('attendance_subjects').select('*').eq('id', targetId).eq('student_id', request.student_id).maybeSingle();
          if (existing) record = existing;
          else {
            const { data: created, error: createError } = await supabaseAdmin.from('attendance_subjects').insert({
              id: targetId, student_id: request.student_id, subject: template.subject, code: template.code,
              instructor: template.instructor, attended_classes: 0, total_classes: 0,
              target_percentage: template.target_percentage, history: [],
            }).select().single();
            if (createError) return NextResponse.json({ success: false, error: 'Unable to create the student attendance record.' }, { status: 500 });
            record = created;
          }
        }
        const history = Array.isArray(record.history) ? record.history : [];
        const requestedStatus = request.requested_status === 'Absent' ? 'Absent' : 'Present';
        const log = { id: 'h_' + crypto.randomUUID(), date: request.requested_date, status: requestedStatus, note: 'Approved attendance request' };
        const { error: markError } = await supabaseAdmin.from('attendance_subjects').update({
          total_classes: Number(record.total_classes || 0) + 1,
          attended_classes: Number(record.attended_classes || 0) + (requestedStatus === 'Present' ? 1 : 0),
          history: [log, ...history], updated_at: new Date().toISOString(),
        }).eq('id', record.id).eq('student_id', request.student_id);
        if (markError) return NextResponse.json({ success: false, error: 'Could not apply the approved attendance request.' }, { status: 500 });
      }
      const { data, error } = await supabaseAdmin.from('attendance_requests').update({
        status, reviewed_by: auth.user!.id, reviewed_at: new Date().toISOString(),
      }).eq('id', id).eq('status', 'pending').select('id,status').maybeSingle();
      if (error) return NextResponse.json({ success: false, error: 'Unable to review attendance request.' }, { status: 500 });
      if (!data) return NextResponse.json({ success: false, error: 'Request was already reviewed.' }, { status: 404 });
      return NextResponse.json({ success: true, ...data }, { headers: noStore });
    }
    if (type !== 'assignment') return NextResponse.json({ success: false, error: 'Review type must be assignment or attendance.' }, { status: 400 });
    const { data: submission, error: submissionError } = await supabaseAdmin.from('assignment_submissions').select('assignment_id').eq('id', id).maybeSingle();
    if (submissionError) return NextResponse.json({ success: false, error: 'Unable to verify submission.' }, { status: 500 });
    if (!submission) return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    const { data: assignment, error: assignmentError } = await supabaseAdmin.from('assignments').select('created_by').eq('id', submission.assignment_id).maybeSingle();
    if (assignmentError) return NextResponse.json({ success: false, error: 'Unable to verify assignment owner.' }, { status: 500 });
    if (assignment?.created_by !== auth.user!.id) return NextResponse.json({ success: false, error: 'You can only review submissions for assignments you created.' }, { status: 403 });
    const { data, error } = await supabaseAdmin.from('assignment_submissions').update({
      status, feedback: String(feedback || ''), reviewed_by: auth.user!.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id).eq('status', 'pending').select('id,status').maybeSingle();
    if (error) return NextResponse.json({ success: false, error: 'Unable to review assignment submission.' }, { status: 500 });
    if (!data) return NextResponse.json({ success: false, error: 'Submission not found or already reviewed.' }, { status: 404 });
    return NextResponse.json({ success: true, ...data }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid review request.' }, { status: 400 });
  }
}
