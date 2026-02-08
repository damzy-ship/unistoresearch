import { AppDrawer } from '../ui/Drawer';
import { Button } from '../ui/Button';

interface BecomeMerchantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BecomeMerchantDrawer({ isOpen, onClose }: BecomeMerchantDrawerProps) {
    return (
        <AppDrawer
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title="Become a Seller!"
            description="Start selling your products to students in your hostel and campus."
        >
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="text-6xl mb-2">🏪</div>

                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    It's free to start! Reach thousands of students instantly.
                </p>

                <div className="flex flex-col w-full gap-3 mt-6">
                    <Button
                        onClick={() => window.location.href = '/hostel-merchant-onboarding'}
                        className="w-full"
                        variant="primary"
                    >
                        Get Started
                    </Button>

                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full"
                    >
                        Maybe Later
                    </Button>
                </div>
            </div>
        </AppDrawer>
    );
}
