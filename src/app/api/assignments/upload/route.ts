import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 try {
  const form=await req.formData(); const file=form.get('file');
  if(!(file instanceof File))return NextResponse.json({success:false,error:'Choose a file to submit.'},{status:400});
  if(file.size<=0||file.size>20*1024*1024)return NextResponse.json({success:false,error:'Files must be between 1 byte and 20 MB.'},{status:400});
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
  const path=`submissions/${auth.user!.id}/${crypto.randomUUID()}-${safeName}`;
  const {error}=await supabaseAdmin.storage.from('study-materials').upload(path,await file.arrayBuffer(),{contentType:file.type||'application/octet-stream',upsert:false});
  if(error){console.error('Assignment upload:',error.message);return NextResponse.json({success:false,error:'File upload failed. Verify the private study-materials bucket exists.'},{status:503});}
  return NextResponse.json({success:true,submissionPath:path},{status:201});
 }catch{return NextResponse.json({success:false,error:'Unable to process assignment file.'},{status:400});}
}
