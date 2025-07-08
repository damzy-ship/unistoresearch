import React, { useState, useEffect } from 'react';
import { School, Plus, Trash2, Search, Edit, Eye, EyeOff } from 'lucide-react';
import { School as SchoolType } from '../../lib/supabase';
import { getAllSchools, addSchool, updateSchool, deleteSchool } from '../../lib/schoolService';
import CustomDialog from './CustomDialog';
import CustomAlert from './CustomAlert';

export default function SchoolsTab() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<SchoolType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    short_name: '',
    is_active: true
  });
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const data = await getAllSchools();
      setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setSchoolForm({
      name: '',
      short_name: '',
      is_active: true
    });
    setShowAddForm(false);
    setEditingSchool(null);
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim() || !schoolForm.short_name.trim()) return;

    setSubmitting(true);
    try {
      const result = await addSchool(schoolForm.name, schoolForm.short_name);

      if (result.success) {
        resetForm();
        fetchSchools();
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'School Added',
          message: 'School has been successfully added.'
        });
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error Adding School',
          message: result.error || 'Failed to add school'
        });
      }
    } catch (error) {
      console.error('Error adding school:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Adding School',
        message: 'Error adding school. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !schoolForm.name.trim() || !schoolForm.short_name.trim()) return;

    setSubmitting(true);
    try {
      const result = await updateSchool(
        editingSchool.id,
        schoolForm.name,
        schoolForm.short_name,
        schoolForm.is_active
      );

      if (result.success) {
        resetForm();
        fetchSchools();
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'School Updated',
          message: 'School has been successfully updated.'
        });
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error Updating School',
          message: result.error || 'Failed to update school'
        });
      }
    } catch (error) {
      console.error('Error updating school:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Updating School',
        message: 'Error updating school. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!deletingSchool) return;
    
    setDeleting(true);
    try {
      const result = await deleteSchool(deletingSchool.id);

      if (result.success) {
        setDeletingSchool(null);
        fetchSchools();
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'School Deleted',
          message: `School "${deletingSchool.name}" has been successfully deleted.`
        });
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error Deleting School',
          message: result.error || 'Failed to delete school'
        });
        setDeletingSchool(null);
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Deleting School',
        message: 'Error deleting school. Please try again.'
      });
      setDeletingSchool(null);
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (school: SchoolType) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name,
      short_name: school.short_name,
      is_active: school.is_active
    });
    setShowAddForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Schools Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add School
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <School className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">{school.name}</h3>
                  {school.is_active ? (
                    <Eye className="w-4 h-4 text-green-500" title="Active" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" title="Inactive" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Short name: <span className="font-medium">{school.short_name}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Created {formatDate(school.created_at)}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(school)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit School"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingSchool(school)}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete School"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-12">
          <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No schools found matching your search' : 'No schools created yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Create the first school
            </button>
          )}
        </div>
      )}

      {/* Add/Edit School Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingSchool ? 'Edit School' : 'Add New School'}
            </h3>
            <form onSubmit={editingSchool ? handleEditSchool : handleAddSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="e.g., University of Lagos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Name
                </label>
                <input
                  type="text"
                  value={schoolForm.short_name}
                  onChange={(e) => setSchoolForm({...schoolForm, short_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="e.g., UNILAG"
                  required
                />
              </div>
              {editingSchool && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={schoolForm.is_active}
                    onChange={(e) => setSchoolForm({...schoolForm, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (editingSchool ? 'Updating...' : 'Adding...') : (editingSchool ? 'Update School' : 'Add School')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={!!deletingSchool}
        onClose={() => setDeletingSchool(null)}
        onConfirm={handleDeleteSchool}
        title="Delete School"
        message={`Are you sure you want to delete "${deletingSchool?.name}"? This action cannot be undone and may affect merchants associated with this school.`}
        confirmText="Delete School"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      {/* Alert Dialog */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}