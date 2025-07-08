import React from 'react';
import { ExternalLink } from 'lucide-react';

interface BoltBadgeProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'footer';
}

export default function BoltBadge({ className = '', variant = 'default' }: BoltBadgeProps) {
  const handleClick = () => {
    window.open('https://bolt.new', '_blank', 'noopener,noreferrer');
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors ${className}`}
        title="Built with Bolt.new"
      >
        <span>Built with</span>
        <span className="font-semibold text-orange-600">Bolt.new</span>
        <ExternalLink className="w-3 h-3" />
      </button>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors ${className}`}
        title="Built with Bolt.new"
      >
        <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
          B
        </div>
        <span>Built with Bolt.new</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg ${className}`}
      title="Built with Bolt.new"
    >
      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-sm">
        B
      </div>
      <span>Built with Bolt.new</span>
      <ExternalLink className="w-4 h-4" />
    </button>
  );
}