import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
const noStore = { 'Cache-Control': 'no-store' };

async function requireAdmin(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth;
  const { data, error } = await supabaseAdmin.from('profiles').select('role').eq('id', auth.user!.id).maybeSingle();
  if (error) return { user: null, response: NextResponse.json({ success:false,error:'Unable to verify administrator access.' }, { status:503 }) };
  if (data?.role !== 'admin') return { user: null, response: NextResponse.json({ success:false,error:'Administrator access is required.' }, { status:403 }) };
  return auth;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  const { data, error } = await supabaseAdmin.from('teacher_access_requests').select('*').order('created_at',{ascending:false});
  if (error) return NextResponse.json({success:false,error:'Unable to load teacher applications.'},{status:500,headers:noStore});
  const ids = [...new Set((data||[]).map(row=>row.user_id))];
  const profiles = ids.length ? await supabaseAdmin.from('profiles').select('id,email,full_name').in('id',ids) : {data:[],error:null};
  const byId = new Map((profiles.data||[]).map(row=>[row.id,row]));
  return NextResponse.json({success:true,requests:(data||[]).map(row=>({...row,email:byId.get(row.user_id)?.email,name:byId.get(row.user_id)?.full_name}))},{headers:noStore});
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  try {
    const { userId, status } = await req.json();
    if (typeof userId !== 'string' || !['approved','rejected'].includes(status)) return NextResponse.json({success:false,error:'User ID and approved/rejected status are required.'},{status:400});
    const { data: request, error: requestError } = await supabaseAdmin.from('teacher_access_requests').update({
      status, reviewed_by:auth.user!.id, reviewed_at:new Date().toISOString()
    }).eq('user_id',userId).select('user_id').maybeSingle();
    if (requestError) return NextResponse.json({success:false,error:'Unable to update teacher application.'},{status:500});
    if (!request) return NextResponse.json({success:false,error:'Teacher application not found.'},{status:404});
    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      role: status === 'approved' ? 'teacher' : 'student',
      teacher_access_status: status,
      updated_at: new Date().toISOString(),
    }).eq('id',userId);
    if (profileError) return NextResponse.json({success:false,error:'Application status changed but profile role update failed. Contact support.'},{status:500});

    // Notify the applicant of the administrator's decision. Mail configuration
    // is server-only; approval itself remains recorded if the mail provider is down.
    const { data: applicant } = await supabaseAdmin.from('profiles').select('email,full_name').eq('id', userId).maybeSingle();
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    let emailSent = false;
    let emailNotice = '';
    if (apiKey && from && applicant?.email) {
      const safeName = String(applicant.full_name || 'Teacher applicant').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' } as Record<string, string>)[char] || char);
      const decision = status === 'approved' ? 'approved' : 'not approved';
      try {
        const mailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [applicant.email],
            subject: `CampusMate teacher application ${decision}`,
            html: `<p>Hello ${safeName},</p><p>Your CampusMate teacher application has been ${decision} by an administrator.</p><p>${status === 'approved' ? 'You can now sign in to the Teacher Portal.' : 'Please contact your administrator if you need more information.'}</p><p>— CampusMate</p>`,
          }),
        });
        emailSent = mailResponse.ok;
        if (!mailResponse.ok) {
          const details = await mailResponse.text();
          console.error('Teacher decision email failed:', mailResponse.status, details.slice(0, 500));
          emailNotice = 'Decision saved, but the notification email failed. Check the Resend sender/domain settings.';
        }
      } catch (mailError) {
        console.error('Teacher decision email error:', mailError);
        emailNotice = 'Decision saved, but the notification email could not be sent.';
      }
    } else {
      emailNotice = 'Decision saved. Configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL to email the applicant.';
    }
    return NextResponse.json({success:true,userId,status,emailSent,emailNotice},{headers:noStore});
  } catch { return NextResponse.json({success:false,error:'Invalid teacher review request.'},{status:400}); }
}
