import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVerifiedRequestUser, requireTeacher } from '@/lib/supabase/request-auth';

const clean = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const idFor = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');
const unavailable = () => NextResponse.json({ success: false, error: 'Attendance request storage is not configured.' }, { status: 503 });

export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  if (!db) return unavailable();
  try {
    const snapshot = await db.collectionGroup('attendanceRequests').where('status', '==', 'pending').limit(100).get();
    const requests = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Could not load requests.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getVerifiedRequestUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Please sign in with a verified account.' }, { status: 401 });
  if (user.app_metadata?.role === 'teacher') return NextResponse.json({ success: false, error: 'Teachers manage attendance directly; only students can submit requests.' }, { status: 403 });
  if (!db) return unavailable();
  try {
    const body = await req.json();
    const subject = clean(body.subject, 120);
    const code = clean(body.code, 40);
    const message = clean(body.message, 500);
    if (!subject || !message) return NextResponse.json({ success: false, error: 'Subject and request details are required.' }, { status: 400 });
    const studentId = user.email || user.id;
    const ref = db.collection('users').doc(idFor(studentId)).collection('attendanceRequests').doc();
    const request = { id: ref.id, studentId, studentEmail: user.email || '', studentName: clean(user.user_metadata?.full_name, 120) || user.email?.split('@')[0] || 'Student', subject, code, message, status: 'pending', createdAt: new Date().toISOString() };
    await ref.set(request);
    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Could not submit attendance request.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  if (!db) return unavailable();
  try {
    const body = await req.json();
    const studentId = clean(body.studentId, 254);
    const requestId = clean(body.requestId, 180);
    const decision = body.decision;
    const note = clean(body.note, 500);
    if (!studentId || !requestId || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Student, request and a valid decision are required.' }, { status: 400 });
    }
    const requestRef = db.collection('users').doc(idFor(studentId)).collection('attendanceRequests').doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return NextResponse.json({ success: false, error: 'Request not found.' }, { status: 404 });
    const request = requestSnap.data() as any;
    if (request.status !== 'pending') return NextResponse.json({ success: false, error: 'This request has already been reviewed.' }, { status: 409 });
    await requestRef.set({ status: decision, reviewedBy: auth.user!.id, reviewedAt: new Date().toISOString(), reviewNote: note }, { merge: true });
    if (decision === 'approved') {
      const attendanceRef = db.collection('users').doc(idFor(studentId)).collection('attendance').doc('att_' + idFor(request.code || request.subject));
      const old = await attendanceRef.get();
      const previous = old.exists ? old.data() as any : {};
      await attendanceRef.set({
        ...previous,
        id: attendanceRef.id,
        subject: request.subject,
        code: request.code || '',
        instructor: clean(auth.user!.user_metadata?.full_name, 120) || auth.user!.email || 'Teacher',
        attendedClasses: Number(previous.attendedClasses || 0),
        totalClasses: Number(previous.totalClasses || 0),
        targetPercentage: Number(previous.targetPercentage || 75),
        history: Array.isArray(previous.history) ? previous.history : [],
        updatedBy: auth.user!.id,
      }, { merge: true });
    }
    return NextResponse.json({ success: true, status: decision });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Could not review request.' }, { status: 500 });
  }
}
