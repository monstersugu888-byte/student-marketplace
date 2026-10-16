import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', auth.user!.id).maybeSingle();
  if (error) return NextResponse.json({ success: false, error: 'Unable to load profile.' }, { status: 500, headers: noStore });
  if (!data) return NextResponse.json({ success: false, error: 'Profile not found.' }, { status: 404, headers: noStore });
  return NextResponse.json({ success: true, profile: {
    ...(data.profile_data || {}), id: data.id, email: data.email, name: data.full_name,
    role: data.role, teacherAccessStatus: data.teacher_access_status,
    avatar: '',
  } }, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const updatedProfile = body?.updatedProfile;
    if (!updatedProfile || typeof updatedProfile !== 'object' || Array.isArray(updatedProfile)) {
      return NextResponse.json({ success: false, error: 'Valid profile updates are required.' }, { status: 400 });
    }
    const allowed = ['name', 'major', 'college', 'semester', 'studentId', 'gpa', 'bio', 'notificationPreferences'];
    const safe = Object.fromEntries(Object.entries(updatedProfile).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(safe).length) return NextResponse.json({ success: false, error: 'No editable profile fields supplied.' }, { status: 400 });
    const { data: current, error: readError } = await supabaseAdmin.from('profiles').select('profile_data,full_name,email,role,teacher_access_status').eq('id', auth.user!.id).single();
    if (readError) return NextResponse.json({ success: false, error: 'Unable to read profile before saving.' }, { status: 500 });
    const profileData = { ...(current.profile_data || {}), ...safe };
    const fullName = typeof safe.name === 'string' ? safe.name.trim() : current.full_name;
    const { error } = await supabaseAdmin.from('profiles').update({
      profile_data: profileData, full_name: fullName, updated_at: new Date().toISOString(),
    }).eq('id', auth.user!.id);
    if (error) return NextResponse.json({ success: false, error: 'Unable to save profile.' }, { status: 500 });
    return NextResponse.json({ success: true, profile: { ...profileData, id: auth.user!.id, email: current.email, name: fullName, role: current.role, teacherAccessStatus: current.teacher_access_status, avatar: '' } }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid profile update.' }, { status: 400 });
  }
}
