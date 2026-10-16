import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export type StudoraCollection =
  | 'profile'
  | 'assignments'
  | 'attendance'
  | 'tasks'
  | 'sessions'
  | 'notifications'
  | 'materials_bookmarks';

export function getSupabaseRequestClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!url || !key || !token) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireSupabaseUser(req: NextRequest) {
  const client = getSupabaseRequestClient(req);
  if (!client) {
    return { client: null, user: null, response: NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 }) };
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { client: null, user: null, response: NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 }) };
  }
  return { client, user: data.user, response: null };
}

export async function requireSupabaseTeacher(req: NextRequest) {
  const auth = await requireSupabaseUser(req);
  if (auth.response) return auth;
  if (auth.user?.app_metadata?.role !== 'teacher') {
    return { ...auth, response: NextResponse.json({ success: false, error: 'Only approved teachers can perform this action.' }, { status: 403 }) };
  }
  return auth;
}

export async function readStudoraRecords(client: NonNullable<ReturnType<typeof getSupabaseRequestClient>>, collection: StudoraCollection) {
  const { data, error } = await client.from('studora_user_data').select('record_id,data,updated_at').eq('collection', collection).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({ ...(row.data as Record<string, unknown>), id: row.record_id }));
}

export async function writeStudoraRecord(
  client: NonNullable<ReturnType<typeof getSupabaseRequestClient>>,
  userId: string,
  collection: StudoraCollection,
  recordId: string,
  data: Record<string, unknown>
) {
  const { error } = await client.from('studora_user_data').upsert({
    user_id: userId,
    collection,
    record_id: recordId,
    data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,collection,record_id' });
  if (error) throw error;
}

export async function deleteStudoraRecord(
  client: NonNullable<ReturnType<typeof getSupabaseRequestClient>>,
  collection: StudoraCollection,
  recordId: string
) {
  const { error } = await client.from('studora_user_data').delete().eq('collection', collection).eq('record_id', recordId);
  if (error) throw error;
}
