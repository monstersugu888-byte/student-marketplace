'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Trash2,
  Edit2,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { apiFetch } from '@/lib/api-fetch';
import { Priority, AssignmentStatus, Assignment } from '@/types';

export default function AssignmentsPage() {
  const {
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    toggleAssignmentStatus,
    userRole,
    isAuthenticated,
    refreshFromCloud,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const isTeacher = isAuthenticated && userRole === 'teacher';

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<AssignmentStatus>('Not Started');

  // Subject list for dropdown
  const subjects = useMemo(() => {
    const list = Array.from(new Set(assignments.map(a => a.subject)));
    return ['All', ...list];
  }, [assignments]);

  // Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const notStarted = assignments.filter(a => a.status === 'Not Started').length;
    const inProgress = assignments.filter(a => a.status === 'In Progress').length;
    const completed = assignments.filter(a => a.status === 'Completed').length;
    const overdue = assignments.filter(a => a.status !== 'Completed' && new Date(a.dueDate) < new Date()).length;
    return { total, notStarted, inProgress, completed, overdue };
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = selectedSubject === 'All' || a.subject === selectedSubject;
      const matchesPriority = selectedPriority === 'All' || a.priority === selectedPriority;
      const matchesStatus = selectedStatus === 'All' || a.status === selectedStatus;

      return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
    });
  }, [assignments, searchQuery, selectedSubject, selectedPriority, selectedStatus]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSubject('');
    setDescription('');
    setDueDate('');
    setDueTime('23:59');
    setPriority('Medium');
    setStatus('Not Started');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Assignment) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubject(item.subject);
    setDescription(item.description);
    setDueDate(item.dueDate);
    setDueTime(item.dueTime || '23:59');
    setPriority(item.priority);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !dueDate) return;

    if (editingId) {
      updateAssignment(editingId, {
        title,
        subject,
        description,
        dueDate,
        dueTime,
        priority,
        status,
      });
    } else {
      addAssignment({
        title,
        subject,
        description,
        dueDate,
        dueTime,
        priority,
        status,
      });
    }
    setIsModalOpen(false);
  };

  const submitAssignmentFile = async (assignmentId: string) => {
    const file = submissionFiles[assignmentId];
    if (!file) { showToast('Choose your completed assignment file first.'); return; }
    if (file.size > 20 * 1024 * 1024) { showToast('File size must be 20 MB or less.'); return; }
    setSubmittingId(assignmentId);
    try {
      const form = new FormData();
      form.set('file', file);
      const uploadResponse = await apiFetch('/api/assignments/upload', { method: 'POST', body: form });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || 'Upload failed.');
      const submitResponse = await apiFetch('/api/assignments', {
        method: 'PUT',
        body: JSON.stringify({ id: assignmentId, updated: { submissionPath: uploadData.submissionPath } }),
      });
      const submitData = await submitResponse.json();
      if (!submitResponse.ok) throw new Error(submitData.error || 'Submission failed.');
      setSubmissionFiles(prev => ({ ...prev, [assignmentId]: null }));
      showToast('Assignment uploaded and sent to your teacher for review.');
      await refreshFromCloud();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not submit assignment.');
    } finally { setSubmittingId(null); }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Low':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getStatusBadge = (s: AssignmentStatus) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
      case 'Not Started':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Assignments Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track deadlines, organize coursework, and prioritize academic deliverables.
          </p>
        </div>

        {isTeacher && <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Not Started</p>
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">{stats.notStarted}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/40 shadow-xs">
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">Overdue</p>
          <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters & View Toggle Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignment title, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Subjects</option>
              {subjects.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Grid/List View Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-0.5 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-slate-400'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-slate-400'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment List/Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No assignments found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting search filters or add a new assignment.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((item) => {
            const isOverdue = item.status !== 'Completed' && new Date(item.dueDate) < new Date();

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-card hover:shadow-lg transition-all flex flex-col justify-between ${
                  isOverdue ? 'border-red-300 dark:border-red-900/60 bg-red-50/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary dark:text-purple-400">
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {item.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                {!isTeacher && <div className="mb-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold">{(item as any).submissionStatus === 'approved' ? 'Approved by teacher' : (item as any).submissionStatus === 'pending' ? 'Submitted — awaiting teacher approval' : (item as any).submissionStatus === 'rejected' ? 'Rejected — upload a revised file' : 'Upload your completed work'}</p>
                  {(item as any).submissionUrl && <a href={(item as any).submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 underline">View latest submission</a>}
                  {(item as any).feedback && <p className="text-xs text-slate-500">Teacher feedback: {(item as any).feedback}</p>}
                  {(item as any).submissionStatus !== 'approved' && <><input type="file" onChange={e=>setSubmissionFiles(prev=>({...prev,[item.id]:e.target.files?.[0] || null}))} className="block w-full text-xs" /><button disabled={submittingId===item.id} onClick={()=>void submitAssignmentFile(item.id)} className="w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{submittingId===item.id?'Uploading…':'Upload & submit for approval'}</button></>}
                </div>}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-xs font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isOverdue ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                    <span>Due: {item.dueDate}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isTeacher && <>
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Edit assignment"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteAssignment(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Delete assignment"><Trash2 className="w-4 h-4" /></button>
                    </>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Title & Description</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">{item.description}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-primary">{item.subject}</td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">{item.dueDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isTeacher && <>
                          <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="Edit assignment"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteAssignment(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg" title="Delete assignment"><Trash2 className="w-4 h-4" /></button>
                        </>}
                        {!isTeacher && <span className="text-[10px] text-slate-500">Submit work in grid view</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Assignment' : 'Create Assignment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
