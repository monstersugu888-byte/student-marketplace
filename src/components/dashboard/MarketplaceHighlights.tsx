'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ShoppingBag, ArrowRight, Tag, MapPin } from 'lucide-react';

export const MarketplaceHighlights: React.FC = () => {
  const { listings } = useApp();

  const featured = listings.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Marketplace Highlights
          </h3>
        </div>
        <Link
          href="/marketplace"
          className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <span>Browse All ({listings.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {featured.map((item) => (
          <Link
            key={item.id}
            href={`/marketplace`}
            className="group rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-28 w-full overflow-hidden bg-slate-200">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-xs">
                  {item.condition}
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-xs font-extrabold bg-primary text-white shadow-sm">
                  ${item.price}
                </span>
              </div>

              <div className="p-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {item.category}
                </p>
              </div>
            </div>

            <div className="p-3 pt-0 text-[10px] text-slate-400 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
