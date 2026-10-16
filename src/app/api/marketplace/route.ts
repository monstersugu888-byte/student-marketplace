import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
const noStore = { 'Cache-Control': 'no-store' };
const validId = /^[a-zA-Z0-9_-]{1,120}$/;

function toListing(row: any, userId: string) {
 return { id:row.id,title:row.title,description:row.description||'',price:Number(row.price||0),category:row.category,
  condition:row.item_condition||row.condition||'Good',
  status:row.status==='active'||row.status==='Available'?'Available':row.status==='reserved'||row.status==='Reserved'?'Reserved':'Sold',
  imageUrl:row.image_url||row.imageUrl||'',postedDate:row.created_at||row.postedDate,
  sellerName:row.seller_name||row.sellerName||'Student seller',sellerAvatar:'',sellerContact:row.seller_contact||row.sellerContact||'',
  location:row.location||'',isOwner:row.seller_id===userId||row.sellerId===userId };
}
export async function GET(req: NextRequest) {
 const auth=await requireUser(req);if(auth.response)return auth.response;
 const {data,error}=await supabaseAdmin.from('marketplace_listings').select('*').order('created_at',{ascending:false});
 if(error){console.error('Marketplace GET:',error.message);return NextResponse.json({success:false,error:'Unable to load marketplace listings. Check the marketplace table schema.'},{status:503,headers:noStore});}
 return NextResponse.json({success:true,listings:(data||[]).map(row=>toListing(row,auth.user!.id))},{headers:noStore});
}
export async function POST(req: NextRequest) {
 const auth=await requireUser(req);if(auth.response)return auth.response;
 try {
  const {listing}=await req.json();
  if(!listing||typeof listing!=='object'||!String(listing.title||'').trim())return NextResponse.json({success:false,error:'A listing title is required.'},{status:400});
  const id=typeof listing.id==='string'&&validId.test(listing.id)?listing.id:'mkt_'+crypto.randomUUID();
  const {data:profile}=await supabaseAdmin.from('profiles').select('full_name').eq('id',auth.user!.id).maybeSingle();
  const row={id,title:String(listing.title).trim(),description:String(listing.description||''),price:Math.max(0,Number(listing.price)||0),
   category:String(listing.category||'Other'),item_condition:String(listing.condition||'Good'),status:'active',
   image_url:String(listing.imageUrl||''),seller_name:profile?.full_name||auth.user!.email!.split('@')[0],
   seller_avatar:'',seller_contact:String(listing.sellerContact||''),location:String(listing.location||''),seller_id:auth.user!.id};
  const {data,error}=await supabaseAdmin.from('marketplace_listings').insert(row).select().single();
  if(error){console.error('Marketplace POST:',error.message);return NextResponse.json({success:false,error:'Unable to save listing. Check the marketplace table schema.'},{status:503});}
  return NextResponse.json({success:true,listing:toListing(data,auth.user!.id)},{status:201,headers:noStore});
 }catch{return NextResponse.json({success:false,error:'Invalid listing request.'},{status:400});}
}
export async function PUT(req: NextRequest) {
 const auth=await requireUser(req);if(auth.response)return auth.response;
 try {
  const {id,updated,status}=await req.json();
  if(typeof id!=='string'||!validId.test(id))return NextResponse.json({success:false,error:'Listing ID is required.'},{status:400});
  const changes=updated&&typeof updated==='object'?updated:{status};
  const mapping:Record<string,string>={title:'title',description:'description',price:'price',category:'category',condition:'item_condition',status:'status',imageUrl:'image_url',sellerContact:'seller_contact',location:'location'};
  const safe:Record<string,unknown>={};
  for(const [key,value] of Object.entries(changes||{}))if(key in mapping)safe[mapping[key]]=key==='status'?(value==='Available'?'active':value==='Reserved'?'reserved':'sold'):value;
  if(!Object.keys(safe).length)return NextResponse.json({success:false,error:'No valid listing changes supplied.'},{status:400});
  const {data,error}=await supabaseAdmin.from('marketplace_listings').update(safe).eq('id',id).eq('seller_id',auth.user!.id).select().maybeSingle();
  if(error)return NextResponse.json({success:false,error:'Unable to update listing.'},{status:500});
  if(!data)return NextResponse.json({success:false,error:'Listing not found or you are not the owner.'},{status:404});
  return NextResponse.json({success:true,listing:toListing(data,auth.user!.id)},{headers:noStore});
 }catch{return NextResponse.json({success:false,error:'Invalid listing update.'},{status:400});}
}
export async function DELETE(req: NextRequest) {
 const auth=await requireUser(req);if(auth.response)return auth.response;
 const id=new URL(req.url).searchParams.get('id');if(!id||!validId.test(id))return NextResponse.json({success:false,error:'Listing ID is required.'},{status:400});
 const {data,error}=await supabaseAdmin.from('marketplace_listings').delete().eq('id',id).eq('seller_id',auth.user!.id).select('id').maybeSingle();
 if(error)return NextResponse.json({success:false,error:'Unable to delete listing.'},{status:500});
 if(!data)return NextResponse.json({success:false,error:'Listing not found or you are not the owner.'},{status:404});
 return NextResponse.json({success:true,id},{headers:noStore});
}
