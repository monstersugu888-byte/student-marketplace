import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function getVerifiedRequestUser(req: NextRequest) {
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token || !url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireTeacher(req: NextRequest) {
  const user = await getVerifiedRequestUser(req);
  if (!user) {
    return { user: null, response: Response.json({ success: false, error: 'Please sign in again.' }, { status: 401 }) };
  }
  if (user.app_metadata?.role !== 'teacher') {
    return { user: null, response: Response.json({ success: false, error: 'Only administrator-approved teachers can perform this action.' }, { status: 403 }) };
  }
  return { user, response: null };
}
