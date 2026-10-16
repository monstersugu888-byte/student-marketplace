import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVerifiedRequestUser, requireTeacher } from '@/lib/supabase/request-auth';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');
const unavailable = () => NextResponse.json({ success: false, error: 'Assignment storage is not configured.' }, { status: 503 });

async function resolveTarget(req: NextRequest, requestedUserId: string | null) {
  const user = await getVerifiedRequestUser(req);
  if (!user) return { user: null, target: null, response: NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 }) };
  const isTeacher = user.app_metadata?.role === 'teacher';
  const target = requestedUserId || user.email || user.id;
  if (!isTeacher && target !== user.email && target !== user.id) {
    return { user, target: null, response: NextResponse.json({ success: false, error: 'You can only access your own assignments.' }, { status: 403 }) };
  }
  return { user, target, response: null };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveTarget(req, new URL(req.url).searchParams.get('userId'));
    if (resolved.response) return resolved.response;
    if (!db) return unavailable();
    const snapshot = await db.collection('users').doc(sanitizeId(resolved.target!)).collection('assignments').get();
    return NextResponse.json({ success: true, assignments: snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to load assignments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { userId, assignment } = body;
    if (!userId || !assignment || typeof assignment !== 'object') return NextResponse.json({ success: false, error: 'Target and assignment are required.' }, { status: 400 });
    if (!db) return unavailable();
    const id = String(assignment.id || 'asg_' + Date.now());
    const record = { ...assignment, id, createdAt: assignment.createdAt || new Date().toISOString(), createdBy: auth.user!.id };
    await db.collection('users').doc(sanitizeId(String(userId))).collection('assignments').doc(id).set(record);
    return NextResponse.json({ success: true, assignment: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to save assignment.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, updated } = body;
    if (!userId || !id || !updated || typeof updated !== 'object') return NextResponse.json({ success: false, error: 'Target, assignment ID and update are required.' }, { status: 400 });
    const user = await (async () => {
      const { getVerifiedRequestUser } = await import('@/lib/supabase/request-auth');
      return getVerifiedRequestUser(req);
    })();
    if (!user) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    const isTeacher = user.app_metadata?.role === 'teacher';
    const target = String(userId);
    if (!isTeacher && target !== user.email && target !== user.id) return NextResponse.json({ success: false, error: 'You can only update your own assignments.' }, { status: 403 });
    if (!db) return unavailable();
    const ref = db.collection('users').doc(sanitizeId(target)).collection('assignments').doc(String(id));
    if (isTeacher) {
      await ref.set(updated, { merge: true });
    } else {
      const allowedKeys = Object.keys(updated);
      if (allowedKeys.length !== 1 || allowedKeys[0] !== 'status' || !['Completed', 'completed', 'submitted'].includes(String(updated.status))) {
        return NextResponse.json({ success: false, error: 'Students may only mark their own assignment as completed.' }, { status: 403 });
      }
      await ref.set({ status: updated.status, completedAt: new Date().toISOString() }, { merge: true });
    }
    return NextResponse.json({ success: true, id, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to update assignment.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    if (!userId || !id) return NextResponse.json({ success: false, error: 'Target and assignment ID are required.' }, { status: 400 });
    if (!db) return unavailable();
    await db.collection('users').doc(sanitizeId(userId)).collection('assignments').doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to delete assignment.' }, { status: 500 });
  }
}
