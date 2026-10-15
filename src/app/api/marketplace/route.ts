import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { requireUser, verifiedUserDocumentId } from '@/lib/supabase/request-auth';

const idPattern = /^[a-zA-Z0-9_-]{1,120}$/;

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Marketplace database is not configured.' }, { status: 503 });
  try {
    const ownerId = verifiedUserDocumentId(auth.user!.email!);
    const snapshot = await db.collection('marketplace_listings').get();
    const listings = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return { id: doc.id, ...data, isOwner: data.sellerId === ownerId };
    });
    return NextResponse.json({ success: true, listings }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Marketplace GET failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load marketplace listings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Marketplace database is not configured. Listing was not saved.' }, { status: 503 });
  try {
    const body = await req.json();
    const listing = body?.listing;
    if (!listing || typeof listing !== 'object' || Array.isArray(listing) || !String(listing.title || '').trim()) {
      return NextResponse.json({ success: false, error: 'A valid listing title is required.' }, { status: 400 });
    }
    const listingId = typeof listing.id === 'string' && idPattern.test(listing.id) ? listing.id : 'mkt_' + crypto.randomUUID();
    const sellerId = verifiedUserDocumentId(auth.user!.email!);
    const listingData = {
      title: String(listing.title).trim(),
      description: String(listing.description || ''),
      price: Number(listing.price) || 0,
      category: String(listing.category || 'Other'),
      condition: String(listing.condition || 'Good'),
      status: 'Available',
      imageUrl: String(listing.imageUrl || ''),
      sellerName: String(auth.user!.user_metadata?.full_name || auth.user!.email!.split('@')[0]),
      sellerContact: String(listing.sellerContact || ''),
      location: String(listing.location || ''),
      sellerId,
      postedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.collection('marketplace_listings').doc(listingId).create(listingData);
    return NextResponse.json({ success: true, listing: { id: listingId, ...listingData, isOwner: true } }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    if (error?.code === 6 || error?.code === 'already-exists') return NextResponse.json({ success: false, error: 'That listing already exists. Refresh and try again.' }, { status: 409 });
    console.error('Marketplace POST failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save marketplace listing.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Marketplace database is not configured. Changes were not saved.' }, { status: 503 });
  try {
    const body = await req.json();
    const { id, status } = body || {};
    if (typeof id !== 'string' || !idPattern.test(id) || !['Available', 'Reserved', 'Sold'].includes(status)) {
      return NextResponse.json({ success: false, error: 'A valid listing ID and status are required.' }, { status: 400 });
    }
    const ref = db.collection('marketplace_listings').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
    if (snapshot.data()?.sellerId !== verifiedUserDocumentId(auth.user!.email!)) {
      return NextResponse.json({ success: false, error: 'You can only update your own listing.' }, { status: 403 });
    }
    await ref.set({ status }, { merge: true });
    return NextResponse.json({ success: true, id, status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Marketplace PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update marketplace listing.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  if (!db) return NextResponse.json({ success: false, error: 'Marketplace database is not configured. Listing was not deleted.' }, { status: 503 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !idPattern.test(id)) return NextResponse.json({ success: false, error: 'A valid listing ID is required.' }, { status: 400 });
    const ref = db.collection('marketplace_listings').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
    if (snapshot.data()?.sellerId !== verifiedUserDocumentId(auth.user!.email!)) {
      return NextResponse.json({ success: false, error: 'You can only delete your own listing.' }, { status: 403 });
    }
    await ref.delete();
    return NextResponse.json({ success: true, id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Marketplace DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete marketplace listing.' }, { status: 500 });
  }
}
