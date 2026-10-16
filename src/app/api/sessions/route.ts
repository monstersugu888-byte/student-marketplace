import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
const noStore = { 'Cache-Control': 'no-store' };
export async function GET(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 const {data,error}=await supabaseAdmin.from('study_sessions').select('*').eq('user_id',auth.user!.id).order('session_date');
 if(error)return NextResponse.json({success:false,error:'Unable to load study sessions. Apply the Supabase migration.'},{status:503,headers:noStore});
 return NextResponse.json({success:true,sessions:(data||[]).map(r=>({id:r.id,title:r.title,subject:r.subject,date:r.session_date,startTime:r.start_time,endTime:r.end_time,notes:r.notes,location:r.location}))},{headers:noStore});
}
export async function POST(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 try {const {session}=await req.json(); if(!session||!String(session.title||'').trim())return NextResponse.json({success:false,error:'Session title is required.'},{status:400});
 const id=typeof session.id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(session.id)?session.id:'ses_'+crypto.randomUUID();
 const row={id,user_id:auth.user!.id,title:String(session.title).trim(),subject:String(session.subject||''),session_date:session.date||null,start_time:String(session.startTime||''),end_time:String(session.endTime||''),notes:String(session.notes||''),location:String(session.location||'')};
 const {data,error}=await supabaseAdmin.from('study_sessions').upsert(row).select().single();
 if(error)return NextResponse.json({success:false,error:'Unable to save study session.'},{status:500});
 return NextResponse.json({success:true,session:{id:data.id,title:data.title,subject:data.subject,date:data.session_date,startTime:data.start_time,endTime:data.end_time,notes:data.notes,location:data.location}},{status:201,headers:noStore});
 }catch{return NextResponse.json({success:false,error:'Invalid session request.'},{status:400});}
}
export async function DELETE(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 const id=new URL(req.url).searchParams.get('id'); if(!id)return NextResponse.json({success:false,error:'Session ID is required.'},{status:400});
 const {data,error}=await supabaseAdmin.from('study_sessions').delete().eq('user_id',auth.user!.id).eq('id',id).select('id').maybeSingle();
 if(error)return NextResponse.json({success:false,error:'Unable to delete session.'},{status:500}); if(!data)return NextResponse.json({success:false,error:'Session not found.'},{status:404});
 return NextResponse.json({success:true,id},{headers:noStore});
}