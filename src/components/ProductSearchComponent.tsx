import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  product_description: string;
  product_price: string;
  is_available: boolean;
  image_urls: string[];
  merchant_id: string;
}

function ProductSearchComponent() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Call the Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('semantic-search', {
        body: { request_text: searchQuery },
      });

      if (functionError) {
        throw functionError;
      }
      
      // The function should return a 'results' key containing the products
      if (data && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }

    } catch (err) {
      console.error('Error during search:', err);
      setError('An error occurred while fetching search results.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Product Search</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for products..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      
      <div className="results-grid">
        {searchResults.length > 0 ? (
          searchResults.map((product, index) => (
            <div key={index} className="product-card">
              {product.image_urls && product.image_urls.length > 0 && (
                <img src={product.image_urls[0]} alt={product.product_description} />
              )}
              <h3>{product.product_description}</h3>
              <p>Price: {product.product_price}</p>
              <p>{product.is_available ? 'In Stock' : 'Out of Stock'}</p>
            </div>
          ))
        ) : (
          !loading && <p>No results found. Try a different query.</p>
        )}
      </div>
    </div>
  );
}

export default ProductSearchComponent;