import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import Header from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import HorizontalProductList from '../components/HorizontalProductList';
import VerticalProductList from '../components/VerticalProductList';

export default function HostelHomePage() {
  const { currentTheme } = useTheme();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('selectedSchoolId');
    if (storedId) setSelectedSchoolId(storedId);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start py-6"
      style={{ backgroundColor: currentTheme.background }}
    >
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-2xl mx-auto px-2">
        <Header />
      </div>

      <div className="w-full max-w-5xl mx-auto px-2 mt-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: currentTheme.primary }}>Hostel Market</h1>
        <p className="text-sm mb-6" style={{ color: currentTheme.text }}>
          Discover items listed by hostel merchants near you.
        </p>

        {selectedSchoolId && (
          <>
            <HorizontalProductList showFeatured={true} schoolId={selectedSchoolId} />
            <div className="mt-4" />
            <VerticalProductList categoryId="5f3cefb7-5833-4605-a647-9a077a308d8d" schoolId={selectedSchoolId} />
          </>
        )}
      </div>
    </main>
  );
}


