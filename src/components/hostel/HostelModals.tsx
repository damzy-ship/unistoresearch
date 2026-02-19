import React from 'react';
import ConfirmUniversityModal from '../ConfirmUniversityModal';
import AuthModal from '../AuthModal';
import ConfirmContactModal from '../ConfirmContactModal';
import ImageModal from './ImageModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { CouponGameModal } from './CouponGameModal';
import MerchantProfileModal from './MerchantProfileModal';
import RequestDetailsModal from './RequestDetailsModal';
import EditProductUpdateModal from './EditProductUpdateModal';
import { HostelsProductUpdates, UniqueVisitor, Coupon, Product } from '../../lib/supabase';

interface HostelModalsProps {
    confirmUniversityModalOpen: boolean;
    setConfirmUniversityModalOpen: (open: boolean) => void;
    onConfirmUniversity: (schoolId: string) => void;

    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;

    showConfirmContactModal: boolean;
    setShowConfirmContactModal: (show: boolean) => void;
    pendingContactProduct: HostelsProductUpdates | null;

    imageModalOpen: boolean;
    setImageModalOpen: (open: boolean) => void;
    imageModalImages: string[];
    imageModalActive: number;
    setImageModalActive: (index: number) => void;
    imageModalDescription?: string;

    deleteModalOpen: boolean;
    setDeleteModalOpen: (open: boolean) => void;
    handleDeleteConfirm: () => void;
    deleting: boolean;

    couponModalOpen: boolean;
    setCouponModalOpen: (open: boolean) => void;
    handleGameCouponClaimed: (coupon: Coupon) => void;
    selectedSchoolId: string | null;
    currentVisitorId?: string;
    activeCoupon?: Coupon | null;

    merchantModalOpen: boolean;
    setMerchantModalOpen: (open: boolean) => void;
    selectedMerchant: UniqueVisitor | null;
    currentVisitor?: UniqueVisitor | null;
    onProductClick: (product: HostelsProductUpdates) => void;

    showBecomeMerchantModal: boolean;
    setShowBecomeMerchantModal: (show: boolean) => void;
    userIsHostelMerchant: boolean;
    onContactSeller: (product: HostelsProductUpdates) => void;

    // Request Details Modal Props
    requestModalOpen: boolean;
    setRequestModalOpen: (open: boolean) => void;
    selectedRequest: HostelsProductUpdates | null;
    onFulfillRequest?: (item: HostelsProductUpdates) => void;
    onDeleteRequest?: (item: HostelsProductUpdates) => void;
    onRequestContact?: (type: 'merchant' | 'recommend', item: HostelsProductUpdates) => void;

    // New props for Edit Modal
    editUpdateModalOpen: boolean;
    setEditUpdateModalOpen: (open: boolean) => void;
    selectedUpdateForEdit: HostelsProductUpdates | null;
    onUpdateSuccess: (updatedItem: HostelsProductUpdates) => void;
}

export const HostelModals: React.FC<HostelModalsProps> = ({
    confirmUniversityModalOpen,
    setConfirmUniversityModalOpen,
    onConfirmUniversity,
    showAuthModal,
    setShowAuthModal,
    showConfirmContactModal,
    setShowConfirmContactModal,
    pendingContactProduct,
    imageModalOpen,
    setImageModalOpen,
    imageModalImages,
    imageModalActive,
    setImageModalActive,
    imageModalDescription,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeleteConfirm,
    deleting,
    couponModalOpen,
    setCouponModalOpen,
    handleGameCouponClaimed,
    selectedSchoolId,
    currentVisitorId,
    activeCoupon,
    merchantModalOpen,
    setMerchantModalOpen,
    selectedMerchant,
    currentVisitor,
    onProductClick,
    showBecomeMerchantModal,
    setShowBecomeMerchantModal,
    onContactSeller,
    requestModalOpen,
    setRequestModalOpen,
    selectedRequest,
    onFulfillRequest,
    onDeleteRequest,
    onRequestContact,
    editUpdateModalOpen,
    setEditUpdateModalOpen,
    selectedUpdateForEdit,
    onUpdateSuccess
}) => {
    return (
        <>
            <ConfirmUniversityModal
                isOpen={confirmUniversityModalOpen}
                onClose={() => setConfirmUniversityModalOpen(false)}
                onConfirm={onConfirmUniversity}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => { }}
            />

            <ConfirmContactModal
                isOpen={showConfirmContactModal}
                onClose={() => setShowConfirmContactModal(false)}
                onConfirm={() => pendingContactProduct && onContactSeller(pendingContactProduct)}
                product={pendingContactProduct ? {
                    id: pendingContactProduct.id,
                    product_description: pendingContactProduct.post_description,
                    product_price: pendingContactProduct.price?.toString() || '0',
                    discount_price: pendingContactProduct.discount_price?.toString(),
                    image_urls: pendingContactProduct.post_images,
                    full_name: pendingContactProduct.unique_visitors?.full_name || 'Seller',
                    phone_number: pendingContactProduct.unique_visitors?.phone_number || '',
                    school_short_name: pendingContactProduct.unique_visitors?.schools?.short_name,
                    merchant_id: pendingContactProduct.actual_user_id
                } : null}
            />

            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                images={imageModalImages}
                activeIndex={imageModalActive}
                description={imageModalDescription}
                onIndexChange={setImageModalActive}
            />

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                deleting={deleting}
            />

            <CouponGameModal
                isOpen={couponModalOpen}
                onClose={() => setCouponModalOpen(false)}
                onCouponClaimed={handleGameCouponClaimed}
                schoolId={selectedSchoolId || ''}
                userId={currentVisitorId}
                activeCoupon={activeCoupon}
            />

            <MerchantProfileModal
                isOpen={merchantModalOpen}
                onClose={() => setMerchantModalOpen(false)}
                merchant={selectedMerchant}
                currentVisitor={currentVisitor}
                onProductClick={onProductClick}
            />

            <RequestDetailsModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                request={selectedRequest}
                currentVisitor={currentVisitor}
                onContact={(type, item) => onRequestContact ? onRequestContact(type, item) : onContactSeller(item)}
                onFulfill={onFulfillRequest}
                onDelete={onDeleteRequest}
            />

            <EditProductUpdateModal
                isOpen={editUpdateModalOpen}
                onClose={() => setEditUpdateModalOpen(false)}
                update={selectedUpdateForEdit}
                onUpdateSuccess={onUpdateSuccess}
            />

            {/* Become Merchant Modal - Simple inline or separate component if complex */}
            {showBecomeMerchantModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl max-w-sm w-full text-center">
                        <div className="text-4xl mb-4">🏪</div>
                        <h3 className="text-xl font-bold text-white mb-2">Become a Seller!</h3>
                        <p className="text-gray-400 mb-6">
                            Start selling your products to students in your hostel and campus.
                            It's free to start!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowBecomeMerchantModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Maybe Later
                            </button>
                            <a
                                href="/hostel-merchant-onboarding" // Assuming this route exists or logic
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
                            >
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
