import React from 'react';
import { Tag, Sparkles, Minus, Plus, Search } from 'lucide-react';

interface CategoryManagerProps {
  existingCategories: string[];
  generatedCategories: string[];
  manualCategories: string[];
  availableCategories: string[];
  categorySearchTerm: string;
  showCategorySelector: boolean;
  loadingExistingCategories: boolean;
  generatingCategories: boolean;
  merchantForm: any;
  onRemoveExistingCategory: (category: string) => void;
  onRemoveGeneratedCategory: (category: string) => void;
  onAddManualCategory: (category: string) => void;
  onRemoveManualCategory: (category: string) => void;
  onGenerateCategories: () => void;
  setCategorySearchTerm: (term: string) => void;
  setShowCategorySelector: (show: boolean) => void;
}

/**
 * Component for managing merchant categories
 * Handles existing, generated, and manual category management
 */
export default function CategoryManager({
  existingCategories,
  generatedCategories,
  manualCategories,
  availableCategories,
  categorySearchTerm,
  showCategorySelector,
  loadingExistingCategories,
  generatingCategories,
  merchantForm,
  onRemoveExistingCategory,
  onRemoveGeneratedCategory,
  onAddManualCategory,
  onRemoveManualCategory,
  onGenerateCategories,
  setCategorySearchTerm,
  setShowCategorySelector
}: CategoryManagerProps) {
  const filteredAvailableCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(categorySearchTerm.toLowerCase()) &&
    !manualCategories.includes(category) &&
    !generatedCategories.includes(category) &&
    !existingCategories.includes(category)
  );

  return (
    <div className="space-y-4">
      {/* Existing Categories Display */}
      {!loadingExistingCategories && existingCategories.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-800">Current Categories</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {existingCategories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => onRemoveExistingCategory(category)}
                  className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                  title="Remove category from merchant"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Categories currently associated with this merchant. Click the minus icon to remove categories.
          </p>
        </div>
      )}

      {/* Generate Categories Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onGenerateCategories}
          disabled={generatingCategories || !merchantForm.seller_description.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingCategories ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate More Categories
            </>
          )}
        </button>
      </div>

      {/* Generated Categories Display */}
      {generatedCategories.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-medium text-purple-800">Generated Categories</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {generatedCategories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => onRemoveGeneratedCategory(category)}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full transition-colors"
                  title="Remove category"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            These categories will be added to this merchant when saved.
          </p>
        </div>
      )}

      {/* Manual Category Selection */}
      <div className="bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-medium text-green-800">Additional Categories</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowCategorySelector(!showCategorySelector)}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        </div>

        {/* Category Selector */}
        {showCategorySelector && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            {categorySearchTerm && filteredAvailableCategories.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {filteredAvailableCategories.slice(0, 10).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onAddManualCategory(category)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Manual Categories */}
        {manualCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {manualCategories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {category}
                <button
                  type="button"
                  onClick={() => onRemoveManualCategory(category)}
                  className="ml-1 p-0.5 hover:bg-green-200 rounded-full transition-colors"
                  title="Remove category"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-green-600">
            No additional categories selected. Click "Add Category" to select from the catalog.
          </p>
        )}
      </div>
    </div>
  );
}