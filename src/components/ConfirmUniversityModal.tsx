import { useState, useEffect } from 'react';
import UniversitySelector from './UniversitySelector';
import { AppDrawer } from './ui/Drawer';
import { Button } from './ui/Button';

interface ConfirmUniversityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchoolId?: string | null;
  onConfirm: (schoolId: string) => void;
}

export default function ConfirmUniversityModal({ isOpen, onClose, initialSchoolId, onConfirm }: ConfirmUniversityModalProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<string>(initialSchoolId || '');

  useEffect(() => {
    setSelectedUniversity(initialSchoolId || '');
  }, [initialSchoolId]);

  return (
    <AppDrawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Confirm your university"
      description="Select your university to continue finding products and services near you."
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4">
          <UniversitySelector
            selectedUniversity={selectedUniversity}
            onUniversityChange={(id) => setSelectedUniversity(id)}
          />
        </div>

        <div className="mt-auto pt-4">
          <Button
            onClick={() => {
              if (selectedUniversity) onConfirm(selectedUniversity);
            }}
            disabled={!selectedUniversity}
            className="w-full"
            variant="primary"
          >
            Confirm University
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
}

