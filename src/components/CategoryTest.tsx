import React, { useState, useEffect } from 'react';
import { fetchExistingCategories } from '../lib/categoryService';
import { generateCategoriesFromRequest, findSimilarCategoriesWithAI } from '../lib/gemini';

export default function CategoryTest() {
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [testRequest, setTestRequest] = useState('');
  const [generatedCategories, setGeneratedCategories] = useState<string[]>([]);
  const [matchedCategories, setMatchedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const categories = await fetchExistingCategories();
      setCatalogCategories(categories);
    };
    loadCategories();
  }, []);

  const testMatching = async () => {
    if (!testRequest.trim()) return;
    
    setLoading(true);
    try {
      const result = await generateCategoriesFromRequest(testRequest);
      if (result.success) {
        setGeneratedCategories(result.categories);
        
        if (useAI) {
          const matchResult = await findSimilarCategoriesWithAI(result.categories, catalogCategories);
          setMatchedCategories(matchResult.success ? matchResult.categories : []);
        } else {
          const { findSimilarCategories } = await import('../lib/gemini');
          const matched = findSimilarCategories(result.categories, catalogCategories);
          setMatchedCategories(matched);
        }
      }
    } catch (error) {
      console.error('Error testing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Category Matching Test</h2>
      
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Categories in Database ({catalogCategories.length})</h3>
        <div className="flex flex-wrap gap-2">
          {catalogCategories.map((cat, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Test Request</h3>
        <div className="mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Use AI-powered semantic matching</span>
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testRequest}
            onChange={(e) => setTestRequest(e.target.value)}
            placeholder="Enter a test request..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={testMatching}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : `Test ${useAI ? '(AI)' : '(Basic)'}`}
          </button>
        </div>
      </div>

      {generatedCategories.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Generated Categories</h3>
          <div className="flex flex-wrap gap-2">
            {generatedCategories.map((cat, index) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {matchedCategories.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">
            Matched Categories {useAI ? '(AI Semantic Matching)' : '(Basic Matching)'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map((cat, index) => (
              <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}