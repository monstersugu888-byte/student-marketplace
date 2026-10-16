import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser, readStudoraRecords, writeStudoraRecord, deleteStudoraRecord } from '@/lib/supabase/studora-data';

export async function GET(req: NextRequest) {
  const auth = await requireSupabaseUser(req);
  if (auth.response) return auth.response;
  try {
    const tasks = await readStudoraRecords(auth.client!, 'tasks');
    return NextResponse.json({ success: true, tasks });
  } catch { return NextResponse.json({ success: false, error: 'Unable to load tasks. Run the Supabase migration first.' }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  const auth = await requireSupabaseUser(req);
  if (auth.response) return auth.response;
  try {
    const { task } = await req.json();
    if (!task || typeof task !== 'object') return NextResponse.json({ success:false,error:'Task is required.' }, {status:400});
    const id = String(task.id || 'tsk_' + Date.now());
    const record = { ...task, id };
    await writeStudoraRecord(auth.client!, auth.user!.id, 'tasks', id, record);
    return NextResponse.json({ success:true, task:record });
  } catch { return NextResponse.json({ success:false,error:'Unable to save task. Run the Supabase migration first.' },{status:500}); }
}
export async function PUT(req: NextRequest) {
  const auth = await requireSupabaseUser(req);
  if (auth.response) return auth.response;
  try {
    const { id, completed } = await req.json();
    if (!id) return NextResponse.json({success:false,error:'Task ID is required.'},{status:400});
    const { data, error } = await auth.client!.from('studora_user_data').select('data').eq('user_id',auth.user!.id).eq('collection','tasks').eq('record_id',String(id)).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({success:false,error:'Task not found.'},{status:404});
    await writeStudoraRecord(auth.client!,auth.user!.id,'tasks',String(id),{...(data.data as Record<string,unknown>),completed:!!completed});
    return NextResponse.json({success:true,id,completed:!!completed});
  } catch { return NextResponse.json({success:false,error:'Unable to update task.'},{status:500}); }
}
export async function DELETE(req: NextRequest) {
  const auth = await requireSupabaseUser(req);
  if (auth.response) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({success:false,error:'Task ID is required.'},{status:400});
    await deleteStudoraRecord(auth.client!, 'tasks', id);
    return NextResponse.json({success:true,id});
  } catch { return NextResponse.json({success:false,error:'Unable to delete task.'},{status:500}); }
}