import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVerifiedRequestUser, requireTeacher } from '@/lib/supabase/request-auth';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');
const unauthorized = () => NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
const unavailable = () => NextResponse.json({ success: false, error: 'Attendance storage is not configured.' }, { status: 503 });

async function resolveTarget(req: NextRequest, requestedUserId: string | null) {
  const user = await getVerifiedRequestUser(req);
  if (!user) return { user: null, target: null, response: unauthorized() };
  const isTeacher = user.app_metadata?.role === 'teacher';
  const target = requestedUserId || user.email || user.id;
  if (!isTeacher && target !== user.email && target !== user.id) {
    return { user, target: null, response: NextResponse.json({ success: false, error: 'You can only access your own attendance.' }, { status: 403 }) };
  }
  return { user, target, response: null };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveTarget(req, new URL(req.url).searchParams.get('userId'));
    if (resolved.response) return resolved.response;
    if (!db) return unavailable();
    const docId = sanitizeId(resolved.target!);
    const snapshot = await db.collection('users').doc(docId).collection('attendance').get();
    const attendances = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to load attendance.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { userId, subject } = body;
    if (!userId || !subject || typeof subject !== 'object') {
      return NextResponse.json({ success: false, error: 'Student and subject are required.' }, { status: 400 });
    }
    if (!db) return unavailable();
    const docId = sanitizeId(String(userId));
    const attId = String(subject.id || 'att_' + Date.now());
    const attData = { ...subject, id: attId, history: Array.isArray(subject.history) ? subject.history : [], updatedBy: auth.user!.id };
    await db.collection('users').doc(docId).collection('attendance').doc(attId).set(attData);
    return NextResponse.json({ success: true, subject: attData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to save attendance.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { userId, id, updated, action, status, date, note } = body;
    if (!userId || !id) return NextResponse.json({ success: false, error: 'Student and attendance ID are required.' }, { status: 400 });
    if (!db) return unavailable();
    const attRef = db.collection('users').doc(sanitizeId(String(userId))).collection('attendance').doc(String(id));
    if (action === 'mark') {
      if (!['Present', 'Absent', 'Cancelled'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid attendance status.' }, { status: 400 });
      }
      const result = await db.runTransaction(async (tx: any) => {
        const doc = await tx.get(attRef);
        if (!doc.exists) throw new Error('ATTENDANCE_NOT_FOUND');
        const data = doc.data() as any;
        let attended = Number(data.attendedClasses || 0);
        let total = Number(data.totalClasses || 0);
        if (status === 'Present') { attended += 1; total += 1; }
        else if (status === 'Absent') total += 1;
        const history = Array.isArray(data.history) ? data.history : [];
        const entry = { id: 'h_' + Date.now(), date: date || new Date().toISOString().slice(0, 10), status, note: typeof note === 'string' ? note.slice(0, 500) : '' };
        const next = { ...data, attendedClasses: attended, totalClasses: total, history: [entry, ...history] };
        tx.set(attRef, { attendedClasses: attended, totalClasses: total, history: next.history }, { merge: true });
        return next;
      });
      return NextResponse.json({ success: true, data: result });
    }
    if (!updated || typeof updated !== 'object') return NextResponse.json({ success: false, error: 'Updated attendance data is required.' }, { status: 400 });
    await attRef.set(updated, { merge: true });
    return NextResponse.json({ success: true, id, updated });
  } catch (error: any) {
    if (error.message === 'ATTENDANCE_NOT_FOUND') return NextResponse.json({ success: false, error: 'Subject not found.' }, { status: 404 });
    return NextResponse.json({ success: false, error: error.message || 'Unable to update attendance.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    if (!userId || !id) return NextResponse.json({ success: false, error: 'Student and attendance ID are required.' }, { status: 400 });
    if (!db) return unavailable();
    await db.collection('users').doc(sanitizeId(userId)).collection('attendance').doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to delete attendance.' }, { status: 500 });
  }
}
