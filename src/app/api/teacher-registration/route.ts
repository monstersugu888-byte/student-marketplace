import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

export const runtime = 'nodejs';
const adminEmail = process.env.TEACHER_APPROVAL_EMAIL || 'moonjikko2@gmail.com';
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
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
}
function sign(userId: string, action: 'approve' | 'reject', exp: number) {
  const payload = Buffer.from(JSON.stringify({ userId, action, exp })).toString('base64url');
  const sig = createHmac('sha256', secret()!).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replaceAll('"', '&quot;');

export async function POST(req: NextRequest) {
  let createdUserId = '';
  try {
    if (!secret() || !supabaseUrl() || !serviceKey() || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Teacher applications are not configured yet. The site administrator must finish the server environment setup.' }, { status: 503 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const department = typeof body.department === 'string' ? body.department.trim() : '';
    const staffId = typeof body.staffId === 'string' ? body.staffId.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        !department || department.length > 120 || staffId.length > 80 || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Check your details. Enter a valid email, name, department, and password of at least 8 characters.' }, { status: 400 });
    }

    // Create the account server-side so Supabase does not try to send its own
    // confirmation email (which was blocking registration with SMTP errors).
    // Teacher privileges are still denied until the administrator approves.
    const createResponse = await adminAuth('users', 'POST', {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        department,
        staff_id: staffId,
        requested_role: 'teacher',
        teacher_access_status: 'pending',
      },
      app_metadata: { role: 'teacher_applicant', teacher_access_status: 'pending' },
    });
    const created = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok || !created.id) {
      const message = String(created.msg || created.message || created.error_description || created.error || '');
      if (createResponse.status === 422 || /already|registered|exists/i.test(message)) {
        return NextResponse.json({ error: 'An account with this email already exists. Sign in if it is yours, or contact the administrator to recover the pending application.' }, { status: 409 });
      }
      console.error('Teacher account creation failed:', createResponse.status, created);
      return NextResponse.json({ error: 'Could not create the teacher application. Check the Supabase server key and try again.' }, { status: 500 });
    }
    createdUserId = created.id;

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3;
    const origin = req.nextUrl.origin;
    const approve = sign(createdUserId, 'approve', exp);
    const reject = sign(createdUserId, 'reject', exp);
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>CampusMate teacher access request</h2><p>A new teacher has requested access. Review the details before deciding.</p><table cellpadding="8" style="border-collapse:collapse"><tr><td><b>Name</b></td><td>${esc(name)}</td></tr><tr><td><b>Email</b></td><td>${esc(email)}</td></tr><tr><td><b>Department</b></td><td>${esc(department)}</td></tr><tr><td><b>Staff ID</b></td><td>${esc(staffId || 'Not provided')}</td></tr></table><p>These links expire in 3 days. Confirm your decision on the page that opens.</p><p><a style="display:inline-block;padding:12px 18px;background:#15803d;color:white;text-decoration:none;border-radius:8px" href="${origin}/teacher-approval?token=${encodeURIComponent(approve)}">Review approval</a> <a style="display:inline-block;padding:12px 18px;background:#b91c1c;color:white;text-decoration:none;border-radius:8px" href="${origin}/teacher-approval?token=${encodeURIComponent(reject)}">Review rejection</a></p></div>`;
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'CampusMate <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Teacher access request: ${name}`,
        html,
      }),
    });
    if (!mail.ok) {
      const details = await mail.text();
      console.error('Resend send failed:', mail.status, details);
      // Avoid leaving a hidden pending account if no approval request was sent.
      await adminAuth(`users/${encodeURIComponent(createdUserId)}`, 'DELETE').catch(() => undefined);
      let resendMessage = '';
      try {
        const parsed = JSON.parse(details);
        resendMessage = String(parsed.message || parsed.error || '');
      } catch {
        resendMessage = details.slice(0, 300);
      }
      const domainHelp = mail.status === 403 || /testing emails|verify a domain|verified domain|own email address/i.test(resendMessage)
        ? ' Resend test mode only allows delivery to the email address on your Resend account. To send approval requests to moonjikko2@gmail.com, verify a domain in Resend and set RESEND_FROM_EMAIL to an address on that verified domain.'
        : '';
      return NextResponse.json({
        error: `The approval email failed (Resend HTTP ${mail.status}). The application was not saved.${domainHelp} Check the Resend Emails log for details.`,
      }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Application submitted. The administrator has been emailed for approval.' });
  } catch (error) {
    console.error('Teacher registration notification error:', error);
    if (createdUserId) await adminAuth(`users/${encodeURIComponent(createdUserId)}`, 'DELETE').catch(() => undefined);
    return NextResponse.json({ error: 'Could not complete teacher registration. Please try again later.' }, { status: 500 });
  }
}
