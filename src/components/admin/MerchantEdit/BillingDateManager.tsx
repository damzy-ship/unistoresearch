import React, { useState } from 'react';
import { Calendar, Clock, CreditCard } from 'lucide-react';

interface BillingDateManagerProps {
  billingDate: string;
  isBillingActive: boolean;
  onBillingDateChange: (date: string) => void;
  onBillingActiveChange: (active: boolean) => void;
}

export default function BillingDateManager({
  billingDate,
  isBillingActive,
  onBillingDateChange,
  onBillingActiveChange
}: BillingDateManagerProps) {
  const [dateMode, setDateMode] = useState<'manual' | 'relative'>('manual');
  const [relativeValue, setRelativeValue] = useState('');
  const [relativeUnit, setRelativeUnit] = useState<'days' | 'weeks' | 'months'>('days');

  const handleRelativeDate = () => {
    if (!relativeValue || isNaN(Number(relativeValue))) return;

    const currentDate = new Date();
    const value = parseInt(relativeValue);

    switch (relativeUnit) {
      case 'days':
        currentDate.setDate(currentDate.getDate() + value);
        break;
      case 'weeks':
        currentDate.setDate(currentDate.getDate() + (value * 7));
        break;
      case 'months':
        currentDate.setMonth(currentDate.getMonth() + value);
        break;
    }

    const formattedDate = currentDate.toISOString().split('T')[0];
    onBillingDateChange(formattedDate);
  };

  return (
    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
      <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        Billing Settings
      </h4>
      
      <div className="space-y-4">
        {/* Date Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDateMode('manual')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              dateMode === 'manual'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manual Date
          </button>
          <button
            type="button"
            onClick={() => setDateMode('relative')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              dateMode === 'relative'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Relative Date
          </button>
        </div>

        {dateMode === 'manual' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Billing Due Date
            </label>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => onBillingDateChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Set Due Date From Now
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={relativeValue}
                onChange={(e) => setRelativeValue(e.target.value)}
                placeholder="Enter number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="1"
              />
              <select
                value={relativeUnit}
                onChange={(e) => setRelativeUnit(e.target.value as 'days' | 'weeks' | 'months')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
              <button
                type="button"
                onClick={handleRelativeDate}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Set
              </button>
            </div>
            {billingDate && (
              <p className="text-xs text-gray-600 mt-1">
                Current due date: {new Date(billingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-600">
          Sellers with due billing dates will be excluded from search results
        </p>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_billing_active"
            checked={isBillingActive}
            onChange={(e) => onBillingActiveChange(e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <label htmlFor="is_billing_active" className="text-sm font-medium text-gray-700">
            Billing system active
          </label>
        </div>
      </div>
    </div>
  );
}