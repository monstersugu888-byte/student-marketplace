import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { requireTeacher, requireUser, verifiedUserDocumentId } from '@/lib/supabase/request-auth';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const docId = verifiedUserDocumentId(auth.user!.email!);
    if (!db) return NextResponse.json({ success: false, error: 'Database is not configured. Assignment data was not loaded.' }, { status: 503 });
    const snapshot = await db.collection('users').doc(docId).collection('assignments').get();
    const assignments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, assignments }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Assignments GET failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load assignments.' }, { status: 500 });
  }
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
    if (!db) return NextResponse.json({ success: false, error: 'Database is not configured. Assignment was not saved.' }, { status: 503 });

    const docId = verifiedUserDocumentId(auth.user!.email!);
    const asgId = 'asg_' + crypto.randomUUID();
    const asgData = {
      ...assignment,
      id: asgId,
      createdBy: auth.user!.id,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'Not Started',
    };
    await db.collection('users').doc(docId).collection('assignments').doc(asgId).create(asgData);
    return NextResponse.json({ success: true, assignment: asgData }, { status: 201 });
  } catch (error) {
    console.error('Assignments POST failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save assignment.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { id, updated } = body;
    if (typeof id !== 'string' || !id || !updated || typeof updated !== 'object') {
      return NextResponse.json({ success: false, error: 'Assignment ID and updates are required.' }, { status: 400 });
    }
    if (!db) return NextResponse.json({ success: false, error: 'Database is not configured. Assignment was not updated.' }, { status: 503 });

    const docId = verifiedUserDocumentId(auth.user!.email!);
    const ref = db.collection('users').doc(docId).collection('assignments').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });

    // Students may update progress fields only; only teachers can change assignment instructions.
    const allowedStudentFields = ['status', 'completed', 'submissionUrl', 'submissionPath', 'submittedAt'];
    const safeUpdate = auth.user!.app_metadata?.role === 'teacher'
      ? updated
      : Object.fromEntries(Object.entries(updated).filter(([key]) => allowedStudentFields.includes(key)));
    if (!Object.keys(safeUpdate).length) return NextResponse.json({ success: false, error: 'No permitted fields to update.' }, { status: 403 });

    await ref.set(safeUpdate, { merge: true });
    return NextResponse.json({ success: true, id, updated: safeUpdate });
  } catch (error) {
    console.error('Assignments PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update assignment.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing assignment ID.' }, { status: 400 });
    if (!db) return NextResponse.json({ success: false, error: 'Database is not configured. Assignment was not deleted.' }, { status: 503 });

    const docId = verifiedUserDocumentId(auth.user!.email!);
    const ref = db.collection('users').doc(docId).collection('assignments').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });
    if (auth.user!.app_metadata?.role !== 'teacher' && snapshot.data()?.createdBy) {
      return NextResponse.json({ success: false, error: 'Only teachers can delete teacher-created assignments.' }, { status: 403 });
    }
    await ref.delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Assignments DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete assignment.' }, { status: 500 });
  }
}
