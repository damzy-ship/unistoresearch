import React from 'react';
import { Mail, User, Phone, School, FileText } from 'lucide-react';
import { School as SchoolType } from '../../../lib/supabase';
import BillingDateManager from './BillingDateManager';

interface MerchantEditFormProps {
  merchantForm: {
    email: string;
    full_name: string;
    phone_number: string;
    school_name: string;
    seller_description: string;
    billing_date: string;
    is_billing_active: boolean;
  };
  setMerchantForm: (form: any) => void;
  schools: SchoolType[];
}

/**
 * Form component for editing merchant basic information
 * Handles email, name, phone, school, and description fields
 */
export default function MerchantEditForm({ 
  merchantForm, 
  setMerchantForm, 
  schools 
}: MerchantEditFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="w-4 h-4 inline mr-1" />
          Email Address
        </label>
        <input
          type="email"
          value={merchantForm.email}
          onChange={(e) => setMerchantForm({...merchantForm, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          placeholder="merchant@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-1" />
          Full Name
        </label>
        <input
          type="text"
          value={merchantForm.full_name}
          onChange={(e) => setMerchantForm({...merchantForm, full_name: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="w-4 h-4 inline mr-1" />
          Phone Number
        </label>
        <input
          type="tel"
          value={merchantForm.phone_number}
          onChange={(e) => setMerchantForm({...merchantForm, phone_number: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          placeholder="+234 123 456 7890"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <School className="w-4 h-4 inline mr-1" />
          School Name
        </label>
        <select
          value={merchantForm.school_name}
          onChange={(e) => setMerchantForm({...merchantForm, school_name: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          required
        >
          {schools.map((school) => (
            <option key={school.id} value={school.name}>{school.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Seller Description
        </label>
        <textarea
          value={merchantForm.seller_description}
          onChange={(e) => setMerchantForm({...merchantForm, seller_description: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
          rows={3}
          placeholder="Brief description of products/services offered..."
          required
        />
      </div>

      <BillingDateManager
        billingDate={merchantForm.billing_date}
        isBillingActive={merchantForm.is_billing_active}
        onBillingDateChange={(date) => setMerchantForm({...merchantForm, billing_date: date})}
        onBillingActiveChange={(active) => setMerchantForm({...merchantForm, is_billing_active: active})}
      />
    </div>
  );
}