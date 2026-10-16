import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVerifiedRequestUser } from '@/lib/supabase/request-auth';
import {
  initialProfile,
  initialAssignments,
  initialClasses,
  initialStudySessions,
  initialStudyMaterials,
  initialMarketplaceListings,
  initialNotifications,
  initialDailyTasks,
  initialAttendances
} from '@/data/mockData';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedRequestUser(req);
    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    }
    // Never trust client-supplied identity for a server-side profile lookup.
    const email = user.email;
    const userId = user.id;
    const name = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]);
    const docId = sanitizeId(email);

    if (!db) {
      return NextResponse.json({
        success: true,
        data: {
          profile: { ...initialProfile, id: docId, email, name },
          assignments: initialAssignments,
          attendances: initialAttendances,
          dailyTasks: initialDailyTasks,
          studySessions: initialStudySessions,
          notifications: initialNotifications,
          materials: initialStudyMaterials,
          listings: initialMarketplaceListings,
          classes: initialClasses,
        }
      });
    }

    const userRef = db.collection('users').doc(docId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const newProfile = {
        ...initialProfile,
        id: docId,
        email: email,
        name: name,
      };

      await userRef.set({
        profile: newProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const batch = db.batch();

      for (const asg of initialAssignments) {
        const asgRef = userRef.collection('assignments').doc(asg.id);
        batch.set(asgRef, asg);
      }

      for (const att of initialAttendances) {
        const attRef = userRef.collection('attendance').doc(att.id);
        batch.set(attRef, att);
      }

      for (const task of initialDailyTasks) {
        const taskRef = userRef.collection('tasks').doc(task.id);
        batch.set(taskRef, task);
      }

      for (const ses of initialStudySessions) {
        const sesRef = userRef.collection('sessions').doc(ses.id);
        batch.set(sesRef, ses);
      }

      for (const notif of initialNotifications) {
        const notifRef = userRef.collection('notifications').doc(notif.id);
        batch.set(notifRef, notif);
      }

      await batch.commit();

      const mktSnapshot = await db.collection('marketplace_listings').limit(1).get();
      if (mktSnapshot.empty) {
        const mktBatch = db.batch();
        for (const item of initialMarketplaceListings) {
          const itemRef = db.collection('marketplace_listings').doc(item.id);
          mktBatch.set(itemRef, {
            ...item,
            sellerId: item.isOwner ? docId : 'other_student',
          });
        }
        await mktBatch.commit();
      }

      const matSnapshot = await db.collection('study_materials').limit(1).get();
      if (matSnapshot.empty) {
        const matBatch = db.batch();
        for (const mat of initialStudyMaterials) {
          const matRef = db.collection('study_materials').doc(mat.id);
          matBatch.set(matRef, mat);
        }
        await matBatch.commit();
      }
    }

    const currentProfile = (await userRef.get()).data()?.profile || initialProfile;

    const asgSnapshot = await userRef.collection('assignments').get();
    const assignments = asgSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const attSnapshot = await userRef.collection('attendance').get();
    const attendances = attSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const taskSnapshot = await userRef.collection('tasks').get();
    const dailyTasks = taskSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const sesSnapshot = await userRef.collection('sessions').get();
    const studySessions = sesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const notifSnapshot = await userRef.collection('notifications').get();
    const notifications = notifSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const matSnapshot = await db.collection('study_materials').get();
    const bookmarksSnapshot = await userRef.collection('bookmarks').get();
    const bookmarkedIds = new Set(bookmarksSnapshot.docs.map((d: any) => d.id));

    const materials = matSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        bookmarked: bookmarkedIds.has(doc.id) || (data.bookmarked ?? false),
      };
    });

    const mktSnapshot = await db.collection('marketplace_listings').get();
    const listings = mktSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isOwner: data.sellerId === docId,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        profile: currentProfile,
        assignments: assignments.length > 0 ? assignments : initialAssignments,
        attendances: attendances.length > 0 ? attendances : initialAttendances,
        dailyTasks: dailyTasks.length > 0 ? dailyTasks : initialDailyTasks,
        studySessions: studySessions.length > 0 ? studySessions : initialStudySessions,
        notifications: notifications.length > 0 ? notifications : initialNotifications,
        materials: materials.length > 0 ? materials : initialStudyMaterials,
        listings: listings.length > 0 ? listings : initialMarketplaceListings,
        classes: initialClasses,
      }
    });
  } catch (error: any) {
    console.error('Firestore init-user error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize user in Firestore' },
      { status: 500 }
    );
  }
}
