import { useState, useEffect } from 'react';


const AnnouncementBar = () => {
  const message = "Do not pay to merchant's account number, pay using Unistore payment to ensure you get your product before merchant is credited.";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="announcement-bar-container">
      <div className={`announcement-bar-content ${isMobile ? 'sliding-text' : ''}`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;