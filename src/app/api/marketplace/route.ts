import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    if (!db) {
      return NextResponse.json({ success: true, listings: [] });
    }

    const snapshot = await db.collection('marketplace_listings').get();
    const listings = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isOwner: data.sellerId === docId,
      };
    });

    return NextResponse.json({ success: true, listings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, listing } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const listingId = listing.id || 'mkt_' + Date.now();
    const listingData = {
      ...listing,
      id: listingId,
      sellerId: docId,
      postedDate: listing.postedDate || 'Just now',
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await db.collection('marketplace_listings').doc(listingId).set(listingData);
    }

    return NextResponse.json({
      success: true,
      listing: { ...listingData, isOwner: true }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (db) {
      const listingRef = db.collection('marketplace_listings').doc(id);
      await listingRef.set({ status }, { merge: true });
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    if (db) {
      await db.collection('marketplace_listings').doc(id).delete();
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
