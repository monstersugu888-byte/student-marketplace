import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher, requireUser } from '@/lib/supabase/request-auth';

const validId = /^[a-zA-Z0-9_-]{1,120}$/;
const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { data: materials, error } = await supabaseAdmin.from('study_materials').select('*').order('upload_date', { ascending: false });
  if (error) {
    console.error('Materials GET:', error.message);
    return NextResponse.json({ success: false, error: 'Unable to load materials. Apply the Supabase migration first.' }, { status: 503, headers: noStore });
  }
  const { data: bookmarks, error: bookmarkError } = await supabaseAdmin.from('material_bookmarks').select('material_id').eq('user_id', auth.user!.id);
  if (bookmarkError) return NextResponse.json({ success: false, error: 'Unable to load bookmarks.' }, { status: 500, headers: noStore });
  const saved = new Set((bookmarks || []).map(row => row.material_id));
  const enriched = await Promise.all((materials || []).map(async m => {
    let downloadUrl = m.download_url || '';
    if (m.storage_path) {
      const { data: signed } = await supabaseAdmin.storage.from('study-materials').createSignedUrl(m.storage_path, 60 * 10);
      downloadUrl = signed?.signedUrl || '';
    }
    return {
      id: m.id, title: m.title, subject: m.subject, courseCode: m.course_code, semester: m.semester,
      type: m.type, content: m.content, storagePath: m.storage_path, downloadUrl,
      fileSize: m.file_size, uploadedBy: m.uploaded_by, uploadDate: m.upload_date,
      downloadsCount: m.downloads_count, bookmarked: saved.has(m.id),
    };
  }));
  return NextResponse.json({ success: true, materials: enriched }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const material = body?.material;
    if (!material || typeof material !== 'object') return NextResponse.json({ success: false, error: 'Material data is required.' }, { status: 400 });
    const id = typeof material.id === 'string' && validId.test(material.id) ? material.id : 'mat_' + crypto.randomUUID();
    const title = String(material.title || '').trim();
    if (!title) return NextResponse.json({ success: false, error: 'A material title is required.' }, { status: 400 });
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', auth.user!.id).maybeSingle();
    const row = {
      id, title, subject: String(material.subject || ''), course_code: String(material.courseCode || ''),
      semester: String(material.semester || ''), type: String(material.type || 'PDF'),
      content: typeof material.content === 'string' ? material.content : '',
      storage_path: String(material.storagePath || ''), download_url: String(material.downloadUrl || ''),
      file_size: String(material.fileSize || ''), uploaded_by: profile?.full_name || auth.user!.email!,
      uploader_id: auth.user!.id, upload_date: new Date().toISOString().slice(0, 10), downloads_count: 0,
    };
    const { data, error } = await supabaseAdmin.from('study_materials').insert(row).select().single();
    if (error) {
      console.error('Materials POST:', error.message);
      return NextResponse.json({ success: false, error: 'Unable to save material. Verify the Supabase schema and storage configuration.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, material: { ...data, courseCode: data.course_code, downloadUrl: data.download_url, storagePath: data.storage_path, fileSize: data.file_size, uploadDate: data.upload_date, downloadsCount: data.downloads_count } }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid material request.' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    const { id, bookmarked } = await req.json();
    if (typeof id !== 'string' || !validId.test(id) || typeof bookmarked !== 'boolean') {
      return NextResponse.json({ success: false, error: 'A valid material ID and bookmark state are required.' }, { status: 400 });
    }
    if (bookmarked) {
      const { error } = await supabaseAdmin.from('material_bookmarks').upsert({ user_id: auth.user!.id, material_id: id }, { onConflict: 'user_id,material_id' });
      if (error) return NextResponse.json({ success: false, error: 'Unable to bookmark material.' }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin.from('material_bookmarks').delete().eq('user_id', auth.user!.id).eq('material_id', id);
      if (error) return NextResponse.json({ success: false, error: 'Unable to remove bookmark.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, id, bookmarked }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid bookmark request.' }, { status: 400 });
  }
}
