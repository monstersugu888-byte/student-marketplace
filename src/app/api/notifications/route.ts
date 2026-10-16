import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
const noStore = { 'Cache-Control': 'no-store' };
export async function GET(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 const {data,error}=await supabaseAdmin.from('user_notifications').select('*').eq('user_id',auth.user!.id).order('notification_time',{ascending:false});
 if(error)return NextResponse.json({success:false,error:'Unable to load notifications. Apply the Supabase migration.'},{status:503,headers:noStore});
 return NextResponse.json({success:true,notifications:(data||[]).map(r=>({id:r.id,title:r.title,message:r.message,timestamp:r.notification_time,type:r.type,read:r.read,link:r.link}))},{headers:noStore});
}
export async function PUT(req: NextRequest) {
 const auth=await requireUser(req); if(auth.response)return auth.response;
 try {const {id,markAll}=await req.json();
 let query=supabaseAdmin.from('user_notifications').update({read:true}).eq('user_id',auth.user!.id);
 if(!markAll){if(typeof id!=='string'||!id)return NextResponse.json({success:false,error:'Notification ID is required.'},{status:400});query=query.eq('id',id);}
 const {error}=await query;if(error)return NextResponse.json({success:false,error:'Unable to mark notifications as read.'},{status:500});
 return NextResponse.json({success:true,id:id||null,message:markAll?'All marked as read':undefined},{headers:noStore});
 }catch{return NextResponse.json({success:false,error:'Invalid notification request.'},{status:400});}
}