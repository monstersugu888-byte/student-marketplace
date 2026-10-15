import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
  return { user, response: null };
}

export async function requireTeacher(req: NextRequest) {
  const result = await requireUser(req);
  if (result.response) return result;
  if (result.user?.app_metadata?.role !== 'teacher') {
    return { user: null, response: NextResponse.json(
      { success: false, error: 'Only administrator-approved teachers can perform this action.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    ) };
  }
  return result;
}

/** IDs in the legacy Firestore schema are derived from the verified email, never request input. */
export function verifiedUserDocumentId(email: string) {
  return email.replace(/[^a-zA-Z0-9_-]/g, '_');
}
