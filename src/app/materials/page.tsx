'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  FolderDown,
  Search,
  Bookmark,
  Download,
  Upload,
  FileText,
  Link as LinkIcon,
  Flag,
  Share2,
  Check,
  Sparkles,
  Filter
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StudyMaterial } from '@/types';
import { supabase } from '@/lib/supabase/client';

export default function StudyMaterialsPage() {
  const { materials, toggleBookmarkMaterial, addMaterial, showToast, profile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('5th Semester');
  const [type, setType] = useState<'PDF' | 'Notes' | 'Slides' | 'Lab Manual' | 'Link' | 'Image'>('PDF');
  const [linkUrl, setLinkUrl] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report modal state
  const [reportingItem, setReportingItem] = useState<StudyMaterial | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Semesters for filter dropdown
  const semesters = ['All', '1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'];

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemester = selectedSemester === 'All' || m.semester === selectedSemester;
      const matchesType = selectedType === 'All' || m.type === selectedType;
      const matchesBookmark = !showBookmarksOnly || m.bookmarked;

      return matchesSearch && matchesSemester && matchesType && matchesBookmark;
    });
  }, [materials, searchQuery, selectedSemester, selectedType, showBookmarksOnly]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !courseCode.trim()) return;
    if (type === 'Link' && !linkUrl.trim()) { showToast('Enter a valid resource URL.'); return; }
    if (type !== 'Link' && type !== 'Notes' && !selectedFile) { showToast('Choose a PDF, image, or presentation file to upload.'); return; }
    if (selectedFile && selectedFile.size > 20 * 1024 * 1024) { showToast('File is too large. Maximum file size is 20 MB.'); return; }
    setIsSubmitting(true);
    try {
      let downloadUrl = type === 'Link' ? linkUrl.trim() : '';
      let storagePath = '';
      let fileSize = noteText.trim() ? 'Text notes' : '';
      if (selectedFile) {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        storagePath = `${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('study-materials').upload(storagePath, selectedFile, { cacheControl: '3600', upsert: false, contentType: selectedFile.type || undefined });
        if (uploadError) throw uploadError;
        // Bucket stays private. Create a temporary signed URL when the user opens the material.
        downloadUrl = '';
        fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;
      }
      await addMaterial({ title: title.trim(), subject: subject.trim(), courseCode: courseCode.trim(), semester, type, fileSize, uploadedBy: profile.name || profile.email, downloadUrl, storagePath, content: noteText.trim(), imageUrl: '' });
      setTitle(''); setSubject(''); setCourseCode(''); setLinkUrl(''); setNoteText(''); setSelectedFile(null); setIsUploadOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Upload failed. Check the study-materials storage bucket.');
    } finally { setIsSubmitting(false); }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;

    showToast(`Report submitted for "${reportingItem?.title}". Thank you!`);
    setReportingItem(null);
    setReportReason('');
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'PDF':
        return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
      case 'Slides':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
      case 'Link':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Study Materials Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access course lecture notes, past exam papers, slides, and academic resources.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search resource title, course code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Semester Selector */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>

            {/* Type Selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Resource Types</option>
              <option value="PDF">PDF Documents</option>
              <option value="Notes">Lecture Notes</option>
              <option value="Slides">Slides</option>
              <option value="Link">External Links</option>
              <option value="Image">Images</option>
            </select>

            {/* Bookmarks Toggle */}
            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                showBookmarksOnly
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-current' : ''}`} />
              <span>Bookmarks Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <FolderDown className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No study materials found</h3>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search or select a different semester filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getTypeBadge(item.type)}`}>
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBookmarkMaterial(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.bookmarked
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Bookmark material"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => setReportingItem(item)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Report material"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-primary dark:text-purple-400 uppercase tracking-wide">
                  {item.courseCode} • {item.subject}
                </span>

                {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover rounded-xl my-3" /> : null}
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug mt-1 mb-2">
                  {item.title}
                </h3>
                {item.content ? <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-4 mb-3">{item.content}</p> : null}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded by <span className="font-semibold text-slate-700 dark:text-slate-300">{item.uploadedBy}</span> on {item.uploadDate}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {item.fileSize}
                </span>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (item.storagePath) {
                        const { data, error } = await supabase.storage.from('study-materials').createSignedUrl(item.storagePath, 60 * 10, { download: item.type === 'PDF' });
                        if (error || !data?.signedUrl) throw error || new Error('Could not create a file link.');
                        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
                      } else if (item.downloadUrl && item.downloadUrl.startsWith('http')) {
                        window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
                      } else if (item.content) {
                        showToast('Text notes are shown on the material card.');
                      } else {
                        showToast('This resource has no attached file. Upload it again with a file selected.');
                      }
                    } catch (error) {
                      showToast(error instanceof Error ? error.message : 'Could not open this file. Check Storage read policies.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-purple-950/40 dark:hover:bg-primary rounded-xl text-xs font-bold transition-all"
                >
                  {item.type === 'Link' ? <LinkIcon className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{item.type === 'Link' ? 'Open Resource' : item.content && !item.downloadUrl ? 'Read Notes' : 'Open / Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Material Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Study Resource"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Kernel Architecture Notes"
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
                placeholder="e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS301"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {semesters.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="PDF">PDF File</option>
                <option value="Notes">Notes Document</option>
                <option value="Slides">Presentation Slides</option>
                <option value="Link">External Link / URL</option>
              </select>
            </div>
          </div>

          {type === 'Link' ? (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resource URL *</label>
              <input type="url" required placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
            </div>
          ) : (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attach PDF, photo, or slide file</label>
                <input type="file" accept={type === 'PDF' ? '.pdf,application/pdf' : type === 'Image' ? 'image/*' : '.pdf,.ppt,.pptx,.doc,.docx,image/*'} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white" />
                <p className="text-[11px] text-slate-500 mt-1">Maximum 20 MB. Files are uploaded to Supabase Storage.</p>
                {selectedFile ? <p className="text-[11px] text-primary mt-1">{selectedFile.name}</p> : null}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Text notes / description (optional)</label>
                <textarea rows={4} placeholder="Paste notes or explain what this resource contains..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Upload Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={reportingItem !== null}
        onClose={() => setReportingItem(null)}
        title="Report Content"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Reporting item: <strong className="text-slate-900 dark:text-white">{reportingItem?.title}</strong>
          </p>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for reporting *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Copyright violation, misleading file, or improper material..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReportingItem(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
