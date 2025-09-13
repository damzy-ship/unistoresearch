import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { School } from '../lib/supabase';
import { getActiveSchools } from '../lib/schoolService';
import { useTheme } from '../hooks/useTheme';

interface UniversitySelectorProps {
  selectedUniversity: string;
  onUniversityChange: (university: string) => void;
}

export default function UniversitySelector({ selectedUniversity, onUniversityChange }: UniversitySelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setError(null);
        const activeSchools = await getActiveSchools();
        setSchools(activeSchools);
        
        // If no university is selected and we have schools, select the first one
        if (!selectedUniversity && activeSchools.length > 0) {
          onUniversityChange(activeSchools[0].id);
        } else if (activeSchools.length === 0) {
          setError('No schools available. Please check your connection.');
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        setError('Failed to load schools. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [selectedUniversity, onUniversityChange]);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSchool = schools.find(school => school.id === selectedUniversity);

  const handleSelectSchool = (school: School) => {
    onUniversityChange(school.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 text-red-700">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">Connection Error</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Refresh page
        </button>
      </div>
    );
  }

  // If we have 2 or fewer schools, show the original button layout
  if (schools.length <= 2) {
    return (
      <div className="flex gap-3">
        {loading ? (
          <div className="flex-1 py-2 px-6 rounded-xl bg-gray-100 animate-pulse">
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        ) : schools.map((school) => (
          <button
            key={school.id}
            type="button"
            className={`flex-1 py-2 px-6 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all duration-200 ${
              selectedUniversity === school.id
                ? `bg-gradient-to-r ${currentTheme.buttonGradient} text-white shadow-lg transform hover:scale-105`
                : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            }`}
            onClick={() => onUniversityChange(school.id)}
          >
            {school.short_name}
          </button>
        ))}
      </div>
    );
  }

  // For more than 2 schools, show dropdown
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-white"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-gray-900 font-medium">
            {loading ? 'Loading...' : selectedSchool ? selectedSchool.id : 'Select University'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search universities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Schools List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => handleSelectSchool(school)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    selectedUniversity === school.id ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{school.name}</div>
                  <div className="text-sm text-gray-500">{school.short_name}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No universities found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}