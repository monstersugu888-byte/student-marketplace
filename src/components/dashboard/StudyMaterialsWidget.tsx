'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { FolderDown, Bookmark, ArrowRight, FileText, Link as LinkIcon, Download } from 'lucide-react';

export const StudyMaterialsWidget: React.FC = () => {
  const { materials, toggleBookmarkMaterial, showToast } = useApp();

  const recentMaterials = materials.slice(0, 3);

  const getTypeBadge = (type: string) => {
    switch (type) {
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderDown className="w-5 h-5 text-indigo-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Recent Study Resources
          </h3>
        </div>
        <Link
          href="/materials"
          className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <span>Library ({materials.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentMaterials.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/60 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`p-2.5 rounded-xl font-bold text-xs shrink-0 ${getTypeBadge(item.type)}`}>
                {item.type === 'Link' ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>

              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {item.subject} • {item.uploadedBy}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleBookmarkMaterial(item.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  item.bookmarked
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Bookmark resource"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => showToast(`Downloading "${item.title}"...`)}
                className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Download material"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
