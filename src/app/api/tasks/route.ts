import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
const noStore = { 'Cache-Control': 'no-store' };
export async function GET(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 const {data,error}=await supabaseAdmin.from('daily_tasks').select('*').eq('user_id',auth.user!.id).order('created_at');
 if(error)return NextResponse.json({success:false,error:'Unable to load tasks. Apply the Supabase migration.'},{status:503,headers:noStore});
 return NextResponse.json({success:true,tasks:(data||[]).map(r=>({id:r.id,title:r.title,completed:r.completed,category:r.category}))},{headers:noStore});
}
export async function POST(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 try { const {task}=await req.json(); if(!task||!String(task.title||'').trim())return NextResponse.json({success:false,error:'Task title is required.'},{status:400});
 const id=typeof task.id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(task.id)?task.id:'tsk_'+crypto.randomUUID();
 const row={id,user_id:auth.user!.id,title:String(task.title).trim(),completed:Boolean(task.completed),category:String(task.category||'General')};
 const {data,error}=await supabaseAdmin.from('daily_tasks').upsert(row).select().single();
 if(error)return NextResponse.json({success:false,error:'Unable to save task.'},{status:500});
 return NextResponse.json({success:true,task:{id:data.id,title:data.title,completed:data.completed,category:data.category}},{status:201,headers:noStore});
 } catch{return NextResponse.json({success:false,error:'Invalid task request.'},{status:400});}
}
export async function PUT(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 try {const {id,completed}=await req.json(); if(typeof id!=='string'||typeof completed!=='boolean')return NextResponse.json({success:false,error:'Task ID and completion state are required.'},{status:400});
 const {data,error}=await supabaseAdmin.from('daily_tasks').update({completed}).eq('user_id',auth.user!.id).eq('id',id).select('id').maybeSingle();
 if(error)return NextResponse.json({success:false,error:'Unable to update task.'},{status:500}); if(!data)return NextResponse.json({success:false,error:'Task not found.'},{status:404});
 return NextResponse.json({success:true,id,completed},{headers:noStore});
 }catch{return NextResponse.json({success:false,error:'Invalid task update.'},{status:400});}
}
export async function DELETE(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 const id=new URL(req.url).searchParams.get('id'); if(!id)return NextResponse.json({success:false,error:'Task ID is required.'},{status:400});
 const {data,error}=await supabaseAdmin.from('daily_tasks').delete().eq('user_id',auth.user!.id).eq('id',id).select('id').maybeSingle();
 if(error)return NextResponse.json({success:false,error:'Unable to delete task.'},{status:500}); if(!data)return NextResponse.json({success:false,error:'Task not found.'},{status:404});
 return NextResponse.json({success:true,id},{headers:noStore});
}