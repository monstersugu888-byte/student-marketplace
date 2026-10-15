import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { requireTeacher, requireUser, verifiedUserDocumentId } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Assignment database is not configured.' }, { status: 503, headers: noStore });
  try {
    // Assignments are shared classroom records; each student's work is stored separately.
    const [snapshot, submissions] = await Promise.all([
      db.collection('assignments').get(),
      db.collection('users').doc(verifiedUserDocumentId(auth.user!.email!)).collection('assignment_submissions').get(),
    ]);
    const byAssignment = new Map(submissions.docs.map((doc: any) => [doc.id, doc.data()]));
    const assignments = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const submission = byAssignment.get(doc.id) || {};
      return { id: doc.id, ...data, ...submission, assignmentId: doc.id };
    });
    return NextResponse.json({ success: true, assignments }, { headers: noStore });
  } catch (error) {
    console.error('Assignments GET failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load assignments.' }, { status: 500, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Assignment database is not configured. Assignment was not saved.' }, { status: 503 });
  try {
    const body = await req.json();
    const assignment = body?.assignment;
    if (!assignment || typeof assignment !== 'object' || !String(assignment.title || '').trim()) {
      return NextResponse.json({ success: false, error: 'A valid assignment title is required.' }, { status: 400 });
    }
    // Preserve the client-generated ID so the UI and stored record always refer to the same assignment.
    const id = typeof assignment.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(assignment.id)
      ? assignment.id : 'asg_' + crypto.randomUUID();
    const data = {
      title: String(assignment.title).trim(),
      description: String(assignment.description || ''),
      subject: String(assignment.subject || ''),
      dueDate: assignment.dueDate || null,
      createdBy: auth.user!.id,
      createdByEmail: auth.user!.email,
      createdAt: new Date().toISOString(),
      status: 'Not Started',
    };
    await db.collection('assignments').doc(id).create(data);
    return NextResponse.json({ success: true, assignment: { id, ...data } }, { status: 201, headers: noStore });
  } catch (error: any) {
    if (error?.code === 6 || error?.code === 'already-exists') {
      return NextResponse.json({ success: false, error: 'That assignment ID already exists. Refresh and try again.' }, { status: 409 });
    }
    console.error('Assignments POST failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save assignment.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Assignment database is not configured. Changes were not saved.' }, { status: 503 });
  try {
    const body = await req.json();
    const { id, updated } = body || {};
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id) || !updated || typeof updated !== 'object' || Array.isArray(updated)) {
      return NextResponse.json({ success: false, error: 'A valid assignment ID and updates are required.' }, { status: 400 });
    }
    const assignmentRef = db.collection('assignments').doc(id);
    const assignmentSnap = await assignmentRef.get();
    if (!assignmentSnap.exists) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });

    if (auth.user!.app_metadata?.role === 'teacher') {
      if (assignmentSnap.data()?.createdBy !== auth.user!.id) {
        return NextResponse.json({ success: false, error: 'You can only edit assignments you created.' }, { status: 403 });
      }
      const allowed = ['title', 'description', 'subject', 'dueDate'];
      const safe = Object.fromEntries(Object.entries(updated).filter(([key]) => allowed.includes(key)));
      if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No editable assignment fields supplied.' }, { status: 400 });
      await assignmentRef.set(safe, { merge: true });
      return NextResponse.json({ success: true, id, updated: safe }, { headers: noStore });
    }

    // Students can only change their own submission/progress, never assignment instructions or approval.
    const allowedStudentFields = ['status', 'completed', 'submissionUrl', 'submissionPath', 'submittedAt'];
    const safe = Object.fromEntries(Object.entries(updated).filter(([key]) => allowedStudentFields.includes(key)));
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No permitted submission fields supplied.' }, { status: 403 });
    const userDocId = verifiedUserDocumentId(auth.user!.email!);
    await db.collection('users').doc(userDocId).collection('assignment_submissions').doc(id).set({
      ...safe,
      assignmentId: id,
      studentId: auth.user!.id,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ success: true, id, updated: safe }, { headers: noStore });
  } catch (error) {
    console.error('Assignments PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update assignment.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Assignment database is not configured. Assignment was not deleted.' }, { status: 503 });
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) return NextResponse.json({ success: false, error: 'A valid assignment ID is required.' }, { status: 400 });
    const ref = db.collection('assignments').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });
    if (snap.data()?.createdBy !== auth.user!.id) return NextResponse.json({ success: false, error: 'You can only delete assignments you created.' }, { status: 403 });
    await ref.delete();
    return NextResponse.json({ success: true, id }, { headers: noStore });
  } catch (error) {
    console.error('Assignments DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete assignment.' }, { status: 500 });
  }
}
