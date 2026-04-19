import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSharedTransition } from '../contexts/SharedTransitionContext';

const SharedTransitionElement: React.FC = () => {
  const { transitionState, endTransition } = useSharedTransition();
  const { sourceRect, imageUrl, isTransitioning, targetPath } = transitionState;
  const location = useLocation();
  const [styles, setStyles] = useState<React.CSSProperties>({});
  
  const isTargetPage = location.pathname === targetPath;

  useEffect(() => {
    if (isTransitioning && sourceRect && imageUrl) {
      // Start position
      setStyles({
        position: 'fixed',
        top: `${sourceRect.top}px`,
        left: `${sourceRect.left}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        zIndex: 9999,
        objectFit: 'cover',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '0.75rem', // From EventCard
      });

      // Animate to destination after a short delay to allow page navigation
      setTimeout(() => {
        if (isTargetPage) {
            setStyles(prev => ({
                ...prev,
                top: 0,
                left: 0,
                width: '100vw',
                height: '50vh', // From EventDetailPage banner
                minHeight: '400px',
                borderRadius: 0,
            }));
        }
      }, 50); // Small delay
    }
    
    // Add cleanup function
    return () => {
        if (isTransitioning) {
            endTransition();
        }
    }
  }, [isTransitioning, sourceRect, imageUrl, isTargetPage, endTransition]);

  if (!isTransitioning || !imageUrl) {
    return null;
  }

  return (
    <img
      src={imageUrl}
      alt="transition element"
      style={styles}
      onTransitionEnd={endTransition}
    />
  );
};

export default SharedTransitionElement;