'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '@/context/AppContext';
import { Priority, MarketplaceCategory, ItemCondition } from '@/types';

interface QuickAddProps {
  activeType: 'assignment' | 'session' | 'task' | 'listing' | null;
  onClose: () => void;
}

export const QuickAddModals: React.FC<QuickAddProps> = ({ activeType, onClose }) => {
  const {
    addAssignment,
    addStudySession,
    addDailyTask,
    addListing,
    profile
  } = useApp();

  // Assignment Form State
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubject, setAsgSubject] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgDueTime, setAsgDueTime] = useState('23:59');
  const [asgPriority, setAsgPriority] = useState<Priority>('Medium');

  // Study Session Form State
  const [sesTitle, setSesTitle] = useState('');
  const [sesSubject, setSesSubject] = useState('');
  const [sesDate, setSesDate] = useState('');
  const [sesStartTime, setSesStartTime] = useState('14:00');
  const [sesEndTime, setSesEndTime] = useState('16:00');
  const [sesLocation, setSesLocation] = useState('');
  const [sesNotes, setSesNotes] = useState('');

  // Daily Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCat, setTaskCat] = useState('Study');

  // Marketplace Listing Form State
  const [mktTitle, setMktTitle] = useState('');
  const [mktDesc, setMktDesc] = useState('');
  const [mktPrice, setMktPrice] = useState('');
  const [mktCategory, setMktCategory] = useState<MarketplaceCategory>('Books');
  const [mktCondition, setMktCondition] = useState<ItemCondition>('Like New');
  const [mktImage, setMktImage] = useState('');
  const [mktContact, setMktContact] = useState(profile.email);
  const [mktLocation, setMktLocation] = useState('Student Campus Lounge');

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgSubject || !asgDueDate) return;

    addAssignment({
      title: asgTitle,
      subject: asgSubject,
      description: asgDesc,
      dueDate: asgDueDate,
      dueTime: asgDueTime,
      priority: asgPriority,
      status: 'Not Started',
    });

    setAsgTitle('');
    setAsgSubject('');
    setAsgDesc('');
    setAsgDueDate('');
    onClose();
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesTitle || !sesSubject || !sesDate) return;

    addStudySession({
      title: sesTitle,
      subject: sesSubject,
      date: sesDate,
      startTime: sesStartTime,
      endTime: sesEndTime,
      location: sesLocation,
      notes: sesNotes,
    });

    setSesTitle('');
    setSesSubject('');
    setSesDate('');
    onClose();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    addDailyTask(taskTitle, taskCat);
    setTaskTitle('');
    onClose();
  };

  const handleListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mktTitle || !mktPrice) return;

    addListing({
      title: mktTitle,
      description: mktDesc || 'Great student item up for grabs!',
      price: parseFloat(mktPrice) || 10,
      category: mktCategory,
      condition: mktCondition,
      status: 'Available',
      imageUrl: mktImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      sellerContact: mktContact,
      location: mktLocation,
    });

    setMktTitle('');
    setMktDesc('');
    setMktPrice('');
    onClose();
  };

  return (
    <>
      {/* 1. Add Assignment Modal */}
      <Modal
        isOpen={activeType === 'assignment'}
        onClose={onClose}
        title="Add New Assignment"
      >
        <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Lab 4"
              value={asgTitle}
              onChange={(e) => setAsgTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Course *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={asgSubject}
                onChange={(e) => setAsgSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={asgPriority}
                onChange={(e) => setAsgPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
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
                value={asgDueDate}
                onChange={(e) => setAsgDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={asgDueTime}
                onChange={(e) => setAsgDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Requirements
            </label>
            <textarea
              rows={3}
              placeholder="Add lab specs, submit link, or guidelines..."
              value={asgDesc}
              onChange={(e) => setAsgDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Study Session Modal */}
      <Modal
        isOpen={activeType === 'session'}
        onClose={onClose}
        title="Schedule Personal Study Session"
      >
        <form onSubmit={handleSessionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Session Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Exam Prep Group"
              value={sesTitle}
              onChange={(e) => setSesTitle(e.target.value)}
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
                placeholder="e.g. Algorithms"
                value={sesSubject}
                onChange={(e) => setSesSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={sesDate}
                onChange={(e) => setSesDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={sesStartTime}
                onChange={(e) => setSesStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={sesEndTime}
                onChange={(e) => setSesEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location / Room
            </label>
            <input
              type="text"
              placeholder="e.g. Campus Library Room 3B"
              value={sesLocation}
              onChange={(e) => setSesLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Study Notes / Agenda
            </label>
            <textarea
              rows={2}
              placeholder="What to study or review during this session..."
              value={sesNotes}
              onChange={(e) => setSesNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Add Session
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Add Daily Task Modal */}
      <Modal
        isOpen={activeType === 'task'}
        onClose={onClose}
        title="Add Daily Checklist Task"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Task Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Return library book or review lecture notes"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Tag
            </label>
            <select
              value={taskCat}
              onChange={(e) => setTaskCat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="Study">Study</option>
              <option value="Homework">Homework</option>
              <option value="Campus">Campus & Hostel</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Create Marketplace Listing Modal */}
      <Modal
        isOpen={activeType === 'listing'}
        onClose={onClose}
        title="Create Student Marketplace Listing"
      >
        <form onSubmit={handleListingSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engineering Physics Textbook 8th Ed"
              value={mktTitle}
              onChange={(e) => setMktTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Price ($ USD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="25"
                value={mktPrice}
                onChange={(e) => setMktPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={mktCategory}
                onChange={(e) => setMktCategory(e.target.value as MarketplaceCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Books">Books & Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Stationery">Stationery</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Hostel Essentials">Hostel Essentials</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={mktCondition}
                onChange={(e) => setMktCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                value={mktLocation}
                onChange={(e) => setMktLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Image URL (optional)
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={mktImage}
              onChange={(e) => setMktImage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Details
            </label>
            <textarea
              rows={3}
              placeholder="Item condition details, reason for selling..."
              value={mktDesc}
              onChange={(e) => setMktDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contact Information for Buyers
            </label>
            <input
              type="text"
              value={mktContact}
              onChange={(e) => setMktContact(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Post Item
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
