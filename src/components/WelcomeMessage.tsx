import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AnimatedGreeting from './AnimatedGreeting';

interface WelcomeMessageProps {
  className?: string;
}

export default function WelcomeMessage({ className = '' }: WelcomeMessageProps) {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  // const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserAndGenerateMessage = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // Default message for unauthenticated users
          setMessage('Welcome! Search for what you need today.');
          setLoading(false);
          return;
        }
        
        // Get user details from unique_visitors
        const { data: visitorData } = await supabase
          .from('unique_visitors')
          .select('full_name')
          .eq('auth_user_id', session.user.id)
          .single();
        
        const fullName = visitorData?.full_name || session.user.user_metadata?.full_name || '';
        const firstName = fullName ? fullName.split(' ')[0] : '';
        // setUserName(firstName);
        
        // Generate welcome message
        const welcomeMessage = await generateWelcomeMessage(firstName);
        setMessage(welcomeMessage);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage('Welcome back! Search for what you need.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndGenerateMessage();
  }, []);
  
  const generateWelcomeMessage = async (firstName: string): Promise<string> => {
    try {
      // Check if Gemini is available
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return getDefaultWelcomeMessage(firstName);
      }
      
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!API_KEY) {
        return getDefaultWelcomeMessage(firstName);
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const currentTime = new Date();
      const hour = currentTime.getHours();
      const day = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
      const month = currentTime.toLocaleDateString('en-US', { month: 'long' });
      
      // Check if it's a festive period
      const isChristmasSeason = month === 'December' && currentTime.getDate() >= 15;
      const isNewYear = month === 'January' && currentTime.getDate() <= 5;
      const isEaster = isEasterPeriod(currentTime);
      
      let timeOfDay = 'day';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 18) timeOfDay = 'afternoon';
      else timeOfDay = 'evening';
      
      const prompt = `
Generate a short, friendly welcome message for a university marketplace app user.
Include a brief mention about searching for products.

User's first name: ${firstName || 'there'}
Time of day: ${timeOfDay}
Day of week: ${day}
Month: ${month}
Special occasions: ${isChristmasSeason ? 'Christmas season' : isNewYear ? 'New Year' : isEaster ? 'Easter period' : 'None'}

Requirements:
- Keep it under 15 words
- Be warm and friendly
- Use ONLY the user's first name if provided
- Reference the time of day or special occasion if relevant
- Include a brief mention about searching for products
- DO NOT include any placeholder text like [Name] or [Time]
- DO NOT include quotes or any formatting
- Return ONLY the welcome message text, nothing else

Example outputs:
"Good morning, Sarah! Ready to discover campus treasures today?"
"Happy holidays, John! Find what you need in our marketplace."
"Welcome back! Search our marketplace for all your campus needs."
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean up any quotes or extra formatting
      return text.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error generating welcome message:', error);
      // Always fall back to static messages on error
      return getDefaultWelcomeMessage(firstName);
    }
  };
  
  const getDefaultWelcomeMessage = (firstName: string): string => {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    
    let greeting = 'Welcome';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    return firstName 
      ? `${greeting}, ${firstName}! Search for what you need.` 
      : `${greeting}! Search for what you need.`;
  };
  
  const isEasterPeriod = (date: Date): boolean => {
    // Simple check for March/April
    const month = date.getMonth();
    return (month === 2 || month === 3); // March or April
  };
  
  if (loading) {
    return null;
  }
  
  return (
    <AnimatedGreeting text={message} className={className} />
  );
}