import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { processSellerCategories, getAllCategories } from '../../../lib/categoryService';
import CustomAlert from '../CustomAlert';
import { getActiveSchools } from '../../../lib/schoolService';
import { School as SchoolType } from '../../../lib/supabase';
import MerchantFormFields from './MerchantFormFields';
import CategorySelection from './CategorySelection';

interface MerchantFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Main component for merchant registration
 * Combines form fields with category selection
 */
export default function MerchantForm({ onClose, onSuccess }: MerchantFormProps) {
  const [merchantForm, setMerchantForm] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    school_name: 'Bingham University',
    seller_description: '',
    billing_date: '',
    is_billing_active: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [generatingCategories, setGeneratingCategories] = useState(false);
  const [generatedCategories, setGeneratedCategories] = useState<string[]>([]);
  const [manualCategories, setManualCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [categories, activeSchools] = await Promise.all([
          getAllCategories(),
          getActiveSchools()
        ]);
        setAvailableCategories(categories.map(cat => cat.name));
        setSchools(activeSchools);
        
        if (activeSchools.length > 0 && !merchantForm.school_name) {
          setMerchantForm(prev => ({ ...prev, school_name: activeSchools[0].name }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchCategories();
  }, []);

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
        setGeneratedCategories(result.categories);
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

  const handleRemoveGeneratedCategory = (categoryToRemove: string) => {
    setGeneratedCategories(prev => prev.filter(category => category !== categoryToRemove));
  };

  const handleAddManualCategory = (categoryToAdd: string) => {
    if (!manualCategories.includes(categoryToAdd) && !generatedCategories.includes(categoryToAdd)) {
      setManualCategories(prev => [...prev, categoryToAdd]);
      setCategorySearchTerm('');
      setShowCategorySelector(false);
    }
  };

  const handleRemoveManualCategory = (categoryToRemove: string) => {
    setManualCategories(prev => prev.filter(category => category !== categoryToRemove));
  };

  const getAllSelectedCategories = () => {
    return [...generatedCategories, ...manualCategories];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('merchants')
        .insert([merchantForm])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setAlert({
            isOpen: true,
            type: 'warning',
            title: 'Email Already Exists',
            message: 'A merchant with this email already exists.'
          });
        } else {
          throw error;
        }
        return;
      } else {
        const allCategories = getAllSelectedCategories();
        
        if (data && allCategories.length > 0) {
          try {
            for (const categoryName of allCategories) {
              await supabase
                .from('product_categories')
                .upsert({ name: categoryName }, { onConflict: 'name' });
            }

            const { data: categories } = await supabase
              .from('product_categories')
              .select('id, name')
              .in('name', allCategories);
            
            if (categories && categories.length > 0) {
              const merchantCategories = categories.map(category => ({
                merchant_id: data.id,
                category_id: category.id
              }));
              
              const { error: categoryError } = await supabase
                .from('merchant_categories')
                .insert(merchantCategories);
              
              if (categoryError) {
                console.error('Error storing merchant categories:', categoryError);
                setAlert({
                  isOpen: true,
                  type: 'warning',
                  title: 'Partial Success',
                  message: 'Merchant registered successfully, but some categories could not be associated.'
                });
              }
            }
          } catch (categoryError) {
            console.error('Error processing merchant categories:', categoryError);
            setAlert({
              isOpen: true,
              type: 'warning',
              title: 'Partial Success',
              message: 'Merchant registered successfully, but categories could not be processed.'
            });
          }
        }
        
        onSuccess();
      }
    } catch (error) {
      console.error('Error registering merchant:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Registration Error',
        message: 'Error registering merchant. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Register New Merchant</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MerchantFormFields
            merchantForm={merchantForm}
            setMerchantForm={setMerchantForm}
            schools={schools}
          />

          <CategorySelection
            generatedCategories={generatedCategories}
            manualCategories={manualCategories}
            availableCategories={availableCategories}
            categorySearchTerm={categorySearchTerm}
            showCategorySelector={showCategorySelector}
            generatingCategories={generatingCategories}
            merchantForm={merchantForm}
            onRemoveGeneratedCategory={handleRemoveGeneratedCategory}
            onAddManualCategory={handleAddManualCategory}
            onRemoveManualCategory={handleRemoveManualCategory}
            onGenerateCategories={handleGenerateCategories}
            setCategorySearchTerm={setCategorySearchTerm}
            setShowCategorySelector={setShowCategorySelector}
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register'}
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