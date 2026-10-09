import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import LayoutShell from '@/components/layout/LayoutShell';

export const metadata: Metadata = {
  title: 'CampusMate - Student Productivity Portal',
  description: 'Your entire college life, organized in one place. Assignments, timetables, study materials, student marketplace & schedule management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <AppProvider>
          <LayoutShell>{children}</LayoutShell>
        </AppProvider>
      </body>
    </html>
  );
}
