import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { requireUser, verifiedUserDocumentId } from '@/lib/supabase/request-auth';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Profile database is not configured.' }, { status: 503 });
  try {
    const docId = verifiedUserDocumentId(auth.user!.email!);
    const userDoc = await db.collection('users').doc(docId).get();
    if (!userDoc.exists) return NextResponse.json({ success: false, error: 'Profile not found. Sign in again to initialize your account.' }, { status: 404 });
    return NextResponse.json({ success: true, profile: userDoc.data()?.profile }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Profile GET failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load your profile.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Profile database is not configured. Changes were not saved.' }, { status: 503 });
  try {
    const body = await req.json();
    const updatedProfile = body?.updatedProfile;
    if (!updatedProfile || typeof updatedProfile !== 'object' || Array.isArray(updatedProfile)) {
      return NextResponse.json({ success: false, error: 'Valid profile updates are required.' }, { status: 400 });
    }
    const allowed = ['name', 'major', 'college', 'semester', 'studentId', 'gpa', 'bio', 'avatar', 'notificationPreferences'];
    const safe = Object.fromEntries(Object.entries(updatedProfile).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No editable profile fields supplied.' }, { status: 400 });
    const docId = verifiedUserDocumentId(auth.user!.email!);
    const userRef = db.collection('users').doc(docId);
    const snapshot = await userRef.get();
    if (!snapshot.exists) return NextResponse.json({ success: false, error: 'Profile not found.' }, { status: 404 });
    const current = snapshot.data()?.profile || {};
    const profile = { ...current, ...safe, id: docId, email: auth.user!.email };
    await userRef.set({ profile, updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ success: true, profile }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Profile PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save your profile.' }, { status: 500 });
  }
}
