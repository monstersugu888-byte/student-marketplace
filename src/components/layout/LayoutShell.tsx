'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { Toast } from '../common/Toast';
import { QuickAddModals } from '../modals/QuickAddModals';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickAddType, setQuickAddType] = useState<'assignment' | 'session' | 'task' | 'listing' | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Authentication, registration and email callbacks must remain reachable
  // without a session. Teacher approval links also need to open from email.
  const isPublicPage = pathname?.startsWith('/auth') || pathname?.startsWith('/teacher-approval');

  useEffect(() => {
    if (isPublicPage) {
      setAuthChecked(true);
      return;
    }

    let active = true;
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      const validSession = !error && Boolean(data.session?.user);
      setHasSession(validSession);
      setAuthChecked(true);
      if (!validSession) {
        // Remove any stale private UI cache from earlier demo/local sessions.
        for (const key of ['cm_profile', 'cm_assignments', 'cm_attendances', 'cm_materials', 'cm_listings', 'cm_tasks', 'cm_sessions']) {
          localStorage.removeItem(key);
        }
        router.replace('/auth/login');
      }
    };

    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const validSession = Boolean(session?.user);
      setHasSession(validSession);
      if (!validSession) router.replace('/auth/login');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [isPublicPage, pathname, router]);

  if (isPublicPage) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children}
        <Toast />
      </main>
    );
  }

  // Do not render private dashboard content until Supabase confirms a session.
  if (!authChecked || !hasSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-sm font-medium">Checking your sign-in…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Header onOpenQuickAdd={(type) => setQuickAddType(type)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <Toast />
      <QuickAddModals
        activeType={quickAddType}
        onClose={() => setQuickAddType(null)}
      />
    </div>
  );
}
