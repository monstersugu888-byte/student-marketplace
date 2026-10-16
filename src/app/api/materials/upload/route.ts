import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireTeacher } from '@/lib/supabase/request-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.response) return auth.response;
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Choose a file to upload.' }, { status: 400 });
    if (file.size <= 0 || file.size > 20 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Files must be between 1 byte and 20 MB.' }, { status: 400 });
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.type && !allowed.includes(file.type)) return NextResponse.json({ success: false, error: 'This file type is not allowed.' }, { status: 415 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const path = `${auth.user!.id}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabaseAdmin.storage.from('study-materials').upload(path, await file.arrayBuffer(), {
      contentType: file.type || 'application/octet-stream', upsert: false,
    });
    if (error) {
      console.error('Storage upload:', error.message);
      return NextResponse.json({ success: false, error: 'Upload failed. Verify the private study-materials bucket exists.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, storagePath: path, fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB` }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to process uploaded file.' }, { status: 400 });
  }
}
