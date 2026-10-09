'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  UserCheck,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  Percent,
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { SubjectAttendance } from '@/types';

export default function AttendancePage() {
  const {
    attendances,
    markAttendance,
    addSubjectAttendance,
    updateSubjectAttendance,
    deleteSubjectAttendance
  } = useApp();

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [attended, setAttended] = useState('15');
  const [total, setTotal] = useState('18');
  const [target, setTarget] = useState('75');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SubjectAttendance | null>(null);
  const [editAttended, setEditAttended] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editTarget, setEditTarget] = useState('75');

  // Overall Statistics
  const totalAttended = attendances.reduce((acc, curr) => acc + curr.attendedClasses, 0);
  const totalConducted = attendances.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;
  const atRiskCount = attendances.filter(a => {
    const pct = (a.attendedClasses / (a.totalClasses || 1)) * 100;
    return pct < a.targetPercentage;
  }).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !code) return;

    addSubjectAttendance(
      subject,
      code,
      instructor || 'Faculty',
      parseInt(attended) || 0,
      parseInt(total) || 0,
      parseInt(target) || 75
    );

    setSubject('');
    setCode('');
    setInstructor('');
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateSubjectAttendance(
      editingItem.id,
      parseInt(editAttended) || 0,
      parseInt(editTotal) || 0,
      parseInt(editTarget) || 75
    );

    setEditingItem(null);
  };

  // Helper calculation for "Classes you can miss" or "Classes needed to reach target"
  const getAttendanceAdvice = (item: SubjectAttendance) => {
    const { attendedClasses, totalClasses, targetPercentage } = item;
    const currentPct = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 100;
    const targetFraction = targetPercentage / 100;

    if (currentPct >= targetPercentage) {
      // How many classes can be missed while staying >= targetPercentage?
      // (attendedClasses) / (totalClasses + X) >= targetFraction
      // attendedClasses / targetFraction >= totalClasses + X
      // X = floor(attendedClasses / targetFraction - totalClasses)
      const canMiss = Math.floor(attendedClasses / targetFraction - totalClasses);
      if (canMiss > 0) {
        return {
          type: 'safe',
          text: `You can miss ${canMiss} next ${canMiss === 1 ? 'class' : 'classes'} and maintain ${targetPercentage}% attendance.`,
        };
      }
      return {
        type: 'safe',
        text: `You are right at your ${targetPercentage}% target limit!`,
      };
    } else {
      // How many consecutive classes needed to reach target?
      // (attendedClasses + Y) / (totalClasses + Y) >= targetFraction
      // attendedClasses + Y >= targetFraction * totalClasses + targetFraction * Y
      // Y * (1 - targetFraction) >= targetFraction * totalClasses - attendedClasses
      // Y = ceil((targetFraction * totalClasses - attendedClasses) / (1 - targetFraction))
      const needed = Math.ceil(
        (targetFraction * totalClasses - attendedClasses) / (1 - targetFraction)
      );
      return {
        type: 'risk',
        text: `Must attend next ${needed} consecutive ${needed === 1 ? 'class' : 'classes'} to reach ${targetPercentage}%.`,
      };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Attendance Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor course attendance percentages, track threshold limits (75%), and calculate safe absences.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-purple-900/10">
          <p className="text-[11px] font-bold text-purple-200 uppercase">Overall Rate</p>
          <p className="text-3xl font-extrabold mt-1">{overallPercentage}%</p>
          <p className="text-xs text-purple-200 mt-1">Across all {attendances.length} courses</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Attended</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{totalAttended}</p>
          <p className="text-xs text-slate-400 mt-1">out of {totalConducted} classes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Target Threshold</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">75%</p>
          <p className="text-xs text-slate-400 mt-1">University standard requirement</p>
        </div>

        <div className={`rounded-2xl p-5 border shadow-card ${
          atRiskCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <p className="text-[11px] font-bold uppercase text-slate-500">At-Risk Courses</p>
          <p className={`text-3xl font-extrabold mt-1 ${atRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {atRiskCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {atRiskCount === 0 ? 'All courses meet target!' : 'Subjects below 75% cutoff'}
          </p>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {attendances.map((item) => {
          const pct = item.totalClasses > 0 ? Math.round((item.attendedClasses / item.totalClasses) * 100) : 0;
          const isAtRisk = pct < item.targetPercentage;
          const advice = getAttendanceAdvice(item);

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-card hover:shadow-lg transition-all flex flex-col justify-between ${
                isAtRisk ? 'border-amber-300 dark:border-amber-800/60' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary dark:text-purple-400">
                      {item.code}
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {item.subject}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Instructor: {item.instructor}</p>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl font-extrabold text-sm border flex items-center gap-1 ${
                    isAtRisk
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    <span>{pct}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Attended: {item.attendedClasses} / {item.totalClasses} classes</span>
                    <span>Target: {item.targetPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Smart Attendance Calculator Advice Banner */}
                <div className={`p-3 rounded-xl text-xs font-medium mb-4 border flex items-center gap-2 ${
                  advice.type === 'risk'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}>
                  {advice.type === 'risk' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span>{advice.text}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markAttendance(item.id, 'Present')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>+ Present</span>
                  </button>

                  <button
                    onClick={() => markAttendance(item.id, 'Absent')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>+ Absent</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditAttended(item.attendedClasses.toString());
                      setEditTotal(item.totalClasses.toString());
                      setEditTarget(item.targetPercentage.toString());
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit total counts"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteSubjectAttendance(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Subject to Attendance Tracker"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Artificial Intelligence"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS402"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Marvin Minsky"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attended Classes
              </label>
              <input
                type="number"
                min="0"
                value={attended}
                onChange={(e) => setAttended(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Classes
              </label>
              <input
                type="number"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target %
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Counts Modal */}
      <Modal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title={`Edit Attendance - ${editingItem?.subject}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attended Classes
              </label>
              <input
                type="number"
                min="0"
                value={editAttended}
                onChange={(e) => setEditAttended(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Classes
              </label>
              <input
                type="number"
                min="0"
                value={editTotal}
                onChange={(e) => setEditTotal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target %
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
