import React, { useState } from 'react';
import { } from 'react-router-dom';
import StaticRealTimeViewer from '../components/RealTimeFeed/StaticRealTimeViewer';
import { useTheme } from '../hooks/useTheme';
import type { RealTimeProduct } from '../lib/realTimeService';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/supabase';
import ProductSearchComponent from '../components/ProductSearchComponent';

// Partial merchant shape returned by lightweight select
interface MerchantPartial {
  id: string;
  full_name?: string;
  phone_number?: string | null;
  email?: string | null;
  school_name?: string | null;
}

export default function ProductSearchPage() {
  const { currentTheme } = useTheme();
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [showViewer, setShowViewer] = useState(false);

  // Handler to receive search results from ProductSearchComponent
  const handleResults = async (results: Product[]) => {
    // Collect merchant ids from results
    const merchantIds = Array.from(new Set(results.map((r) => r.merchant_id).filter(Boolean)));

    // Fetch merchant records from Supabase if we have merchant ids
  let merchantsById: Record<string, MerchantPartial> = {};
    if (merchantIds.length > 0) {
      try {
        const { data: merchantsData, error } = await supabase
          .from('merchants')
          .select('id, full_name, phone_number, email, school_name')
          .in('id', merchantIds as string[]);

        if (!error && Array.isArray(merchantsData)) {
          // merchantsData may not match the full Merchant shape; store key fields keyed by id
          merchantsById = (merchantsData as MerchantPartial[]).reduce((acc: Record<string, MerchantPartial>, m: MerchantPartial) => {
            if (m && m.id) acc[m.id] = m;
            return acc;
          }, {} as Record<string, MerchantPartial>);
        } else {
          console.warn('Could not fetch merchants for product search:', error);
        }
      } catch (err) {
        console.error('Error fetching merchants for product search:', err);
      }
    }

    // Normalize results into RealTimeProduct shape for the viewer
  const normalized: RealTimeProduct[] = results.map((r, i) => ({
      id: r.id || `ps-${i}`,
      title: r.product_description || 'Product',
      description: r.product_description || '',
      media_url: (r.image_urls && r.image_urls[0]) || '',
      // media_type: r.media_type || (r.image_urls && r.image_urls.length ? 'image' : 'image'),
      is_text_post: false,
      price: Number(r.product_price) || 0,
      // location: r.location || '',
      // category: r.product_category || '',
      expires_at: new Date().toISOString(),
  merchant: (r as Product & { merchant?: MerchantPartial }).merchant || (r.merchant_id ? merchantsById[r.merchant_id] || { id: r.merchant_id, full_name: r.merchant_name || '' } : undefined)
    } as RealTimeProduct));

    setProducts(normalized);
    setShowViewer(true);
  };

  return (
    <div style={{ backgroundColor: currentTheme.background }} className="min-h-screen transition-colors duration-300">
      <div className="w-full max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Product Search</h1>
  <ProductSearchComponentWithCallback onResults={handleResults} />
      </div>

      {showViewer && (
        <StaticRealTimeViewer products={products} onClose={() => setShowViewer(false)} />
      )}
    </div>
  );
}

// Small wrapper that exposes a callback prop from ProductSearchComponent
function ProductSearchComponentWithCallback({ onResults }: { onResults: (r: Product[]) => Promise<void> | void }) {
  // Small inline search form that calls the same edge function used elsewhere
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('semantic-search', { body: { request_text: searchQuery } });
      if (functionError) throw functionError;
  const results = (data && data.results) || [];
  // allow async handler
  await (onResults(results as Product[]) as Promise<void> | void);
    } catch (err) {
      console.error(err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSearch} className="space-y-4">
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full p-3 rounded border" />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
        <button type="button" onClick={() => { setSearchQuery(''); setError(null); }} className="px-4 py-2 border rounded">Clear</button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </form>

    <ProductSearchComponent />
    </>
  );
}
