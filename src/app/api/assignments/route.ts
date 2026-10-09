import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    const snapshot = await db.collection('users').doc(docId).collection('assignments').get();
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, assignment } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const asgId = assignment.id || 'asg_' + Date.now();
    const asgData = {
      ...assignment,
      id: asgId,
      createdAt: assignment.createdAt || new Date().toISOString().split('T')[0],
    };

    await db.collection('users').doc(docId).collection('assignments').doc(asgId).set(asgData);

    return NextResponse.json({ success: true, assignment: asgData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, updated } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const asgRef = db.collection('users').doc(docId).collection('assignments').doc(id);
    await asgRef.set(updated, { merge: true });

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
    await db.collection('users').doc(docId).collection('assignments').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
