import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    if (!db) {
      return NextResponse.json({ success: true, attendances: [] });
    }

    const snapshot = await db.collection('users').doc(docId).collection('attendance').get();
    const attendances = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, subject } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const attId = subject.id || 'att_' + Date.now();
    const attData = {
      ...subject,
      id: attId,
      history: subject.history || [],
    };

    if (db) {
      await db.collection('users').doc(docId).collection('attendance').doc(attId).set(attData);
    }

    return NextResponse.json({ success: true, subject: attData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, updated, action, status, date, note } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    if (!db) {
      return NextResponse.json({ success: true, id });
    }

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
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const docId = sanitizeId(userId);
    if (db) {
      await db.collection('users').doc(docId).collection('attendance').doc(id).delete();
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
