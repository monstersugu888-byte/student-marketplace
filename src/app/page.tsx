'use client';

import React from 'react';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { TodaySchedule } from '@/components/dashboard/TodaySchedule';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import { AssignmentDeadlineCards } from '@/components/dashboard/AssignmentDeadlineCards';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { StudyMaterialsWidget } from '@/components/dashboard/StudyMaterialsWidget';
import { MarketplaceHighlights } from '@/components/dashboard/MarketplaceHighlights';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Hero Banner */}
      <WelcomeBanner />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Schedule, Attendance & Pending Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule />
          <AttendanceWidget />
          <AssignmentDeadlineCards />
          <MarketplaceHighlights />
        </div>

        {/* Right 1 Column: Daily Task Checklist & Recent Study Materials */}
        <div className="space-y-6">
          <DailyChecklist />
          <StudyMaterialsWidget />
        </div>
      </div>
    </div>
  );
}
