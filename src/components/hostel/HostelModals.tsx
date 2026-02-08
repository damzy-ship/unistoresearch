import React from 'react';
import ConfirmUniversityModal from '../ConfirmUniversityModal';
import AuthModal from '../AuthModal';
import ConfirmContactModal from '../ConfirmContactModal';
import ImageModal from './ImageModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { CouponGameModal } from './CouponGameModal';
import MerchantProfileModal from './MerchantProfileModal';
import BecomeMerchantDrawer from './BecomeMerchantDrawer';
import { HostelsProductUpdates, UniqueVisitor, Coupon } from '../../lib/supabase';

interface HostelModalsProps {
    showConfirmUniversityModal: boolean;
    setShowConfirmUniversityModal: (show: boolean) => void;
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
}

export const HostelModals: React.FC<HostelModalsProps> = ({
    showConfirmUniversityModal,
    setShowConfirmUniversityModal,
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
}) => {
    return (
        <>
            <ConfirmUniversityModal
                isOpen={showConfirmUniversityModal}
                onClose={() => setShowConfirmUniversityModal(false)}
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
                product={pendingContactProduct}
                onConfirm={(product) => onContactSeller(product as HostelsProductUpdates)}
            />

            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                images={imageModalImages}
                initialIndex={imageModalActive}
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

            <BecomeMerchantDrawer
                isOpen={showBecomeMerchantModal}
                onClose={() => setShowBecomeMerchantModal(false)}
            />
        </>
    );
};

