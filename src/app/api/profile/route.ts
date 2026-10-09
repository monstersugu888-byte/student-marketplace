import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    const userDoc = await db.collection('users').doc(docId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: userDoc.data()?.profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, updatedProfile } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const userRef = db.collection('users').doc(docId);
    await userRef.set(
      {
        profile: updatedProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
