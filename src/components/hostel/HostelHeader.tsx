import React from 'react';
import { UniqueVisitor } from '../../lib/supabase';

interface HostelHeaderProps {
    currentVisitor: UniqueVisitor | null;
    userIsHostelMerchant: boolean;
}

export const HostelHeader: React.FC<HostelHeaderProps> = ({ currentVisitor, userIsHostelMerchant }) => {
    return (
        <div className="mb-6 mt-2 text-center">
            <h1 className="text-4xl font-bold mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>
                    <span className="text-orange-500">uni</span>
                    <span className="text-blue-600">store.</span>
                </span>
                {(currentVisitor?.is_admin || userIsHostelMerchant) && (
                    <div className="flex items-center gap-1.5 align-middle">
                        {currentVisitor?.is_admin && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-xs border border-rose-200 flex items-center">
                                Admin
                            </span>
                        )}
                        {userIsHostelMerchant && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs border border-blue-200 flex items-center">
                                Seller
                            </span>
                        )}
                    </div>
                )}
            </h1>
            <p className="text-xs font-bold text-gray-400 tracking-[0.3em] uppercase">
                Hostel Mode
            </p>
        </div>
    );
};
