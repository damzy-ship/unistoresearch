import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Search } from 'lucide-react';
import { ProductCategory } from '../../lib/supabase';
import { getAllCategories } from '../../lib/categoryService';
import { supabase } from '../../lib/supabase';
import CustomDialog from './CustomDialog';
import CustomAlert from './CustomAlert';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_categories')
        .insert({ name: newCategoryName.trim() });

      if (error) {
        if (error.code === '23505') {
          setAlert({
            isOpen: true,
            type: 'warning',
            title: 'Category Already Exists',
            message: 'A category with this name already exists.'
          });
        } else {
          throw error;
        }
      } else {
        setNewCategoryName('');
        setShowAddForm(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Adding Category',
        message: 'Error adding category. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    setDeleting(true);
    try {
      console.log('Attempting to delete category:', deletingCategory.id, deletingCategory.name);
      
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Category deleted successfully');
      
      // Refresh categories list
      await fetchCategories();
      
      // Close dialog first
      setDeletingCategory(null);
      
      // Show success alert
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Category Deleted',
        message: `Category "${deletingCategory.name}" has been successfully deleted.`
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      
      // More detailed error handling
      let errorMessage = 'Unknown error occurred';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = (error as any).details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Deleting Category',
        message: `Error deleting category: ${errorMessage}`
      });
      setDeletingCategory(null);
    } finally {
      setDeleting(false);
    }
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Product Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Created {formatDate(category.created_at)}
                </p>
              </div>
              <button
                onClick={() => setDeletingCategory(category)}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No categories found matching your search' : 'No categories created yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Create the first category
            </button>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="e.g., Electronics, Clothing, Books"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deletingCategory?.name}"? This action cannot be undone and will remove the category from all associated merchants.`}
        confirmText="Delete Category"
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