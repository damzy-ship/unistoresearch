import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Store, Search, Filter, X, Calendar, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { Merchant } from '../../lib/supabase';
import MerchantForm from './MerchantForm/index';
import MerchantView from './MerchantView';
import MerchantEdit from './MerchantEdit/index';
import ConfirmDialog from './ConfirmDialog';
import StarRating from '../StarRating';

interface MerchantsTabProps {
  merchants: Merchant[];
  onRefresh: () => void;
}

export default function MerchantsTab({ merchants, onRefresh }: MerchantsTabProps) {
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  const [viewingMerchant, setViewingMerchant] = useState<Merchant | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [deletingMerchant, setDeletingMerchant] = useState<Merchant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique schools for filter
  const uniqueSchools = Array.from(new Set(merchants.map(m => m.school_name))).sort();

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const isWithinDateRange = (merchantDate: string, range: string) => {
    const date = new Date(merchantDate);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return formatDateForInput(merchantDate) === formatDateForInput(now.toISOString());
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return date >= quarterAgo;
      default:
        return true;
    }
  };

  const isSellerActive = (merchant: any) => {
    if (!merchant.billing_date || !merchant.is_billing_active) return true;
    const currentDate = new Date().toISOString().split('T')[0];
    return merchant.billing_date > currentDate;
  };

  const matchesRatingFilter = (merchant: any) => {
    if (!ratingFilter) return true;
    
    const rating = merchant.average_rating || 0;
    const totalRatings = merchant.total_ratings || 0;
    
    switch (ratingFilter) {
      case 'no-ratings':
        return totalRatings === 0;
      case 'low':
        return totalRatings > 0 && rating < 3;
      case 'good':
        return totalRatings > 0 && rating >= 3 && rating < 4;
      case 'excellent':
        return totalRatings > 0 && rating >= 4;
      case 'top-rated':
        return totalRatings >= 10 && rating >= 4.5;
      default:
        return true;
    }
  };

  // Filter merchants based on search and filters
  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = !searchTerm || 
      merchant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.seller_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.seller_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSchool = !schoolFilter || merchant.school_name === schoolFilter;
    const matchesDate = !dateFilter || formatDateForInput(merchant.created_at) === dateFilter;
    const matchesDateRange = !dateRangeFilter || isWithinDateRange(merchant.created_at, dateRangeFilter);
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && isSellerActive(merchant)) ||
      (statusFilter === 'inactive' && !isSellerActive(merchant));
    
    return matchesSearch && matchesSchool && matchesDate && matchesDateRange && matchesRatingFilter(merchant) && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleFormSuccess = () => {
    setShowMerchantForm(false);
    onRefresh();
  };

  const handleEditSuccess = () => {
    setEditingMerchant(null);
    onRefresh();
  };

  const handleDeleteSuccess = () => {
    setDeletingMerchant(null);
    onRefresh();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSchoolFilter('');
    setDateFilter('');
    setDateRangeFilter('');
    setRatingFilter('');
    setStatusFilter('');
  };

  const activeFiltersCount = [schoolFilter, dateFilter, dateRangeFilter, ratingFilter, statusFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Registered Merchants</h2>
        <button
          onClick={() => setShowMerchantForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add Merchant
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search merchants by name, email, seller ID, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Toggle and Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {(searchTerm || activeFiltersCount > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredMerchants.length} of {merchants.length} merchants
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* School Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Schools</option>
                  {uniqueSchools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Registration Period
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>

              {/* Specific Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Specific Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="no-ratings">No Ratings</option>
                  <option value="low">Low (&lt; 3 stars)</option>
                  <option value="good">Good (3-4 stars)</option>
                  <option value="excellent">Excellent (4+ stars)</option>
                  <option value="top-rated">Top Rated (4.5+ with 10+ reviews)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Billing Due)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merchants List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Due
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMerchants.map((merchant) => {
                const merchantWithRating = merchant as any;
                return (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">
                      {merchant.seller_id}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {merchant.full_name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {merchant.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {(merchantWithRating.total_ratings || 0) > 0 ? (
                        <StarRating
                          rating={merchantWithRating.average_rating || 0}
                          totalRatings={merchantWithRating.total_ratings || 0}
                          size="sm"
                          showCount={false}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No ratings</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {(merchant as any).billing_date ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isSellerActive(merchant) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {new Date((merchant as any).billing_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {isSellerActive(merchant) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        merchant.school_name === 'Bingham University' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {merchant.school_name}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {formatDate(merchant.created_at)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingMerchant(merchant)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingMerchant(merchant)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Merchant"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMerchant(merchant)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Merchant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {merchants.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No merchants registered yet</p>
            <button
              onClick={() => setShowMerchantForm(true)}
              className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
            >
              Register the first merchant
            </button>
          </div>
        ) : filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No merchants match your current filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showMerchantForm && (
        <MerchantForm
          onClose={() => setShowMerchantForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {viewingMerchant && (
        <MerchantView
          merchant={viewingMerchant}
          onClose={() => setViewingMerchant(null)}
          onEdit={() => {
            setEditingMerchant(viewingMerchant);
            setViewingMerchant(null);
          }}
        />
      )}

      {editingMerchant && (
        <MerchantEdit
          merchant={editingMerchant}
          onClose={() => setEditingMerchant(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingMerchant && (
        <ConfirmDialog
          title="Delete Merchant"
          message={`Are you sure you want to delete ${deletingMerchant.full_name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteSuccess}
          onCancel={() => setDeletingMerchant(null)}
          merchant={deletingMerchant}
        />
      )}
    </div>
  );
}