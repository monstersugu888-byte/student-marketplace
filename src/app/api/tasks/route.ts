import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    const snapshot = await db.collection('users').doc(docId).collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, task } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const taskId = task.id || 'tsk_' + Date.now();
    const taskData = { ...task, id: taskId };

    await db.collection('users').doc(docId).collection('tasks').doc(taskId).set(taskData);
    return NextResponse.json({ success: true, task: taskData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, completed } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const taskRef = db.collection('users').doc(docId).collection('tasks').doc(id);
    await taskRef.set({ completed }, { merge: true });

    return NextResponse.json({ success: true, id, completed });
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
    await db.collection('users').doc(docId).collection('tasks').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
