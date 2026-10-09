'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ShoppingBag,
  Search,
  Plus,
  Tag,
  MapPin,
  MessageSquare,
  Flag,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  Laptop,
  PenTool,
  FlaskConical,
  Home
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { MarketplaceCategory, ItemCondition, MarketplaceListing } from '@/types';

const CATEGORIES: MarketplaceCategory[] = [
  'Books',
  'Electronics',
  'Stationery',
  'Lab Equipment',
  'Hostel Essentials',
  'Other'
];

export default function MarketplacePage() {
  const {
    listings,
    addListing,
    updateListingStatus,
    deleteListing,
    profile,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');

  // Contact modal state
  const [contactingItem, setContactingItem] = useState<MarketplaceListing | null>(null);
  const [customMsg, setCustomMsg] = useState('');

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('Books');
  const [condition, setCondition] = useState<ItemCondition>('Like New');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('Central Student Center');
  const [contact, setContact] = useState(profile.email);

  // Report modal state
  const [reportingItem, setReportingItem] = useState<MarketplaceListing | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Filtered listings
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
      const matchesCond = selectedCondition === 'All' || l.condition === selectedCondition;

      return matchesSearch && matchesCat && matchesCond;
    });
  }, [listings, searchQuery, selectedCategory, selectedCondition]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;

    addListing({
      title,
      description: description || 'Great student item up for grabs!',
      price: parseFloat(price) || 10,
      category,
      condition,
      status: 'Available',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      sellerContact: contact,
      location,
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setIsCreateOpen(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Message sent to seller (${contactingItem?.sellerName})!`);
    setContactingItem(null);
    setCustomMsg('');
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Listing reported. Our moderators will review it shortly.`);
    setReportingItem(null);
    setReportReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Reserved':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Sold':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Student Marketplace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Buy, sell, or trade textbooks, lab gear, electronics, and campus essentials safely.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {/* Category Pills & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Condition Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, textbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Conditions</option>
              <option value="Brand New">Brand New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No marketplace listings found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting search filters or post a new product.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-xs shadow-sm">
                      {item.condition}
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl text-sm font-extrabold bg-primary text-white shadow-md">
                    ${item.price}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-primary dark:text-purple-400">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.postedDate}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <img
                      src={item.sellerAvatar}
                      alt={item.sellerName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.sellerName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {item.isOwner ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-slate-500">Status:</span>
                      <select
                        value={item.status}
                        onChange={(e) => updateListingStatus(item.id, e.target.value as any)}
                        className="px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>

                    <button
                      onClick={() => deleteListing(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      title="Delete your listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setReportingItem(item)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors text-xs"
                      title="Report listing"
                    >
                      <Flag className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setContactingItem(item);
                        setCustomMsg(`Hi ${item.sellerName}! I saw your "${item.title}" listed for $${item.price}. Is it still available to meet on campus?`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Seller</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Student Listing"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TI-84 Plus CE Graphing Calculator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                placeholder="45"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Image URL
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Product specs, condition description, package contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
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

      {/* Contact Seller Modal */}
      <Modal
        isOpen={contactingItem !== null}
        onClose={() => setContactingItem(null)}
        title={`Contact Seller - ${contactingItem?.sellerName}`}
      >
        <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <img
              src={contactingItem?.sellerAvatar}
              alt={contactingItem?.sellerName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{contactingItem?.sellerName}</p>
              <p className="text-[11px] text-slate-500">{contactingItem?.sellerContact}</p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message to Seller
            </label>
            <textarea
              rows={4}
              required
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setContactingItem(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Send Message
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Listing Modal */}
      <Modal
        isOpen={reportingItem !== null}
        onClose={() => setReportingItem(null)}
        title="Report Marketplace Listing"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Reporting listing: <strong className="text-slate-900 dark:text-white">{reportingItem?.title}</strong>
          </p>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for reporting *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Spam, illegal item, counterfeit, or misleading pricing..."
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
