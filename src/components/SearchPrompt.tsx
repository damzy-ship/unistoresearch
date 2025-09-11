import React, { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchPromptProps {
  className?: string;
  university?: string;
}

export default function SearchPrompt({ className = '', university = '' }: SearchPromptProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSearchPrompt = async () => {
      try {
        setLoading(true);
        const searchPrompt = await generateAIPrompt(university);
        setPrompt(searchPrompt);
      } catch (error) {
        console.error('Error generating search prompt:', error);
        setPrompt(getDefaultPrompt(university));
      } finally {
        setLoading(false);
      }
    };
    
    generateSearchPrompt();
  }, [university]);
  
  const generateAIPrompt = async (university: string): Promise<string> => {
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!API_KEY) {
        return getDefaultPrompt(university);
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const prompt = `
Generate a short, compelling prompt to encourage university students to search for products on a marketplace app.

University: ${university || 'Nigerian universities'}

Requirements:
- Keep it under 20 words
- Be engaging and specific
- Mention the variety of products available (1000s)
- If a specific university is mentioned, reference it
- Focus on student needs
- DO NOT include quotes or any formatting
- Return ONLY the search prompt text, nothing else

Example outputs:
"Discover 1000s of products from Bingham University sellers at your fingertips!"
"Need textbooks, gadgets, or snacks? Find 1000s of campus essentials here!"
"Search 1000s of student essentials from trusted university vendors."
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean up any quotes or extra formatting
      return text.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error generating search prompt:', error);
      return getDefaultPrompt(university);
    }
  };
  
  const getDefaultPrompt = (university: string): string => {
    if (university) {
      return `Discover 1000s of products from ${university} University sellers!`;
    }
    return 'Search 1000s of products from your university vendors!';
  };
  
  if (loading || !prompt) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className="w-4 h-4 text-orange-500" />
      <p className="text-gray-600 text-sm">{prompt}</p>
    </div>
  );
}