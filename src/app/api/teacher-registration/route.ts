import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

export const runtime = 'nodejs';
const adminEmail = 'moonjikko2@gmail.com';
const secret = () => process.env.TEACHER_APPROVAL_SECRET;
const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

async function adminAuth(path: string, method: string, body?: unknown) {
  const url = supabaseUrl();
  const key = serviceKey();
  if (!url || !key) throw new Error('Missing Supabase server configuration');
  return fetch(`${url}/auth/v1/admin/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
}
function sign(userId: string, action: 'approve' | 'reject', exp: number) {
  const payload = Buffer.from(JSON.stringify({ userId, action, exp })).toString('base64url');
  const sig = createHmac('sha256', secret()!).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
export async function POST(req: NextRequest) {
  try {
    if (!secret() || !supabaseUrl() || !serviceKey() || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Teacher approval email is not configured. Ask the site administrator to finish the server environment setup.' }, { status: 503 });
    }
    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId || userId.length > 100) return NextResponse.json({ error: 'Invalid registration.' }, { status: 400 });

    const userResponse = await adminAuth(`users/${encodeURIComponent(userId)}`, 'GET');
    if (!userResponse.ok) return NextResponse.json({ error: 'Could not verify this registration.' }, { status: 400 });
    const user = await userResponse.json();
    const metadata = user.user_metadata || {};
    if (metadata.requested_role !== 'teacher' || !user.email) {
      return NextResponse.json({ error: 'This is not a valid teacher registration.' }, { status: 400 });
    }

    const update = await adminAuth(`users/${encodeURIComponent(userId)}`, 'PUT', {
      app_metadata: { ...(user.app_metadata || {}), role: 'teacher_applicant', teacher_access_status: 'pending' },
    });
    if (!update.ok) return NextResponse.json({ error: 'Could not mark the teacher application as pending.' }, { status: 500 });

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3;
    const origin = req.nextUrl.origin;
    const approve = sign(userId, 'approve', exp);
    const reject = sign(userId, 'reject', exp);
    const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>CampusMate teacher access request</h2><p>A new teacher has requested access. Review the details before deciding.</p><table cellpadding="8" style="border-collapse:collapse"><tr><td><b>Name</b></td><td>${esc(metadata.full_name)}</td></tr><tr><td><b>Email</b></td><td>${esc(user.email)}</td></tr><tr><td><b>Department</b></td><td>${esc(metadata.department)}</td></tr><tr><td><b>Staff ID</b></td><td>${esc(metadata.staff_id || 'Not provided')}</td></tr></table><p>These links expire in 3 days. Opening a link does not decide the request; the next page requires a confirmation click.</p><p><a style="display:inline-block;padding:12px 18px;background:#15803d;color:white;text-decoration:none;border-radius:8px" href="${origin}/teacher-approval?token=${encodeURIComponent(approve)}">Review approval</a> <a style="display:inline-block;padding:12px 18px;background:#b91c1c;color:white;text-decoration:none;border-radius:8px" href="${origin}/teacher-approval?token=${encodeURIComponent(reject)}">Review rejection</a></p></div>`;
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || 'CampusMate <onboarding@resend.dev>', to: [adminEmail], subject: `Teacher access request: ${metadata.full_name || user.email}`, html }),
    });
    if (!mail.ok) {
      console.error('Resend send failed:', await mail.text());
      return NextResponse.json({ error: 'The application was saved as pending, but the admin email could not be sent. Check Resend configuration.' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher registration notification error:', error);
    return NextResponse.json({ error: 'Could not notify the administrator. Please contact support.' }, { status: 500 });
  }
}
