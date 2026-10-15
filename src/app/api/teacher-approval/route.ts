import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const runtime = 'nodejs';

function verify(token: string) {
  const secret = process.env.TEACHER_APPROVAL_SECRET;
  if (!secret) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof value.userId !== 'string' || !['approve', 'reject'].includes(value.action) || typeof value.exp !== 'number' || value.exp < Math.floor(Date.now() / 1000)) return null;
    return value as { userId: string; action: 'approve' | 'reject'; exp: number };
  } catch { return null; }
}
async function adminAuth(path: string, method: string, body?: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server configuration');
  return fetch(`${url}/auth/v1/admin/${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store',
  });
}
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (typeof token !== 'string' || token.length > 3000) return NextResponse.json({ error: 'Invalid approval link.' }, { status: 400 });
    const claim = verify(token);
    if (!claim) return NextResponse.json({ error: 'This link is invalid or expired. Request a new teacher registration notification.' }, { status: 400 });
    const response = await adminAuth(`users/${encodeURIComponent(claim.userId)}`, 'GET');
    if (!response.ok) return NextResponse.json({ error: 'Teacher account was not found.' }, { status: 404 });
    const user = await response.json();
    if (user.app_metadata?.teacher_access_status !== 'pending' || user.app_metadata?.role !== 'teacher_applicant') {
      return NextResponse.json({ error: 'This request has already been reviewed or is no longer pending.' }, { status: 409 });
    }
    const approved = claim.action === 'approve';
    const update = await adminAuth(`users/${encodeURIComponent(claim.userId)}`, 'PUT', {
      app_metadata: { ...(user.app_metadata || {}), role: approved ? 'teacher' : 'teacher_applicant', teacher_access_status: approved ? 'approved' : 'rejected' },
    });
    if (!update.ok) return NextResponse.json({ error: 'Could not update teacher permissions.' }, { status: 500 });
    return NextResponse.json({ success: true, status: approved ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Teacher approval action failed:', error);
    return NextResponse.json({ error: 'Could not process this decision.' }, { status: 500 });
  }
}
