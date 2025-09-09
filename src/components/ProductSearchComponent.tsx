import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing
import 'swiper/css'; // Keep Swiper styles if needed elsewhere, but they are not used in this component anymore
import UniversitySelector from './UniversitySelector';
import { useTheme } from '../hooks/useTheme';
import { History } from 'lucide-react';
import { transformDescriptionForEmbedding } from '../lib/generateEmbedding';

// Product interface remains the same
interface Product {
  product_description: string;
  product_price: string;
  is_available: boolean;
  image_urls: string[];
  merchant_id: string;
  full_name: string;
  phone_number: string;
  school_id: string;
  school_name: string;
  school_short_name: string;
  similarity: number;
}

function ProductSearchComponent() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [university, setUniversity] = useState("684c03a5-a18d-4df9-b064-0aaeee2a5f01");
  const navigate = useNavigate(); // Get the navigate function from react-router-dom
  const { currentTheme } = useTheme();

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const enhancedDescription = await transformDescriptionForEmbedding(searchQuery);

    try {
      // Step 1: Call the Supabase Edge Function to get products
      const { data, error: functionError } = await supabase.functions.invoke('semantic-search', {
        body: { request_text: enhancedDescription, school_id: university },
      });

      if (functionError) {
        throw functionError;
      }

      const products: Product[] = data?.results || [];

      // Step 2: Store results and navigate to the new page
      // You can store the results in state management (like Redux, Zustand) or pass them via route state
      // For this example, we'll use route state to keep it simple.
      navigate('/search-results', { state: { products, searchQuery } });

    } catch (err) {
      console.error('Error during search:', err);
      setError('An error occurred while fetching search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative px-3 z-10 w-full max-w-2xl mx-auto">
      <div
        className="p-8 shadow-xl border border-gray-100 rounded-2xl transition-colors duration-300"
        style={{ backgroundColor: 'white' }} // Using white as a placeholder for currentTheme.surface
      >
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-6">
            <UniversitySelector
              selectedUniversity={university}
              onUniversityChange={setUniversity}
            />
            {/* Search Input with updated styling */}
            <div className="relative">
              <textarea
                placeholder="I need tote bags below 5000 naira" // Matches the original search component's placeholder
                className={`focus:ring-2 focus:ring-${currentTheme.primaryTsFormat} focus:border-${currentTheme.primaryTsFormat} w-full min-h-[120px] p-4 border-2 rounded-xl resize-none text-base transition-all duration-200 placeholder-gray-400`}
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.primary,
                  color: currentTheme.text,
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button with updated styling */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  Find Products
                </>
              )}
            </button>
          </div>
        </form>

        {error && <p className="text-center text-red-500 font-medium mt-4">{error}</p>}

        {/* Past Requests Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/past-requests')}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{
              color: currentTheme.textSecondary,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.text}
            onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.textSecondary}
          >
            <History className="w-4 h-4" />
            View past requests
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductSearchComponent;

//  <div className="relative px-3 z-10 w-full max-w-2xl mx-auto">
//             <div 
//               className="p-8 shadow-xl border border-gray-100 rounded-2xl transition-colors duration-300"
//               style={{ backgroundColor: currentTheme.surface }}
//             >
//               <form onSubmit={handleSearchRequest} className="space-y-6">
//                 <div className="space-y-6">
//                   {/* University Selection */}
//                   <UniversitySelector
//                     selectedUniversity={university}
//                     onUniversityChange={setUniversity}
//                   />

//                   {/* Request Textarea */}
//                   <div className="relative">
//                     <textarea
//                     // focus:ring-${currentTheme.primary} focus:border-${currentTheme.primary}
//                       placeholder="I need tote bags below 5000 naira"
//                       className={`focus:ring-2 focus:ring-${currentTheme.primaryTsFormat} focus:border-${currentTheme.primaryTsFormat} w-full min-h-[120px] p-4 border-2 rounded-xl resize-none text-base transition-all duration-200 placeholder-gray-400`}
//                       // style={{
//                         //   color: currentTheme.text
//                         // }}
//                         style={{
//                           backgroundColor: currentTheme.background,
//                           borderColor: currentTheme.primary,
//                           color: currentTheme.text,
                  
//                           // focusBorderColor: currentTheme.primary,
//                       }}
//                       value={request}
//                       onChange={(e) => setRequest(e.target.value)}
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <div className="flex flex-col gap-3 pt-2">
//                   <button
//                     type="submit"
//                     className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}
//                   >
//                     <Send className="mr-2 h-4 w-4" />
//                     Find Sellers
//                   </button>
//                 </div>
//               </form>
              
//               {/* Past Requests Link */}
//               <div className="mt-4 text-center">
//                 <button
//                   onClick={() => navigate('/past-requests')}
//                   className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
//                   style={{ 
//                     color: currentTheme.textSecondary,
//                   }}
//                   onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.text}
//                   onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.textSecondary}
//                 >
//                   <History className="w-4 h-4" />
//                   View past requests
//                 </button>
//               </div>
//             </div>
//           </div>