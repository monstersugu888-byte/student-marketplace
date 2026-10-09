import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'alex.rivera@campus.edu';
    const docId = sanitizeId(userId);

    const snapshot = await db.collection('study_materials').get();
    const bookmarksSnapshot = await db.collection('users').doc(docId).collection('bookmarks').get();
    const bookmarkedIds = new Set(bookmarksSnapshot.docs.map(d => d.id));

    const materials = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        bookmarked: bookmarkedIds.has(doc.id) || (data.bookmarked ?? false),
      };
    });

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, material } = body;

    const matId = material.id || 'mat_' + Date.now();
    const matData = {
      ...material,
      id: matId,
      uploaderId: sanitizeId(userId || 'alex.rivera@campus.edu'),
      uploadDate: material.uploadDate || new Date().toISOString().split('T')[0],
      downloadsCount: material.downloadsCount || 1,
    };

    await db.collection('study_materials').doc(matId).set(matData);
    return NextResponse.json({ success: true, material: matData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, bookmarked } = body;
    const docId = sanitizeId(userId || 'alex.rivera@campus.edu');

    const bookmarkRef = db.collection('users').doc(docId).collection('bookmarks').doc(id);

    if (bookmarked) {
      await bookmarkRef.set({ bookmarkedAt: new Date().toISOString() });
    } else {
      await bookmarkRef.delete();
    }

    return NextResponse.json({ success: true, id, bookmarked });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
