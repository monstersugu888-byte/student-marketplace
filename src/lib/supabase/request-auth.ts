import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function getVerifiedRequestUser(req: NextRequest) {
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !data.user.email) return null;
  // Do not authorize API access for accounts that have not confirmed ownership
  // of their email address. Supabase should also have email confirmation enabled.
  if (!data.user.email_confirmed_at) return null;
  return data.user;
}

export async function requireUser(req: NextRequest) {
  const user = await getVerifiedRequestUser(req);
  if (!user) {
    return { user: null, response: NextResponse.json(
      { success: false, error: 'Your session is missing or expired. Please sign in again.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    ) };
  }
  // Keep profile creation idempotent; the client-supplied role is never trusted.
  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: String(user.user_metadata?.full_name || user.email!.split('@')[0]),
    teacher_access_status: user.user_metadata?.requested_role === 'teacher' ? 'pending' : 'not_requested',
    department: String(user.user_metadata?.department || ''),
    staff_id: String(user.user_metadata?.staff_id || ''),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error('Profile bootstrap failed:', error.message);
    return { user: null, response: NextResponse.json(
      { success: false, error: 'The Supabase profile schema is not ready. Apply the database migration and try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    ) };
  }
  if (user.user_metadata?.requested_role === 'teacher') {
    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
      .from('teacher_access_requests').select('user_id').eq('user_id', user.id).maybeSingle();
    if (existingRequestError) {
      console.error('Teacher request lookup failed:', existingRequestError.message);
      return { user: null, response: NextResponse.json(
        { success: false, error: 'Unable to verify teacher approval request. Apply the latest Supabase migration.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      ) };
    }
    const { error: requestError } = await supabaseAdmin.from('teacher_access_requests').upsert({
      user_id: user.id,
      department: String(user.user_metadata?.department || ''),
      staff_id: String(user.user_metadata?.staff_id || ''),
      status: 'pending',
    }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (requestError) {
      console.error('Teacher request bootstrap failed:', requestError.message);
      return { user: null, response: NextResponse.json(
        { success: false, error: 'Unable to register teacher approval request. Apply the latest Supabase migration.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      ) };
    }
    // Send one notification to the configured administrator when a new verified
    // teacher application first appears. Email failure never deletes the request.
    if (!existingRequest) {
      const adminEmail = process.env.TEACHER_APPROVAL_EMAIL;
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (adminEmail && apiKey && from) {
        try {
          const mailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from,
              to: [adminEmail],
              subject: 'New CampusMate teacher access request',
              text: `A verified teacher application is waiting for review. Applicant: ${user.user_metadata?.full_name || user.email}. Open the CampusMate admin teacher applications page to review it.`,
            }),
          });
          if (!mailResponse.ok) console.error('Teacher application notification failed:', mailResponse.status, (await mailResponse.text()).slice(0, 500));
        } catch (mailError) {
          console.error('Teacher application notification error:', mailError);
        }
      } else {
        console.warn('Teacher application saved; set TEACHER_APPROVAL_EMAIL, RESEND_API_KEY and RESEND_FROM_EMAIL to notify the administrator.');
      }
    }
  }
  return { user, response: null };
}

export async function requireTeacher(req: NextRequest) {
  const result = await requireUser(req);
  if (result.response) return result;
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role,teacher_access_status')
    .eq('id', result.user!.id)
    .maybeSingle();
  if (error) {
    console.error('Teacher authorization lookup failed:', error.message);
    return { user: null, response: NextResponse.json(
      { success: false, error: 'Teacher authorization is unavailable until the Supabase migration is applied.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    ) };
  }
  if (profile?.role !== 'teacher' || profile?.teacher_access_status !== 'approved') {
    return { user: null, response: NextResponse.json(
      { success: false, error: 'Teacher access is pending administrator approval.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    ) };
  }
  return result;
}

/** Legacy helper retained only while the remaining non-academic endpoints are migrated. */
export function verifiedUserDocumentId(email: string) {
  return email.replace(/[^a-zA-Z0-9_-]/g, '_');
}
