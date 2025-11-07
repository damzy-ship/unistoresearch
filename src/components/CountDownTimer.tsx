import React, { useState, useEffect, FC } from 'react';

// Define the target date: Next week Friday at 00:00:00
// Current date: Thursday, Oct 30, 2025
// Next Friday: Nov 7, 2025
const TARGET_DATE: number = new Date('2025-11-07T22:00:00').getTime(); // Using 'number' for the timestamp

// --- Interfaces for Type Safety ---

/**
 * Interface for the structure of the calculated time remaining state.
 */
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/**
 * Interface for the props of the TimerSegment component.
 */
interface TimerSegmentProps {
  value: number;
  label: string;
}

/**
 * Interface for the props of the CountdownTimer component.
 */
interface CountdownTimerProps {
  toggleHostelMode: () => void;
  navigate: (path: string) => void;
}

// --- Helper function with explicit return type ---

/**
 * Helper function to calculate time remaining
 * @returns {TimeRemaining} The calculated days, hours, minutes, seconds, and expired status.
 */
const calculateTimeRemaining = (): TimeRemaining => {
  const now: number = new Date().getTime();
  const distance: number = TARGET_DATE - now;

  // If the countdown is finished, return zeros
  if (distance < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  // Time calculations for days, hours, minutes and seconds
  const days: number = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours: number = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes: number = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds: number = Math.floor((distance % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: false };
};

// --- Component with type definitions ---

/**
 * Component for a single time segment (e.g., Days, Hours)
 * @param {TimerSegmentProps} props - The value and label for the segment.
 */
const TimerSegment: FC<TimerSegmentProps> = ({ value, label }) => (
  <div className="flex flex-col items-center p-2 sm:p-3 bg-white border border-orange-300 rounded-lg shadow-md w-1/4 max-w-[90px] mx-1 transform hover:scale-105 transition-transform duration-200 ease-out">
    <span className="text-2xl sm:text-3xl font-extrabold text-orange-700 leading-tight drop-shadow-sm">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs text-gray-700 uppercase mt-1 tracking-wider">
      {label}
    </span>
  </div>
);

/**
 * Main Countdown Timer Component.
 */
const CountdownTimer: FC<CountdownTimerProps> = ({ toggleHostelMode, navigate }) => {
  // Use TimeRemaining interface for the state type
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining());

  useEffect(() => {
    // TypeScript automatically infers the return type of setInterval is a NodeJS.Timeout or number, 
    // but explicitly typing it as number (for browser environments) is safer for clearInterval.
    const timer: number = window.setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => window.clearInterval(timer);
  }, []);

  const { days, hours, minutes, seconds, expired } = timeRemaining;

  // The rest of the component is standard JSX
  return (
    <div className="w-full font-sans p-4 sm:p-6 mb-6 bg-gradient-to-r from-orange-400 to-red-500 text-white border-b-4 border-orange-600 shadow-xl overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20 z-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          animation: 'pulse 5s infinite alternate'
      }}></div>
      <div className="absolute inset-0 opacity-10 z-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '20px 20px'
      }}></div>


      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-4 relative z-10">

        {/* Countdown Display */}
        {expired ? (
          // --- MODIFIED BLOCK ---
          // Show the "LIVE" message and a separate link-style button
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white p-4 rounded-lg bg-orange-700 shadow-inner">
              🎉 Hostel Mode is LIVE! 🎉
            </div>
            <button
              onClick={() => { 
                toggleHostelMode(); 
                navigate('/'); 
              }}
              className="text-lg font-medium text-white underline hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded py-1 px-2 transition-colors duration-150"
            >
              Explore Now
            </button>
          </div>
          // --- END OF MODIFIED BLOCK ---
        ) : (
          <div className="flex justify-center w-full max-w-md">
            <TimerSegment value={days} label="Days" />
            <TimerSegment value={hours} label="Hrs" />
            <TimerSegment value={minutes} label="Min" />
            <TimerSegment value={seconds} label="Sec" />
          </div>
        )}

        {/* Target Date Information */}
        <p className="text-sm text-white opacity-90 pt-2 font-medium">
          Be ready by: <span className="font-bold text-white">Friday, November 7, 2025</span>
        </p>
      </div>

      {/* Tailwind CSS @keyframe for pulse animation (add to your CSS or global styles if not already present) */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;