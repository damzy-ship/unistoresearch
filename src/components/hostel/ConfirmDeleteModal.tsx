import { AppDrawer } from '../ui/Drawer';
import { Button } from '../ui/Button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, deleting }: ConfirmDeleteModalProps) {
    return (
        <AppDrawer
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title="Delete Post"
            description="Are you sure you want to delete this post? This action cannot be undone."
        >
            <div className="flex gap-3 justify-end mt-6">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={deleting}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={deleting}
                    loading={deleting}
                    className="flex-1"
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </AppDrawer>
    );
}

