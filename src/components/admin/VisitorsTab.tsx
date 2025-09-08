import { useEffect, useState } from 'react';
import { UniqueVisitor, supabase, School } from '../../lib/supabase'; // Import School interface
import { Search, Filter, X, Calendar, Phone } from 'lucide-react';

interface VisitorsTabProps {
  visitors: UniqueVisitor[];
}

export default function VisitorsTab({ visitors }: VisitorsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localVisitors, setLocalVisitors] = useState<UniqueVisitor[]>(visitors);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [schools, setSchools] = useState<School[]>([]); // New state for schools

  useEffect(() => {
    setLocalVisitors(visitors);
  }, [visitors]);

  // New useEffect to fetch schools from Supabase
  useEffect(() => {
    async function fetchSchools() {
      const { data, error } = await supabase
        .from('schools')
        .select('id, short_name');

      if (error) {
        console.error('Error fetching schools:', error);
      } else {
        setSchools(data || []);
      }
    }

    fetchSchools();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const filteredVisitors = localVisitors.filter(visitor => {
    const matchesSearch = !searchTerm || 
      visitor.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.phone_number && visitor.phone_number.includes(searchTerm));
    
    const matchesPhone = phoneFilter === '' || 
      (phoneFilter === 'with' && visitor.phone_number) ||
      (phoneFilter === 'without' && !visitor.phone_number);
    
    const matchesDate = !dateFilter || 
      formatDateForInput(visitor.first_visit) === dateFilter;
    
    return matchesSearch && matchesPhone && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setPhoneFilter('');
    setDateFilter('');
  };

  const activeFiltersCount = [phoneFilter, dateFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Unique Visitors</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search visitors by user ID or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
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
            Showing {filteredVisitors.length} of {visitors.length} visitors
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <select
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="">All Visitors</option>
                  <option value="with">With Phone Number</option>
                  <option value="without">Without Phone Number</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  First Visit Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Visit
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">
                    {visitor.user_id}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={visitor.user_type || 'visitor'}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          setUpdatingIds((s) => [...s, visitor.id]);
                          try {
                            const { error } = await supabase
                              .from('unique_visitors')
                              .update({ user_type: newType })
                              .eq('id', visitor.id);
                            if (error) {
                              console.error('Error updating user_type:', error);
                            } else {
                              setLocalVisitors((list) =>
                                list.map((v) => (v.id === visitor.id ? { ...v, user_type: newType } : v))
                              );
                            }
                          } catch (err) {
                            console.error('Unexpected error updating user_type:', err);
                          } finally {
                            setUpdatingIds((s) => s.filter((id) => id !== visitor.id));
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                        disabled={updatingIds.includes(visitor.id)}
                      >
                        <option value="visitor">Visitor</option>
                        <option value="user">User</option>
                        <option value="merchant">Merchant</option>
                      </select>
                      {updatingIds.includes(visitor.id) && (
                        <span className="text-xs text-gray-500">Updating…</span>
                      )}
                      {!updatingIds.includes(visitor.id) && visitor.user_type === 'merchant' && (
                        <span className="text-xs text-green-700 px-2 py-0.5 bg-green-100 rounded-full">M</span>
                      )}
                    </div>
                  </td>
                  {/* New School dropdown column */}
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                    <select
                      value={visitor.school_id || ''}
                      onChange={async (e) => {
                        const newSchoolId = e.target.value;
                        setUpdatingIds((s) => [...s, visitor.id]);
                        try {
                          const { error } = await supabase
                            .from('unique_visitors')
                            .update({ school_id: newSchoolId })
                            .eq('id', visitor.id);
                          if (error) {
                            console.error('Error updating school:', error);
                          } else {
                            setLocalVisitors((list) =>
                              list.map((v) => (v.id === visitor.id ? { ...v, school_id: newSchoolId } : v))
                            );
                          }
                        } catch (err) {
                          console.error('Unexpected error updating school:', err);
                        } finally {
                          setUpdatingIds((s) => s.filter((id) => id !== visitor.id));
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                      disabled={updatingIds.includes(visitor.id)}
                    >
                      <option value="">No School</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.short_name}
                        </option>
                      ))}
                    </select>
                    {updatingIds.includes(visitor.id) && (
                      <span className="text-xs text-gray-500">Updating…</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {visitor.full_name || <span className="text-gray-400">Not provided</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {visitor.phone_number ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {visitor.phone_number}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {formatDate(visitor.first_visit)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {formatDate(visitor.last_visit)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {visitor.visit_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredVisitors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {visitors.length === 0 ? 'No visitors yet' : 'No visitors match your current filters'}
            </div>
            {visitors.length > 0 && filteredVisitors.length === 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}