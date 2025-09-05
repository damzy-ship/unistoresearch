import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Merchant, supabase } from '../../../lib/supabase';
import { processSellerCategories, getMerchantCategories, getAllCategories } from '../../../lib/categoryService';
import CustomAlert from '../CustomAlert';
import { getActiveSchools } from '../../../lib/schoolService';
import { School as SchoolType} from '../../../lib/supabase';
import MerchantEditForm from './MerchantEditForm';
import CategoryManager from './CategoryManager';
import BillingManager from './BillingManager';
import ProductGallery from './ProductGallery';

interface MerchantEditProps {
  merchant: Merchant;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Main component for editing merchant information
 * Combines form editing with category management
 */
export default function MerchantEdit({ merchant, onClose, onSuccess }: MerchantEditProps) {
  const [merchantForm, setMerchantForm] = useState({
    email: merchant.email,
    full_name: merchant.full_name,
    phone_number: merchant.phone_number,
    school_name: merchant.school_name,
    seller_description: merchant.seller_description,
    billing_date: (merchant as any).billing_date || '',
    is_billing_active: (merchant as any).is_billing_active ?? true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [generatingCategories, setGeneratingCategories] = useState(false);
  const [generatedCategories, setGeneratedCategories] = useState<string[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [manualCategories, setManualCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [loadingExistingCategories, setLoadingExistingCategories] = useState(true);
  const [schools, setSchools] = useState<SchoolType[]>([]);
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

  // Load existing categories and available categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingExistingCategories(true);
      try {
        const [categories, allCategories, activeSchools] = await Promise.all([
          getMerchantCategories(merchant.id, merchant.seller_description),
          getAllCategories(),
          getActiveSchools()
        ]);
        
        setExistingCategories(categories);
        setAvailableCategories(allCategories.map(cat => cat.name));
        setSchools(activeSchools);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingExistingCategories(false);
      }
    };

    fetchData();
  }, [merchant.id, merchant.seller_description]);

  const handleRemoveExistingCategory = async (categoryToRemove: string) => {
    try {
      const { data: categoryData } = await supabase
        .from('product_categories')
        .select('id')
        .eq('name', categoryToRemove)
        .single();

      if (categoryData) {
        const { error } = await supabase
          .from('merchant_categories')
          .delete()
          .eq('merchant_id', merchant.id)
          .eq('category_id', categoryData.id);

        if (error) {
          throw error;
        }

        setExistingCategories(prev => prev.filter(category => category !== categoryToRemove));
        
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Category Removed',
          message: `Category "${categoryToRemove}" has been removed from this merchant.`
        });
      }
    } catch (error) {
      console.error('Error removing category:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Removing Category',
        message: 'Failed to remove category. Please try again.'
      });
    }
  };

  const handleRemoveGeneratedCategory = (categoryToRemove: string) => {
    setGeneratedCategories(prev => prev.filter(category => category !== categoryToRemove));
  };

  const handleAddManualCategory = (categoryToAdd: string) => {
    if (!manualCategories.includes(categoryToAdd) && 
        !generatedCategories.includes(categoryToAdd) && 
        !existingCategories.includes(categoryToAdd)) {
      setManualCategories(prev => [...prev, categoryToAdd]);
      setCategorySearchTerm('');
      setShowCategorySelector(false);
    }
  };

  const handleRemoveManualCategory = (categoryToRemove: string) => {
    setManualCategories(prev => prev.filter(category => category !== categoryToRemove));
  };

  const getAllNewCategories = () => {
    return [...generatedCategories, ...manualCategories];
  };

  const handleGenerateCategories = async () => {
    if (!merchantForm.seller_description.trim()) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Missing Description',
        message: 'Please enter a seller description first'
      });
      return;
    }

    setGeneratingCategories(true);
    try {
      const result = await processSellerCategories(merchantForm.seller_description);
      
      if (result.success) {
        const newCategories = result.categories.filter(cat => 
          !existingCategories.includes(cat)
        );
        setGeneratedCategories(newCategories);
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Category Generation Failed',
          message: `Failed to generate categories: ${result.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error generating categories:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Generating Categories',
        message: 'Error generating categories. Please try again.'
      });
    } finally {
      setGeneratingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('merchants')
        .update(merchantForm)
        .eq('id', merchant.id);

      if (updateError) {
        if (updateError.code === '23505') {
          setAlert({
            isOpen: true,
            type: 'warning',
            title: 'Email Already Exists',
            message: 'A merchant with this email already exists.'
          });
        } else {
          throw updateError;
        }
        return;
      } else {
        const newCategories = getAllNewCategories();
        
        if (newCategories.length > 0) {
          try {
            for (const categoryName of newCategories) {
              await supabase
                .from('product_categories')
                .upsert({ name: categoryName }, { onConflict: 'name' });
            }

            const { data: categoryData } = await supabase
              .from('product_categories')
              .select('id, name')
              .in('name', newCategories);
            
            if (categoryData && categoryData.length > 0) {
              const merchantCategories = categoryData.map(category => ({
                merchant_id: merchant.id,
                category_id: category.id
              }));
              
              const { error: categoryError } = await supabase
                .from('merchant_categories')
                .upsert(merchantCategories, { 
                  onConflict: 'merchant_id,category_id',
                  ignoreDuplicates: true 
                });
              
              if (categoryError) {
                console.error('Error storing new categories:', categoryError);
                setAlert({
                  isOpen: true,
                  type: 'warning',
                  title: 'Partial Success',
                  message: 'Merchant updated successfully, but some new categories could not be associated.'
                });
              }
            }
          } catch (categoryError) {
            console.error('Error processing new categories:', categoryError);
            setAlert({
              isOpen: true,
              type: 'warning',
              title: 'Partial Success',
              message: 'Merchant updated successfully, but new categories could not be processed.'
            });
          }
        }

        onSuccess();
      }
    } catch (error) {
      console.error('Error updating merchant:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Update Error',
        message: 'Error updating merchant. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Merchant</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seller ID Display */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Seller ID</p>
            <p className="text-lg font-mono font-bold text-gray-900">{merchant.seller_id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MerchantEditForm
            merchantForm={merchantForm}
            setMerchantForm={setMerchantForm}
            schools={schools}
          />

          <CategoryManager
            existingCategories={existingCategories}
            generatedCategories={generatedCategories}
            manualCategories={manualCategories}
            availableCategories={availableCategories}
            categorySearchTerm={categorySearchTerm}
            showCategorySelector={showCategorySelector}
            loadingExistingCategories={loadingExistingCategories}
            generatingCategories={generatingCategories}
            merchantForm={merchantForm}
            onRemoveExistingCategory={handleRemoveExistingCategory}
            onRemoveGeneratedCategory={handleRemoveGeneratedCategory}
            onAddManualCategory={handleAddManualCategory}
            onRemoveManualCategory={handleRemoveManualCategory}
            onGenerateCategories={handleGenerateCategories}
            setCategorySearchTerm={setCategorySearchTerm}
            setShowCategorySelector={setShowCategorySelector}
          />
          
          {/* Product Gallery */}
          <ProductGallery merchantId={merchant.id} />

          {/* Billing Management */}
          <BillingManager 
            merchantId={merchant.id}
            merchantName={merchant.full_name}
            merchantEmail={merchant.email}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>

        <CustomAlert
          isOpen={alert.isOpen}
          onClose={() => setAlert({ ...alert, isOpen: false })}
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      </div>
    </div>
  );
}