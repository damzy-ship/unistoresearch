import React, { useState, useEffect, useRef } from 'react';

interface AnimatedGreetingProps {
  text: string;
  className?: string;
}

export default function AnimatedGreeting({ text, className = '' }: AnimatedGreetingProps) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Validate text to prevent issues
    if (!text || typeof text !== 'string') {
      setDisplayText('Welcome! Search for what you need today.');
      setIsAnimating(false);
      return;
    }

    // Reset state for new text
    setDisplayText('');
    setIsAnimating(true);
    
    // Typing animation
    let currentIndex = 0;
    animationRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        setIsAnimating(false);
      }
    }, 40); // Slightly faster typing

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [text]);

  return (
    <div className={`font-medium text-base ${className}`}>
      <span className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
        {displayText}
      </span>
      {isAnimating && (
        <span className="inline-block w-1 h-5 ml-0.5 bg-orange-500 animate-blink"></span>
      )}
    </div>
  );
}