'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { Toast } from '../common/Toast';
import { QuickAddModals } from '../modals/QuickAddModals';
import { usePathname } from 'next/navigation';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [quickAddType, setQuickAddType] = useState<'assignment' | 'session' | 'task' | 'listing' | null>(null);

  // If on auth page, don't display sidebar and main header
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children}
        <Toast />
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
