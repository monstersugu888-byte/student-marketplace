import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/supabase/request-auth';
import { initialClasses, initialProfile } from '@/data/mockData';

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const user = auth.user!;
  try {
    const [profileResult, assignmentsResult, submissionsResult, attendanceResult, tasksResult, sessionsResult, notificationsResult, materialsResult, bookmarksResult, listingsResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
      supabaseAdmin.from('assignments').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('assignment_submissions').select('*').eq('student_id', user.id),
      supabaseAdmin.from('attendance_subjects').select('*').eq('student_id', user.id),
      supabaseAdmin.from('daily_tasks').select('*').eq('user_id', user.id).order('created_at'),
      supabaseAdmin.from('study_sessions').select('*').eq('user_id', user.id).order('session_date'),
      supabaseAdmin.from('user_notifications').select('*').eq('user_id', user.id).order('notification_time', { ascending: false }),
      supabaseAdmin.from('study_materials').select('*').order('upload_date', { ascending: false }),
      supabaseAdmin.from('material_bookmarks').select('material_id').eq('user_id', user.id),
      supabaseAdmin.from('marketplace_listings').select('*').order('created_at', { ascending: false }),
    ]);
    const failed = [profileResult, assignmentsResult, submissionsResult, attendanceResult, tasksResult, sessionsResult, notificationsResult, materialsResult, bookmarksResult, listingsResult].find(result => result.error);
    if (failed?.error) {
      console.error('Supabase init-user failed:', failed.error.message);
      return NextResponse.json({ success: false, error: 'Supabase schema is incomplete. Apply the latest migration and try again.' }, { status: 503 });
    }
    const profileRow = profileResult.data;
    const profile = {
      ...initialProfile, ...(profileRow.profile_data || {}),
      id: user.id, email: user.email, name: profileRow.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      role: profileRow.role, teacherAccessStatus: profileRow.teacher_access_status, avatar: '',
    };
    const submissions = new Map((submissionsResult.data || []).map(row => [row.assignment_id, row]));
    const assignments = (assignmentsResult.data || []).map(row => {
      const sub = submissions.get(row.id);
      return {
        id: row.id, title: row.title, subject: row.subject, description: row.description, dueDate: row.due_date,
        priority: row.priority, createdAt: row.created_at,
        status: sub?.status === 'approved' ? 'Completed' : sub?.status === 'pending' ? 'In Progress' : 'Not Started',
        submissionUrl: sub?.submission_url || '', submissionText: sub?.submission_text || '',
        submissionStatus: sub?.status || null, feedback: sub?.feedback || '',
      };
    });
    const attendances = (attendanceResult.data || []).map(row => ({
      id: row.id, subject: row.subject, code: row.code, instructor: row.instructor,
      attendedClasses: row.attended_classes, totalClasses: row.total_classes,
      targetPercentage: Number(row.target_percentage), history: row.history || [],
    }));
    const dailyTasks = (tasksResult.data || []).map(row => ({ id: row.id, title: row.title, completed: row.completed, category: row.category }));
    const studySessions = (sessionsResult.data || []).map(row => ({
      id: row.id, title: row.title, subject: row.subject, date: row.session_date,
      startTime: row.start_time, endTime: row.end_time, notes: row.notes, location: row.location,
    }));
    const notifications = (notificationsResult.data || []).map(row => ({
      id: row.id, title: row.title, message: row.message, timestamp: row.notification_time,
      type: row.type, read: row.read, link: row.link,
    }));
    const bookmarked = new Set((bookmarksResult.data || []).map(row => row.material_id));
    const materials = await Promise.all((materialsResult.data || []).map(async row => {
      let downloadUrl = row.download_url || '';
      if (row.storage_path) {
        const { data } = await supabaseAdmin.storage.from('study-materials').createSignedUrl(row.storage_path, 600);
        downloadUrl = data?.signedUrl || '';
      }
      return {
        id: row.id, title: row.title, subject: row.subject, courseCode: row.course_code,
        semester: row.semester, type: row.type, content: row.content, storagePath: row.storage_path,
        downloadUrl, fileSize: row.file_size, uploadedBy: row.uploaded_by, uploadDate: row.upload_date,
        downloadsCount: row.downloads_count, bookmarked: bookmarked.has(row.id),
      };
    }));
    const listings = (listingsResult.data || []).map(row => ({
      id: row.id, title: row.title, description: row.description || '', price: Number(row.price || 0), category: row.category,
      condition: row.item_condition || 'Good', status: row.status === 'active' ? 'Available' : row.status === 'reserved' ? 'Reserved' : 'Sold',
      imageUrl: row.image_url || '', postedDate: row.created_at, sellerName: row.seller_name || 'Student seller', sellerAvatar: '',
      sellerContact: row.seller_contact || '', location: row.location || '', isOwner: row.seller_id === user.id,
    }));
    return NextResponse.json({ success: true, data: {
      profile, assignments, attendances, dailyTasks, studySessions, notifications, materials, listings, classes: initialClasses,
    } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Supabase init-user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize your CampusMate data.' }, { status: 500 });
  }
}
