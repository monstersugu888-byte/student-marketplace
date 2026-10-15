import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { requireTeacher, requireUser, verifiedUserDocumentId } from '@/lib/supabase/request-auth';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const docId = auth.user!.app_metadata?.role === 'teacher' && requestedUserId
      ? sanitizeId(requestedUserId)
      : verifiedUserDocumentId(auth.user!.email!);

    if (!db) {
      return NextResponse.json({ success: false, error: 'Attendance database is not configured.' }, { status: 503 });
    }

    const snapshot = await db.collection('users').doc(docId).collection('attendance').get();
    const attendances = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { subject } = body;
    if (!subject || typeof subject !== 'object') return NextResponse.json({ success: false, error: 'Attendance subject is required.' }, { status: 400 });
    const docId = verifiedUserDocumentId(auth.user!.email!);

    const attId = subject.id || 'att_' + Date.now();
    const attData = {
      ...subject,
      id: attId,
      history: subject.history || [],
    };

    if (!db) return NextResponse.json({ success: false, error: 'Attendance database is not configured. Changes were not saved.' }, { status: 503 });
    await db.collection('users').doc(docId).collection('attendance').doc(attId).set(attData);

    return NextResponse.json({ success: true, subject: attData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { userId, id, updated, action, status, date, note } = body;
    const docId = auth.user!.app_metadata?.role === 'teacher' && userId
      ? sanitizeId(userId)
      : verifiedUserDocumentId(auth.user!.email!);

    if (!db) return NextResponse.json({ success: false, error: 'Attendance database is not configured. Changes were not saved.' }, { status: 503 });

    const attRef = db.collection('users').doc(docId).collection('attendance').doc(id);

    if (action === 'mark') {
      const doc = await attRef.get();
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
      }
      const data = doc.data() as any;
      let newAttended = data.attendedClasses || 0;
      let newTotal = data.totalClasses || 0;
      const history = data.history || [];

      if (status === 'Present') {
        newAttended += 1;
        newTotal += 1;
      } else if (status === 'Absent') {
        newTotal += 1;
      }

      const newLog = {
        id: 'h_' + Date.now(),
        date: date || new Date().toISOString().split('T')[0],
        status,
        note: note || '',
      };

      await attRef.set(
        {
          attendedClasses: newAttended,
          totalClasses: newTotal,
          history: [newLog, ...history],
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        data: { ...data, attendedClasses: newAttended, totalClasses: newTotal, history: [newLog, ...history] }
      });
    }

    await attRef.set(updated, { merge: true });
    return NextResponse.json({ success: true, id, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const userId = auth.user!.app_metadata?.role === 'teacher' && requestedUserId ? requestedUserId : auth.user!.email!;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const docId = sanitizeId(userId);
    if (!db) return NextResponse.json({ success: false, error: 'Attendance database is not configured. Record was not deleted.' }, { status: 503 });
    await db.collection('users').doc(docId).collection('attendance').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
