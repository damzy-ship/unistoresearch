import { useState, useEffect } from 'react';
import UniversitySelector from './UniversitySelector';
import { useTheme } from '../hooks/useTheme';

interface ConfirmUniversityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchoolId?: string | null;
  onConfirm: (schoolId: string) => void;
}

export default function ConfirmUniversityModal({ isOpen, onClose, initialSchoolId, onConfirm }: ConfirmUniversityModalProps) {
  const { currentTheme } = useTheme();
  const [selectedUniversity, setSelectedUniversity] = useState<string>(initialSchoolId || '');

  useEffect(() => {
    setSelectedUniversity(initialSchoolId || '');
  }, [initialSchoolId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" />

      <div className="relative w-full max-w-lg mx-4 p-6 rounded-2xl" style={{ background: currentTheme.surface }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.text }}>
          Confirm your university
        </h3>

        <div className="mb-6">
          <UniversitySelector
            selectedUniversity={selectedUniversity}
            onUniversityChange={(id) => setSelectedUniversity(id)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          {/* <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-medium border"
            style={{ background: currentTheme.background, color: currentTheme.text }}
          >
            Cancel
          </button> */}

          <button
            onClick={() => {
              if (selectedUniversity) onConfirm(selectedUniversity);
            }}
            className={`px-4 py-2 rounded-xl font-medium text-white`}
            style={{ background: currentTheme.primary }}
          >
            Confirm University
          </button>
        </div>
      </div>
    </div>
  );
}
