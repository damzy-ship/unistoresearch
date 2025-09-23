import { useState } from 'react';
import { Theme } from '../hooks/useTheme';

interface EditBrandNameModalProps {
  currentBrandName: string;
  onClose: () => void;
  onSave: (newBrandName: string | null) => void;
  currentTheme: Theme;
}

export default function EditBrandNameModal({ currentBrandName, onClose, onSave, currentTheme }: EditBrandNameModalProps) {
  const [newBrandName, setNewBrandName] = useState(currentBrandName);

  const handleSave = () => {
    if (newBrandName.trim() === '') {
      onSave(null);
    }else{
        onSave(newBrandName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="rounded-2xl p-8 shadow-lg max-w-lg w-full m-4 transition-all duration-300"
        style={{ backgroundColor: currentTheme.surface, color: currentTheme.text }}
      >
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.primary }}
        >
          Change Brand Name
        </h3>
        <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
          Update the brand name associated with your merchant account.
        </p>
        
        <input
          type="text"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          placeholder="Enter new brand name"
          className="w-full p-3 rounded-lg border focus:outline-none transition-colors duration-200"
          style={{
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.textSecondary + '30',
            color: currentTheme.text,
          }}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.text
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`
            }}
            // disabled={newBrandName.trim() === ''}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}