import React from 'react';
import { Users, MessageSquare, Calendar, Store, Star } from 'lucide-react';

interface DashboardStats {
  totalVisitors: number;
  totalRequests: number;
  binghamRequests: number;
  veritasRequests: number;
  todayVisitors: number;
  todayRequests: number;
  totalMerchants: number;
  averageRating?: number;
  totalRatings?: number;
}

interface OverviewTabProps {
  stats: DashboardStats;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Visitors</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalVisitors}</p>
            </div>
            <Users className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <MessageSquare className="w-6 sm:w-8 h-6 sm:h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Today's New Visitors</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.todayVisitors}</p>
            </div>
            <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Requests</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.todayRequests}</p>
            </div>
            <MessageSquare className="w-6 sm:w-8 h-6 sm:h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Merchants</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalMerchants}</p>
            </div>
            <Store className="w-6 sm:w-8 h-6 sm:h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">
                {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalRatings || 0} review{(stats.totalRatings || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <Star className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* University Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">University Requests</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Bingham University</span>
              <span className="font-semibold text-orange-600">{stats.binghamRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Veritas University</span>
              <span className="font-semibold text-blue-600">{stats.veritasRequests}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">First-time Visitors</span>
              <span className="font-semibold text-green-600">{stats.todayVisitors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Requests Made</span>
              <span className="font-semibold text-blue-600">{stats.todayRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}