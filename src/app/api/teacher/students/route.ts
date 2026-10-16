import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher } from '@/lib/supabase/request-auth';

export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id,full_name,email,department')
    .eq('role', 'student')
    .order('full_name', { ascending: true })
    .limit(500);
  if (error) {
    console.error('Teacher student list:', error.message);
    return NextResponse.json({ success: false, error: 'Unable to load students.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({
    success: true,
    students: (data || []).map(row => ({ id: row.id, name: row.full_name || row.email, email: row.email, department: row.department })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
