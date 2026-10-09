import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    const snapshot = await db.collection('users').doc(docId).collection('sessions').get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, session } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const sesId = session.id || 'ses_' + Date.now();
    const sessionData = { ...session, id: sesId };

    await db.collection('users').doc(docId).collection('sessions').doc(sesId).set(sessionData);
    return NextResponse.json({ success: true, session: sessionData });
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
    await db.collection('users').doc(docId).collection('sessions').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
