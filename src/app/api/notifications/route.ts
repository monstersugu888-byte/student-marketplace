import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    if (!db) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    const snapshot = await db.collection('users').doc(docId).collection('notifications').get();
    const notifications = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, markAll } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    if (!db) {
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    const notifCollection = db.collection('users').doc(docId).collection('notifications');

    if (markAll) {
      const snapshot = await notifCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.set(doc.ref, { read: true }, { merge: true });
      });
      await batch.commit();
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    if (id) {
      await notifCollection.doc(id).set({ read: true }, { merge: true });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
